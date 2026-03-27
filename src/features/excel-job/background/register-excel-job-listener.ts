import * as XLSX from "xlsx";
import {
  requestBinaryApi,
  requestJsonApi,
} from "@/shared/lib/api/daou-api-client";
import type {
  CheckSessionResponse,
  ExtensionRequest,
  ProcessExcelRequest,
  ProcessExcelResponse,
} from "@/shared/types/excel-job";

type FetchResult =
  | {
      ok: true;
      data: Uint8Array;
      fileName: string;
      contentType: string;
      fetchMode: "background" | "page";
    }
  | {
      ok: false;
      error: string;
      status?: number;
      code?: string;
    };

const EXCEL_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const EXCEL_API_URL =
  "https://digicaps.daouoffice.com/api/attend/normal/work/record/excel/download";
const SESSION_API_URL =
  "https://digicaps.daouoffice.com/eacc/api/ess/user/getSession";

export function registerExcelJobListener() {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionRequest, _, sendResponse) => {
      if (message.type === "CHECK_SESSION") {
        handleCheckSession()
          .then((response) => sendResponse(response))
          .catch((error) =>
            sendResponse({
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error occurred.",
            } satisfies CheckSessionResponse)
          );
        return true;
      }

      if (
        message.type !== "DOWNLOAD_MONTHLY_EXCEL" &&
        message.type !== "COPY_MONTHLY_EXCEL_RANGE"
      ) {
        return;
      }

      handleProcess(message)
        .then((response) => sendResponse(response))
        .catch((error) =>
          sendResponse({
            ok: false,
            error:
              error instanceof Error
                ? error.message
                : "Unknown error occurred.",
          } satisfies ProcessExcelResponse)
        );

      return true;
    }
  );
}

async function handleProcess(
  request: ProcessExcelRequest
): Promise<ProcessExcelResponse> {
  const { month } = request.payload;
  const apiUrl = buildApiUrl(month);

  const fetched = await fetchExcelWithSession(apiUrl, month);
  if (!fetched.ok) {
    return {
      ok: false,
      error: fetched.error,
      status: fetched.status,
      code: fetched.code,
    };
  }

  if (request.type === "DOWNLOAD_MONTHLY_EXCEL") {
    const downloadFileName = sanitizeDownloadFileName(
      `월간근태현황_${month}.xlsx`,
      month
    );
    const downloadId = await downloadExcel(
      fetched.data,
      fetched.contentType,
      downloadFileName
    );
    return {
      ok: true,
      downloadId,
      fileName: downloadFileName,
      fetchMode: fetched.fetchMode,
    };
  }

  const copiedText = extractRangeToTsvForCopy(fetched.data);

  return {
    ok: true,
    copiedText,
    fileName: fetched.fileName,
    fetchMode: fetched.fetchMode,
  };
}

async function handleCheckSession(): Promise<CheckSessionResponse> {
  const result = await requestJsonApi<unknown>(SESSION_API_URL, "POST");
  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      status: result.status,
      code: result.code,
    };
  }
  return { ok: true };
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

function buildApiUrl(month: string): string {
  const accrualDate = normalizeMonthToApiDate(month);
  return `${EXCEL_API_URL}?accrualDate=${encodeURIComponent(
    accrualDate
  )}&workType=MONTHLY`;
}

function normalizeMonthToApiDate(month: string): string {
  if (!MONTH_PATTERN.test(month)) {
    throw new Error("Invalid month format. Use YYYY-MM.");
  }
  return `${month}-01`;
}

async function fetchExcelWithSession(
  apiUrl: string,
  month: string
): Promise<FetchResult> {
  const result = await requestBinaryApi(apiUrl);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: result.data,
    contentType: result.contentType || EXCEL_CONTENT_TYPE,
    fileName: resolveDownloadFileName(result.contentDisposition, month),
    fetchMode: result.fetchMode,
  };
}

function resolveDownloadFileName(
  contentDisposition: string | null,
  month: string
): string {
  const parsed = contentDisposition
    ? parseContentDispositionFileName(contentDisposition)
    : null;
  const rawName = parsed ?? `monthly-report-${month}.xlsx`;
  return sanitizeDownloadFileName(rawName, month);
}

function parseContentDispositionFileName(
  contentDisposition: string
): string | null {
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]).replaceAll('"', "");
  }

  const basicMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return basicMatch?.[1] ?? null;
}

function sanitizeDownloadFileName(fileName: string, month: string): string {
  const noPath = fileName.replace(/[\\/]+/g, "_");
  const cleaned = noPath
    .replace(/[\u0000-\u001f\u007f<>:"|?*]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/, "");

  const fallback = `monthly-report-${month}.xlsx`;
  if (!cleaned) {
    return fallback;
  }

  const hasExtension = /\.[A-Za-z0-9]{1,10}$/.test(cleaned);
  return hasExtension ? cleaned : `${cleaned}.xlsx`;
}

function extractRangeToTsvForCopy(data: Uint8Array): string {
  const workbook = readWorkbookQuietly(data);
  const name = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[name];
  if (!worksheet) {
    throw new Error(`Sheet "${name}" was not found.`);
  }

  const sheetRangeRef = worksheet["!ref"];
  if (!sheetRangeRef) {
    throw new Error("Worksheet range is empty.");
  }
  const sheetRange = XLSX.utils.decode_range(sheetRangeRef);

  const titleRow = findRowByCellText(worksheet, sheetRange, (text) =>
    /월간\s*근태현황/.test(text)
  );
  const summaryRow = findRowByCellText(
    worksheet,
    sheetRange,
    (text) => text === "근로시간 합계"
  );
  const headerRow = findRowByCellText(
    worksheet,
    sheetRange,
    (text) => text === "일자"
  );

  if (titleRow === null || summaryRow === null || headerRow === null) {
    throw new Error("Could not locate title/header/summary rows in worksheet.");
  }
  if (!(titleRow <= headerRow && headerRow < summaryRow)) {
    throw new Error("Invalid row structure for monthly attendance sheet.");
  }

  const headerIndexMap = buildHeaderIndexMap(worksheet, sheetRange, headerRow);
  const requiredHeaders = [
    "일자",
    "출근시간",
    "퇴근시간",
    "총 근로시간",
    "휴가시간",
  ] as const;
  for (const key of requiredHeaders) {
    if (headerIndexMap[key] === undefined) {
      throw new Error(`Required header "${key}" was not found.`);
    }
  }

  const tsvRows: string[][] = [];
  const previewEndCol = sheetRange.s.c + 4;

  for (let row = titleRow; row < headerRow; row += 1) {
    tsvRows.push(readRowByRange(worksheet, row, sheetRange.s.c, previewEndCol));
  }

  tsvRows.push([...requiredHeaders]);

  for (let row = headerRow + 1; row <= summaryRow; row += 1) {
    tsvRows.push(
      requiredHeaders.map((header) =>
        getCellText(worksheet, row, headerIndexMap[header] as number)
      )
    );
  }

  return tsvRows.map((row) => row.join("\t")).join("\n");
}

function readWorkbookQuietly(data: Uint8Array): XLSX.WorkBook {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && first.includes("Bad uncompressed size")) {
      return;
    }
    originalConsoleError(...args);
  };

  try {
    return XLSX.read(data, { type: "array" });
  } finally {
    console.error = originalConsoleError;
  }
}

function findRowByCellText(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  predicate: (text: string) => boolean
): number | null {
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const text = getCellText(worksheet, row, col);
      if (text && predicate(text)) {
        return row;
      }
    }
  }
  return null;
}

function buildHeaderIndexMap(
  worksheet: XLSX.WorkSheet,
  range: XLSX.Range,
  headerRow: number
): Record<string, number> {
  const map: Record<string, number> = {};
  for (let col = range.s.c; col <= range.e.c; col += 1) {
    const text = getCellText(worksheet, headerRow, col);
    if (text) {
      map[text] = col;
    }
  }
  return map;
}

function readRowByRange(
  worksheet: XLSX.WorkSheet,
  row: number,
  startCol: number,
  endCol: number
): string[] {
  const values: string[] = [];
  for (let col = startCol; col <= endCol; col += 1) {
    values.push(getCellText(worksheet, row, col));
  }
  return values;
}

function getCellText(
  worksheet: XLSX.WorkSheet,
  row: number,
  col: number
): string {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = worksheet[address];
  if (!cell) {
    return "";
  }
  const value = XLSX.utils.format_cell(cell);
  return value == null ? "" : String(value).trim();
}

function downloadExcel(
  data: Uint8Array,
  contentType: string,
  fileName: string
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    const mimeType = contentType || EXCEL_CONTENT_TYPE;
    const base64 = bytesToBase64(data);
    const dataUrl = `data:${mimeType};base64,${base64}`;

    chrome.downloads.download(
      {
        url: dataUrl,
        filename: fileName,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(downloadId);
      }
    );
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}
