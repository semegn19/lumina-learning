// ─────────────────────────────────────────────
//  Bots Chat API Functions      
// ─────────────────────────────────────────────

import { api } from "./api-client";
import type { BotFaq, BotFaqCreatePayload, BotLog, PaginatedResponse } from "./api-types";

export interface BotChatPayload {
  question: string;
}

export interface BotChatResponse {
  response?: string;
  reply?: string;
  answer?: string;
  message?: string;
  [key: string]: unknown;
}

/** POST /api/bots/chat/ — Send message to Web Chat Bot API */
export async function sendBotMessage(userMessage: string): Promise<string> {
  try {
    const res = await api.post<BotChatResponse>("/api/bots/chat/", {
      question: userMessage,
    });
    const botReply = res.data?.response ?? res.data?.reply ?? res.data?.answer ?? res.data?.message;
    if (typeof botReply === "string" && botReply.trim()) {
      return botReply;
    }
    if (typeof res.data === "string") {
      return res.data;
    }
    return "I received your question. How else can I assist you today?";
  } catch (err: any) {
    // If /api/bots/chat/ 404s, attempt /bots/chat/
    if (err?.response?.status === 404) {
      try {
        const resFallback = await api.post<BotChatResponse>("/bots/chat/", {
          question: userMessage,
        });
        const botReply =
          resFallback.data?.response ??
          resFallback.data?.reply ??
          resFallback.data?.answer ??
          resFallback.data?.message;
        if (typeof botReply === "string" && botReply.trim()) {
          return botReply;
        }
      } catch {
        // Ignore fallback failure and throw original error
      }
    }
    throw err;
  }
}

export interface GetBotFaqsParams {
  page?: number | undefined;
  page_size?: number | undefined;
  size?: number | undefined;
  search?: string | undefined;
}

/** GET /api/bots/faq/ — Fetch all Bot FAQs */
export async function getBotFaqs(
  params?: GetBotFaqsParams
): Promise<BotFaq[] | PaginatedResponse<BotFaq>> {
  const queryParams: Record<string, string | number> = {};
  if (params?.page) queryParams["page"] = params.page;
  if (params?.page_size) queryParams["page_size"] = params.page_size;
  if (params?.size) queryParams["size"] = params.size;
  if (params?.search) queryParams["search"] = params.search;

  try {
    const res = await api.get<BotFaq[] | PaginatedResponse<BotFaq>>("/api/bots/faq/", {
      params: queryParams,
    });
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const resFallback = await api.get<BotFaq[] | PaginatedResponse<BotFaq>>("/bots/faq/", {
        params: queryParams,
      });
      return resFallback.data;
    }
    throw err;
  }
}

/** POST /api/bots/faq/ — Create a new Bot FAQ (Admin Only) */
export async function createBotFaq(payload: BotFaqCreatePayload): Promise<BotFaq> {
  try {
    const res = await api.post<BotFaq>("/api/bots/faq/", payload);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const resFallback = await api.post<BotFaq>("/bots/faq/", payload);
      return resFallback.data;
    }
    throw err;
  }
}

/** PATCH /api/bots/faq/{id}/ or PUT /api/bots/faq/{id}/ — Update a Bot FAQ (Admin Only) */
export async function updateBotFaq(
  id: number | string,
  payload: Partial<BotFaqCreatePayload>
): Promise<BotFaq> {
  try {
    const res = await api.patch<BotFaq>(`/api/bots/faq/${id}/`, payload);
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      try {
        const resFallback = await api.patch<BotFaq>(`/bots/faq/${id}/`, payload);
        return resFallback.data;
      } catch {
        const resPut = await api.put<BotFaq>(`/api/bots/faq/${id}/`, payload);
        return resPut.data;
      }
    }
    throw err;
  }
}

/** DELETE /api/bots/faq/{id}/ — Delete a Bot FAQ (Admin Only) */
export async function deleteBotFaq(id: number | string): Promise<void> {
  try {
    await api.delete(`/api/bots/faq/${id}/`);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      await api.delete(`/bots/faq/${id}/`);
      return;
    }
    throw err;
  }
}

export interface GetBotLogsParams {
  page?: number | undefined;
  page_size?: number | undefined;
  size?: number | undefined;
  search?: string | undefined;
  platform?: string | undefined;
}

/** GET /api/bots/logs/ — Fetch Bot Conversation Logs (Admin Only) */
export async function getBotLogs(
  params?: GetBotLogsParams
): Promise<BotLog[] | PaginatedResponse<BotLog>> {
  const queryParams: Record<string, string | number> = {};
  if (params?.page) queryParams["page"] = params.page;
  if (params?.page_size) queryParams["page_size"] = params.page_size;
  if (params?.size) queryParams["size"] = params.size;
  if (params?.search) queryParams["search"] = params.search;
  if (params?.platform) queryParams["platform"] = params.platform;

  try {
    const res = await api.get<BotLog[] | PaginatedResponse<BotLog>>("/api/bots/logs/", {
      params: queryParams,
    });
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const resFallback = await api.get<BotLog[] | PaginatedResponse<BotLog>>("/bots/logs/", {
        params: queryParams,
      });
      return resFallback.data;
    }
    throw err;
  }
}

/** Fetch all Bot Logs across all pages so platform filtering and search operate across full history */
export async function getAllBotLogs(): Promise<BotLog[]> {
  try {
    let firstRes: any;
    try {
      firstRes = await api.get<any>("/api/bots/logs/", { params: { page: 1 } });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        firstRes = await api.get<any>("/bots/logs/", { params: { page: 1 } });
      } else {
        throw err;
      }
    }

    const data = firstRes.data;
    if (Array.isArray(data)) {
      return data;
    }

    const results: BotLog[] = data.results ? [...data.results] : [];
    const totalPages =
      data.meta?.total_pages ??
      (data.total_pages || (data.count ? Math.ceil(data.count / (data.meta?.size || 9)) : 1));

    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 2; p <= totalPages; p++) {
        pagePromises.push(
          api
            .get<any>("/api/bots/logs/", { params: { page: p } })
            .then((r) => r.data?.results ?? (Array.isArray(r.data) ? r.data : []))
            .catch(async (err: any) => {
              if (err?.response?.status === 404) {
                try {
                  const r = await api.get<any>("/bots/logs/", { params: { page: p } });
                  return r.data?.results ?? (Array.isArray(r.data) ? r.data : []);
                } catch {
                  return [];
                }
              }
              return [];
            })
        );
      }
      const restPages = await Promise.all(pagePromises);
      for (const pageLogs of restPages) {
        if (Array.isArray(pageLogs)) {
          results.push(...pageLogs);
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}
