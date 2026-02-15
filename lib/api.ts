// src/lib/runnerApi.ts
export type RunnerMode = "collecting" | "active" | "done";

export type LlmInfo = {
  on_device: boolean;
  model_name: string;
  latency_ms: number;
  ok: boolean;
  error?: string;
  used?: boolean;
};

export type SessionStartResponse = {
  session_id: string;
  started_at: number;
  mode: RunnerMode;
  turn_index: number;
  slots: Record<string, string>;
  missing_fields: string[];
  llm: LlmInfo;
};

export type SessionMessageResponse = {
  session_id: string;
  turn_index: number;
  mode: RunnerMode;
  assistant_text: string;
  slots: Record<string, string>;
  missing_fields: string[];
  llm: LlmInfo;
};

export type HistoryMessage = {
  turn_index: number;
  role: "user" | "assistant";
  text: string;
  ts: number;
};

export type SessionHistoryResponse = {
  session_id: string;
  mode: RunnerMode;
  turn_index: number;
  slots: Record<string, string>;
  missing_fields: string[];
  messages: HistoryMessage[];
};

const BASE =
  process.env.NEXT_PUBLIC_RUNNER_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8080";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  // Attempt to parse JSON even on non-200 (runner returns JSON errors)
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export function runnerBaseUrl() {
  return BASE;
}

export async function health() {
  return fetchJson<{ ok: boolean; ts: number; llm_loaded: boolean; llm_model: string }>(
    `${BASE}/health`
  );
}

export async function sessionStart(): Promise<SessionStartResponse> {
  return fetchJson<SessionStartResponse>(`${BASE}/session/start`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function sessionMessage(session_id: string, user_text: string): Promise<SessionMessageResponse> {
  return fetchJson<SessionMessageResponse>(`${BASE}/session/message`, {
    method: "POST",
    body: JSON.stringify({ session_id, user_text }),
  });
}

export async function sessionHistory(session_id: string, n = 50): Promise<SessionHistoryResponse> {
  const qs = new URLSearchParams({ session_id, n: String(n) });
  return fetchJson<SessionHistoryResponse>(`${BASE}/session/history?${qs.toString()}`);
}
