import { SEEN_LIMIT } from "./config";
import type { Env, Job } from "./types";

const KEY = "seen_ids";

/** Returns null if nothing has been stored yet (i.e. first run). */
export async function loadSeen(env: Env): Promise<string[] | null> {
  const raw = await env.SEEN_JOBS.get(KEY);
  return raw ? (JSON.parse(raw) as string[]) : null;
}

export async function saveSeen(env: Env, ids: string[]): Promise<void> {
  await env.SEEN_JOBS.put(KEY, JSON.stringify([...new Set(ids)].slice(0, SEEN_LIMIT)));
}

export function diffNew(jobs: Job[], seen: string[]): Job[] {
  const known = new Set(seen);
  return jobs.filter((j) => !known.has(j.id));
}

export async function alertCooldownActive(env: Env): Promise<boolean> {
  return (await env.SEEN_JOBS.get("alert_cooldown")) !== null;
}

export async function startAlertCooldown(env: Env, seconds: number): Promise<void> {
  await env.SEEN_JOBS.put("alert_cooldown", "1", { expirationTtl: Math.max(60, seconds) });
}
