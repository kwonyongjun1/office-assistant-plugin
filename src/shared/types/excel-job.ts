export type ProcessExcelRequest = {
  type:
    | "DOWNLOAD_MONTHLY_EXCEL"
    | "COPY_MONTHLY_EXCEL_RANGE";
  payload: {
    month: string;
  };
};

export type ProcessExcelResponse =
  | {
      ok: true;
      copiedText?: string;
      downloadId?: number;
      fileName: string;
      fetchMode: "background" | "page";
    }
  | {
      ok: false;
      error: string;
    };
