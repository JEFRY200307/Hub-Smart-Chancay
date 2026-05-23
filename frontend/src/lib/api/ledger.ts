import { apiFetch } from "../api";
import { getAccessToken } from "../auth";

export type LedgerEventRaw = {
  id: string | { toString?: () => string };
  event_type: string;
  sequence_number: number;
  payload: Record<string, unknown>;
  actor_type: string;
  created_at: string;
};

export type LedgerEvent = {
  id: string;
  event_type: string;
  sequence_number: number;
  payload: Record<string, unknown>;
  actor_type: string;
  created_at: string;
};

function mapEvent(e: LedgerEventRaw): LedgerEvent {
  return {
    ...e,
    id: String(e.id),
    created_at:
      typeof e.created_at === "string"
        ? e.created_at
        : String(e.created_at),
  };
}

export type LedgerStats = {
  profile_id: string;
  total_events: number;
  events_by_type: Record<string, number>;
  fase_actual?: string;
  has_dossier: boolean;
};

export async function getTimeline(profileId: string) {
  const rows = await apiFetch<LedgerEventRaw[]>(
    `/ledger/profiles/${profileId}/timeline`,
    { token: getAccessToken() }
  );
  return rows.map(mapEvent);
}

export async function getLedgerStats(profileId: string) {
  return apiFetch<LedgerStats>(
    `/ledger/profiles/${profileId}/stats`,
    { token: getAccessToken() }
  );
}

export async function verifyLedger(profileId: string) {
  return apiFetch<{
    profile_id: string;
    total_events: number;
    is_valid: boolean;
    error_detail?: string;
  }>(`/ledger/profiles/${profileId}/verify`, {
    token: getAccessToken(),
  });
}
