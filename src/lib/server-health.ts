// ─────────────────────────────────────────────
//  Server Health & Cold-Start Detection
// ─────────────────────────────────────────────

import axios from "axios";
import { api } from "./api-client";

/**
 * Checks whether an error is caused by a server cold-start,
 * network outage, connection timeout, or gateway 502/503/504 error.
 */
export function isColdStartOrNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("failed to fetch") ||
        msg.includes("wake") ||
        msg.includes("server")
      );
    }
    return false;
  }

  // No response means server was unreachable / timed out / refused connection
  if (!error.response) return true;

  const status = error.response.status;
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout, 500 during boot
  return status === 502 || status === 503 || status === 504 || status === 500;
}

/**
 * Quick ping to test if the backend server is reachable and awake.
 * Returns true if the server responds with any standard HTTP status.
 */
export async function pingServer(timeoutMs = 6000): Promise<boolean> {
  try {
    // Ping public courses endpoint or root with short timeout
    await api.get("/api/courses/", {
      timeout: timeoutMs,
      params: { page: 1, search: "__ping__" },
    });
    return true;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      // If we got a 200, 400, 401, 403, 404, or 405, the server is awake!
      if (err.response && err.response.status < 500) {
        return true;
      }
    }
    return false;
  }
}

export interface WaitForServerOptions {
  maxWaitSeconds?: number;
  pollIntervalMs?: number;
  onTick?: (elapsedSeconds: number) => void;
}

/**
 * Repeatedly polls the backend until it wakes up or exceeds maxWaitSeconds.
 */
export async function waitForServerWakeup(options: WaitForServerOptions = {}): Promise<boolean> {
  const { maxWaitSeconds = 75, pollIntervalMs = 2500, onTick } = options;
  const startTime = Date.now();

  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    onTick?.(elapsed);

    const isAlive = await pingServer(pollIntervalMs);
    if (isAlive) {
      return true;
    }

    // Wait for the next polling interval
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return false;
}
