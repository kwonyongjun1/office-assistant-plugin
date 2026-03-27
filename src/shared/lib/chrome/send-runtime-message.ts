import {
  GENERIC_FAILURE_TOAST,
  INVALID_TOKEN_CODE,
  PORTAL_LOGIN_REQUIRED_TOAST,
} from "@/shared/constants/api-errors";
import { appToast } from "@/shared/lib/toast";

type RuntimeResponse =
  | {
      ok: true;
    }
  | {
      ok: false;
      code?: string;
    };

export async function sendRuntimeMessage<
  TRequest,
  TResponse extends RuntimeResponse
>(message: TRequest): Promise<TResponse> {
  const response = (await chrome.runtime.sendMessage(message)) as TResponse;
  if (!response.ok) {
    if (response.code === INVALID_TOKEN_CODE) {
      appToast.error(PORTAL_LOGIN_REQUIRED_TOAST);
    } else {
      appToast.error(GENERIC_FAILURE_TOAST);
    }
  }

  return response;
}
