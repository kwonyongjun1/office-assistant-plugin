import { INVALID_TOKEN_CODE, INVALID_TOKEN_MESSAGE } from "@/shared/constants/api-errors";

type ApiError = {
  ok: false;
  error: string;
  status?: number;
  code?: string;
};

export type BinaryApiResult =
  | {
      ok: true;
      data: Uint8Array;
      contentType: string;
      contentDisposition: string | null;
      fetchMode: "background" | "page";
    }
  | ApiError;

export type JsonApiResult<T> =
  | {
      ok: true;
      body: T;
      status: number;
      fetchMode: "background" | "page";
    }
  | ApiError;

type HttpMethod = "GET" | "POST";

export async function requestBinaryApi(url: string): Promise<BinaryApiResult> {
  const background = await requestBinaryByBackground(url);
  if (background.ok) {
    return background;
  }

  if (background.status !== 401 && background.status !== 403) {
    return background;
  }

  return requestBinaryByPage(url);
}

export async function requestJsonApi<T>(
  url: string,
  method: HttpMethod = "GET"
): Promise<JsonApiResult<T>> {
  const background = await requestJsonByBackground<T>(url, method);
  if (background.ok) {
    return background;
  }

  if (background.status !== 401 && background.status !== 403) {
    return background;
  }

  return requestJsonByPage<T>(url, method);
}

async function requestBinaryByBackground(url: string): Promise<BinaryApiResult> {
  let response: Response;
  try {
    response = await fetch(url, { method: "GET", credentials: "include" });
  } catch {
    return { ok: false, error: "Failed to call API from extension background." };
  }

  if (!response.ok) {
    const invalidToken = await parseInvalidTokenFromResponse(response);
    if (invalidToken) {
      return invalidToken;
    }
    return {
      ok: false,
      status: response.status,
      error: `Background request failed (${response.status})`,
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.toLowerCase().includes("application/json")) {
    const invalidToken = await parseInvalidTokenFromResponse(response);
    if (invalidToken) {
      return invalidToken;
    }
    return {
      ok: false,
      status: response.status,
      error: "Unexpected JSON response from binary API.",
    };
  }

  return {
    ok: true,
    data: new Uint8Array(await response.arrayBuffer()),
    contentType,
    contentDisposition: response.headers.get("content-disposition"),
    fetchMode: "background",
  };
}

async function requestBinaryByPage(url: string): Promise<BinaryApiResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return {
      ok: false,
      error: "No active tab found. Open a logged-in company page tab and retry.",
    };
  }

  const injected = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    args: [url],
    func: async (apiUrl) => {
      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          credentials: "include",
        });
        const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
        const isJson = contentType.includes("application/json");

        if (!response.ok) {
          const body = isJson ? await response.json().catch(() => null) : null;
          if (body?.code === "ROUTE-0004" && body?.message === "Invalid token") {
            return {
              ok: false,
              status: response.status,
              code: "ROUTE-0004",
              error: "Invalid token",
            } as const;
          }

          return {
            ok: false,
            status: response.status,
            error: `Page request failed (${response.status})`,
          } as const;
        }

        if (isJson) {
          const body = await response.json().catch(() => null);
          if (body?.code === "ROUTE-0004" && body?.message === "Invalid token") {
            return {
              ok: false,
              status: response.status,
              code: "ROUTE-0004",
              error: "Invalid token",
            } as const;
          }

          return {
            ok: false,
            status: response.status,
            error: "Unexpected JSON response from binary API.",
          } as const;
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }

        return {
          ok: true,
          base64: btoa(binary),
          contentType,
          contentDisposition: response.headers.get("content-disposition"),
        } as const;
      } catch {
        return {
          ok: false,
          error: "Network error while requesting from page context.",
        } as const;
      }
    },
  });

  const result = injected[0]?.result;
  if (!result?.ok) {
    return {
      ok: false,
      error: result?.error ?? "Page-context request failed.",
      status: result?.status,
      code: result?.code,
    };
  }

  return {
    ok: true,
    data: base64ToBytes(result.base64),
    contentType: result.contentType || "",
    contentDisposition: result.contentDisposition ?? null,
    fetchMode: "page",
  };
}

async function requestJsonByBackground<T>(
  url: string,
  method: HttpMethod
): Promise<JsonApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { method, credentials: "include" });
  } catch {
    return { ok: false, error: "Failed to call API from extension background." };
  }

  if (!response.ok) {
    const invalidToken = await parseInvalidTokenFromResponse(response);
    if (invalidToken) {
      return invalidToken;
    }
    return {
      ok: false,
      status: response.status,
      error: `Background request failed (${response.status})`,
    };
  }

  try {
    const body = (await response.json()) as T;
    if (isInvalidTokenPayload(body)) {
      return {
        ok: false,
        status: response.status,
        code: INVALID_TOKEN_CODE,
        error: INVALID_TOKEN_MESSAGE,
      };
    }
    return {
      ok: true,
      body,
      status: response.status,
      fetchMode: "background",
    };
  } catch {
    return {
      ok: false,
      status: response.status,
      error: "API returned invalid JSON.",
    };
  }
}

async function requestJsonByPage<T>(
  url: string,
  method: HttpMethod
): Promise<JsonApiResult<T>> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return {
      ok: false,
      error: "No active tab found for API request.",
    };
  }

  const injected = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    args: [url, method],
    func: async (apiUrl, apiMethod) => {
      try {
        const response = await fetch(apiUrl, {
          method: apiMethod,
          credentials: "include",
        });
        const body = await response.json().catch(() => null);

        if (body?.code === "ROUTE-0004" && body?.message === "Invalid token") {
          return {
            ok: false,
            status: response.status,
            code: "ROUTE-0004",
            error: "Invalid token",
          } as const;
        }

        if (!response.ok) {
          return {
            ok: false,
            status: response.status,
            error: `Page request failed (${response.status})`,
          } as const;
        }

        return {
          ok: true,
          body,
          status: response.status,
        } as const;
      } catch {
        return {
          ok: false,
          error: "Network error while requesting from page context.",
        } as const;
      }
    },
  });

  const result = injected[0]?.result;
  if (!result?.ok) {
    return {
      ok: false,
      error: result?.error ?? "Page-context request failed.",
      status: result?.status,
      code: result?.code,
    };
  }

  return {
    ok: true,
    body: result.body as T,
    status: result.status,
    fetchMode: "page",
  };
}

async function parseInvalidTokenFromResponse(
  response: Response
): Promise<ApiError | null> {
  const body = await response
    .clone()
    .json()
    .catch(() => null);
  if (!isInvalidTokenPayload(body)) {
    return null;
  }

  return {
    ok: false,
    status: response.status,
    code: INVALID_TOKEN_CODE,
    error: INVALID_TOKEN_MESSAGE,
  };
}

function isInvalidTokenPayload(body: unknown): boolean {
  if (!body || typeof body !== "object") {
    return false;
  }
  const code = (body as { code?: unknown }).code;
  const message = (body as { message?: unknown }).message;
  return code === INVALID_TOKEN_CODE && message === INVALID_TOKEN_MESSAGE;
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
