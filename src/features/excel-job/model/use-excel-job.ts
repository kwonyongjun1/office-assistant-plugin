import { useMemo, useState } from "react";
import type {
  ProcessExcelRequest,
  ProcessExcelResponse,
} from "@/shared/types/excel-job";

const DEFAULT_MONTH = new Date().toISOString().slice(0, 7);
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_ROW_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const TABLE_COL_WIDTHS = [122, 120, 120, 120, 120];
const CELL_BORDER_COLOR = "#000000";
const CELL_BORDER_WIDTH = 0.65;
const TITLE_BG = "#D3D3D3";
const HEADER_BG = "#d9d9d9";
const BODY_BG = "#ffffff";
const FONT_FAMILY = "'Malgun Gothic', 'Noto Sans KR', sans-serif";
const TITLE_FONT =
  "700 21px 'Calibri', 'Malgun Gothic', 'Noto Sans KR', sans-serif";
const META_LABEL_FONT =
  "700 15px 'Calibri', 'Malgun Gothic', 'Noto Sans KR', sans-serif";
const META_VALUE_FONT = "400 15px 'Malgun Gothic', 'Noto Sans KR', sans-serif";
const HEADER_FONT =
  "700 15px 'Calibri', 'Malgun Gothic', 'Noto Sans KR', sans-serif";
const BODY_FONT = "400 15px 'Malgun Gothic', 'Noto Sans KR', sans-serif";
const SUMMARY_FONT = "700 15px 'Malgun Gothic', 'Noto Sans KR', sans-serif";
const TITLE_ROW_HEIGHT = 44;
const ROW_HEIGHT = 22;

export function useExcelJob() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProcessExcelResponse | null>(null);

  const validationError = useMemo(() => {
    if (!month) {
      return "Month is required.";
    }
    if (!MONTH_PATTERN.test(month)) {
      return "Invalid format. Use YYYY-MM (e.g. 2026-03).";
    }
    return null;
  }, [month]);

  const canSubmit = validationError === null;

  const run = async (type: ProcessExcelRequest["type"]) => {
    if (validationError) {
      setResult({ ok: false, error: validationError });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const payload: ProcessExcelRequest = {
        type,
        payload: { month },
      };

      const response = (await chrome.runtime.sendMessage(
        payload
      )) as ProcessExcelResponse;
      if (!response.ok) {
        setResult(response);
        return;
      }

      if (type === "COPY_MONTHLY_EXCEL_RANGE") {
        const plainText = response.copiedText ?? "";
        await writeExcelLikeClipboard(plainText);
      }

      setResult(response);
    } catch (error) {
      setResult({
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error occurred while processing.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    month,
    setMonth,
    isLoading,
    result,
    canSubmit,
    validationError,
    run,
  };
}

async function writeExcelLikeClipboard(plainText: string) {
  const rows = parseTsv(plainText);
  const htmlText = buildStyledHtmlTable(rows);
  const pngBlob = await buildPngBlobFromRows(rows);

  if (
    typeof ClipboardItem !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.write === "function"
  ) {
    const clipboardData: Record<string, Blob> = {
      "text/plain": new Blob([plainText], { type: "text/plain" }),
      "text/html": new Blob([htmlText], { type: "text/html" }),
    };

    if (pngBlob) {
      clipboardData["image/png"] = pngBlob;
    }

    await navigator.clipboard.write([new ClipboardItem(clipboardData)]);
    return;
  }

  await navigator.clipboard.writeText(plainText);
}

function buildStyledHtmlTable(rows: string[][]): string {
  if (!rows.length) {
    return "";
  }

  const headerRowIndex = findHeaderRowIndex(rows);
  const rowKinds = rows.map((row, rowIndex) =>
    classifyRow(row, rowIndex, headerRowIndex)
  );

  const body = rows
    .map((row, rowIndex) => {
      const rowKind = rowKinds[rowIndex];

      if (rowKind === "title") {
        return `<tr><td colspan=\"5\" style=\"border:${CELL_BORDER_WIDTH}px solid ${CELL_BORDER_COLOR};background:${TITLE_BG};font:${TITLE_FONT};line-height:1;padding:1px 7px;text-align:left;vertical-align:middle;height:${TITLE_ROW_HEIGHT}px;\">${escapeHtml(
          row[0] ?? ""
        )}</td></tr>`;
      }

      if (rowKind === "summary") {
        const label = escapeHtml(row[0] ?? "");
        const sumWork = escapeHtml(row[3] ?? "");
        const sumLeave = escapeHtml(row[4] ?? "");
        return [
          "<tr>",
          `<td colspan=\"3\" style=\"border:${CELL_BORDER_WIDTH}px solid ${CELL_BORDER_COLOR};height:${ROW_HEIGHT}px;padding:0 4px;line-height:1;white-space:nowrap;text-align:center;vertical-align:middle;background:${TITLE_BG};font:${SUMMARY_FONT};\">${label}</td>`,
          `<td style=\"border:${CELL_BORDER_WIDTH}px solid ${CELL_BORDER_COLOR};height:${ROW_HEIGHT}px;padding:0 4px;line-height:1;white-space:nowrap;text-align:center;vertical-align:middle;background:${TITLE_BG};font:${SUMMARY_FONT};\">${sumWork}</td>`,
          `<td style=\"border:${CELL_BORDER_WIDTH}px solid ${CELL_BORDER_COLOR};height:${ROW_HEIGHT}px;padding:0 4px;line-height:1;white-space:nowrap;text-align:center;vertical-align:middle;background:${TITLE_BG};font:${SUMMARY_FONT};\">${sumLeave}</td>`,
          "</tr>",
        ].join("");
      }

      const cells = row
        .map((cell, colIndex) => {
          const styles = [
            `border:${CELL_BORDER_WIDTH}px solid ${CELL_BORDER_COLOR}`,
            `height:${ROW_HEIGHT}px`,
            "padding:0 4px",
            "line-height:1",
            "white-space:nowrap",
            "text-align:center",
            "vertical-align:middle",
            `background:${BODY_BG}`,
            `font:${BODY_FONT}`,
          ];

          if (rowKind === "header") {
            styles.push(`background:${HEADER_BG}`, `font:${HEADER_FONT}`);
          }

          if (rowKind === "meta" && colIndex < 2) {
            if (colIndex === 0) {
              styles.push(`background:${HEADER_BG}`, `font:${META_LABEL_FONT}`);
            } else {
              styles.push(`font:${META_VALUE_FONT}`);
            }
          }

          return `<td style=\"${styles.join(";")}\">${escapeHtml(
            cell ?? ""
          )}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return [
    '<html><head><meta charset="utf-8"></head><body>',
    `<table style="border-collapse:collapse;table-layout:fixed;font-family:${FONT_FAMILY};">`,
    "<colgroup>",
    TABLE_COL_WIDTHS.map((width) => `<col style=\"width:${width}px\" />`).join(
      ""
    ),
    "</colgroup>",
    body,
    "</table>",
    "</body></html>",
  ].join("");
}

async function buildPngBlobFromRows(rows: string[][]): Promise<Blob | null> {
  if (!rows.length) {
    return null;
  }

  const headerRowIndex = findHeaderRowIndex(rows);
  const rowKinds = rows.map((row, rowIndex) =>
    classifyRow(row, rowIndex, headerRowIndex)
  );
  const tableWidth = TABLE_COL_WIDTHS.reduce((sum, width) => sum + width, 0);
  const rowHeights = rowKinds.map((kind) =>
    kind === "title" ? TITLE_ROW_HEIGHT : ROW_HEIGHT
  );

  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  const canvas = document.createElement("canvas");
  canvas.width = (tableWidth + 1) * dpr;
  canvas.height = rowHeights.reduce((sum, h) => sum + h, 1) * dpr;
  canvas.style.width = `${tableWidth + 1}px`;
  canvas.style.height = `${rowHeights.reduce((sum, h) => sum + h, 1)}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.scale(dpr, dpr);
  ctx.fillStyle = BODY_BG;
  ctx.fillRect(
    0,
    0,
    tableWidth + 1,
    rowHeights.reduce((sum, h) => sum + h, 1)
  );
  ctx.textBaseline = "middle";

  const xEdges = [0];
  for (const width of TABLE_COL_WIDTHS) {
    xEdges.push(xEdges[xEdges.length - 1] + width);
  }
  const yEdges = [0];
  for (const height of rowHeights) {
    yEdges.push(yEdges[yEdges.length - 1] + height);
  }

  let y = 0;
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r];
    const kind = rowKinds[r];
    const h = rowHeights[r];

    if (kind === "title") {
      ctx.fillStyle = TITLE_BG;
      ctx.fillRect(0, y, tableWidth, h);
      ctx.fillStyle = "#000000";
      ctx.font = TITLE_FONT;
      ctx.fillText(row[0] ?? "", 8, y + h / 2);
      y += h;
      continue;
    }

    if (kind === "summary") {
      ctx.fillStyle = HEADER_BG;
      ctx.fillRect(0, y, xEdges[3], h);
      ctx.fillRect(xEdges[3], y, TABLE_COL_WIDTHS[3], h);
      ctx.fillRect(xEdges[4], y, TABLE_COL_WIDTHS[4], h);

      ctx.fillStyle = "#000000";
      ctx.font = SUMMARY_FONT;
      const label = row[0] ?? "";
      const labelWidth = ctx.measureText(label).width;
      ctx.fillText(label, (xEdges[3] - labelWidth) / 2, y + h / 2);

      ctx.font = SUMMARY_FONT;
      const sumWork = row[3] ?? "";
      const sumLeave = row[4] ?? "";
      const sumWorkWidth = ctx.measureText(sumWork).width;
      const sumLeaveWidth = ctx.measureText(sumLeave).width;
      ctx.fillText(
        sumWork,
        xEdges[3] + (TABLE_COL_WIDTHS[3] - sumWorkWidth) / 2,
        y + h / 2
      );
      ctx.fillText(
        sumLeave,
        xEdges[4] + (TABLE_COL_WIDTHS[4] - sumLeaveWidth) / 2,
        y + h / 2
      );
      y += h;
      continue;
    }

    let x = 0;
    for (let c = 0; c < TABLE_COL_WIDTHS.length; c += 1) {
      const w = TABLE_COL_WIDTHS[c];
      const isMetaLead = kind === "meta" && c === 0;

      ctx.fillStyle = kind === "header" || isMetaLead ? HEADER_BG : BODY_BG;
      ctx.fillRect(x, y, w, h);

      ctx.fillStyle = "#000000";
      if (kind === "header") {
        ctx.font = HEADER_FONT;
      } else if (kind === "meta" && c === 0) {
        ctx.font = META_LABEL_FONT;
      } else if (kind === "meta" && c === 1) {
        ctx.font = META_VALUE_FONT;
      } else {
        ctx.font = BODY_FONT;
      }

      const text = row[c] ?? "";
      const tw = ctx.measureText(text).width;
      const textX = x + (w - tw) / 2;
      ctx.fillText(text, textX, y + h / 2);

      x += w;
    }

    y += h;
  }

  const excludedBorderRowIndexes = new Set([0, 1, 2, 4]); // 1,2,3,5th rows (1-based)
  const excludedRowBorderColor = "#D3D3D3";
  const emphasizedRowIndex = 3; // 4th row (1-based)
  const emphasizedColsEndEdgeIndex = 2; // 1st-2nd columns
  const forcedBlackTopBorderEdgeIndexes = new Set([5, 6]); // top border of 6th, 7th rows (1-based)

  const drawBorderSegment = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = CELL_BORDER_WIDTH;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  // Draw borders per segment so row-specific colors can be applied.
  for (let xEdgeIndex = 0; xEdgeIndex < xEdges.length; xEdgeIndex += 1) {
    const xEdge = xEdges[xEdgeIndex];
    const crispX = Math.round(xEdge) + 0.5;
    for (let rowIndex = 0; rowIndex < rowKinds.length; rowIndex += 1) {
      const rowKind = rowKinds[rowIndex];
      const startY = yEdges[rowIndex];
      const endY = yEdges[rowIndex + 1];

      if (
        rowKind === "title" &&
        xEdge !== 0 &&
        xEdge !== xEdges[xEdges.length - 1]
      ) {
        continue;
      }
      if (
        rowKind === "summary" &&
        (xEdge === xEdges[1] || xEdge === xEdges[2])
      ) {
        continue;
      }

      let color = excludedBorderRowIndexes.has(rowIndex)
        ? excludedRowBorderColor
        : CELL_BORDER_COLOR;
      if (
        rowIndex === emphasizedRowIndex &&
        xEdgeIndex >= emphasizedColsEndEdgeIndex
      ) {
        color = excludedRowBorderColor;
      }
      if (
        rowIndex === emphasizedRowIndex &&
        xEdgeIndex === emphasizedColsEndEdgeIndex
      ) {
        color = CELL_BORDER_COLOR;
      }

      drawBorderSegment(
        crispX,
        Math.round(startY) + 0.5,
        crispX,
        Math.round(endY) + 0.5,
        color
      );
    }
  }

  for (let edgeIndex = 0; edgeIndex < yEdges.length; edgeIndex += 1) {
    const yEdge = yEdges[edgeIndex];
    const crispY = Math.round(yEdge) + 0.5;
    const touchesExcludedRow =
      excludedBorderRowIndexes.has(edgeIndex - 1) ||
      excludedBorderRowIndexes.has(edgeIndex);
    const defaultColor = touchesExcludedRow
      ? excludedRowBorderColor
      : CELL_BORDER_COLOR;

    if (forcedBlackTopBorderEdgeIndexes.has(edgeIndex)) {
      drawBorderSegment(
        0,
        crispY,
        xEdges[xEdges.length - 1],
        crispY,
        CELL_BORDER_COLOR
      );
      continue;
    }

    if (
      edgeIndex === emphasizedRowIndex ||
      edgeIndex === emphasizedRowIndex + 1
    ) {
      drawBorderSegment(
        0,
        crispY,
        xEdges[emphasizedColsEndEdgeIndex],
        crispY,
        CELL_BORDER_COLOR
      );
      drawBorderSegment(
        xEdges[emphasizedColsEndEdgeIndex],
        crispY,
        xEdges[xEdges.length - 1],
        crispY,
        defaultColor
      );
      continue;
    }

    drawBorderSegment(
      0,
      crispY,
      xEdges[xEdges.length - 1],
      crispY,
      defaultColor
    );
  }

  return await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function parseTsv(tsv: string): string[][] {
  if (!tsv) {
    return [];
  }

  return tsv.split("\n").map((row) => {
    const cols = row.split("\t");
    while (cols.length < 5) {
      cols.push("");
    }
    return cols.slice(0, 5);
  });
}

function findHeaderRowIndex(rows: string[][]): number {
  const firstDateIndex = rows.findIndex((row) =>
    DATE_ROW_PATTERN.test((row[0] ?? "").trim())
  );
  if (firstDateIndex > 0) {
    return firstDateIndex - 1;
  }
  return 4;
}

function classifyRow(
  row: string[],
  rowIndex: number,
  headerRowIndex: number
): "title" | "meta" | "header" | "blank" | "summary" | "data" {
  if (rowIndex === 0) {
    return "title";
  }

  if (rowIndex === headerRowIndex) {
    return "header";
  }

  if (row.every((cell) => cell === "")) {
    return "blank";
  }

  const secondCol = (row[1] ?? "").trim();
  if (/^\d{6}$/.test(secondCol)) {
    return "meta";
  }

  const firstCol = (row[0] ?? "").trim();
  const hasSummaryValues =
    (row[3] ?? "").trim() !== "" || (row[4] ?? "").trim() !== "";
  if (firstCol && !DATE_ROW_PATTERN.test(firstCol) && hasSummaryValues) {
    return "summary";
  }

  return "data";
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
