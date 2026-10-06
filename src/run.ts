import {
  ALERT_COOLDOWN_SECONDS,
  BASE_URL,
  QUIET_END_HOUR,
  QUIET_START_HOUR,
  SEARCH_URL,
  TIMEZONE,
} from "./config";
import { parseJobs } from "./parser";
import { isQuietHour } from "./quiet";
import { fetchListingHtml } from "./scraper";
import { alertCooldownActive, diffNew, loadSeen, saveSeen, startAlertCooldown } from "./store";
import { formatDigest, sendMessage } from "./telegram";
import type { Env, RunResult } from "./types";

export async function runJob(env: Env, opts: { respectQuietHours: boolean }): Promise<RunResult> {
  if (
    opts.respectQuietHours &&
    isQuietHour(new Date(), TIMEZONE, QUIET_START_HOUR, QUIET_END_HOUR)
  ) {
    return { status: "quiet" };
  }

  const keyword = new URL(SEARCH_URL).searchParams.get("jobkeyword") ?? "jobs";

  try {
    const html = await fetchListingHtml(SEARCH_URL);
    const jobs = parseJobs(html, BASE_URL);
    if (jobs.length === 0) {
      throw new Error("Parsed 0 jobs: the page markup changed or the request was blocked.");
    }

    const seen = await loadSeen(env);

    // First run: remember what's there now, don't flood the chat with old jobs.
    if (seen === null) {
      await saveSeen(env, jobs.map((j) => j.id));
      await sendMessage(
        env,
        `✅ Job notifier is live. Tracking ${jobs.length} current "${keyword}" jobs. New ones will arrive hourly.`,
      );
      return { status: "seeded", count: jobs.length };
    }

    const fresh = diffNew(jobs, seen);
    if (fresh.length === 0) return { status: "no_new" };

    for (const message of formatDigest(fresh, keyword, SEARCH_URL)) {
      await sendMessage(env, message);
    }
    // Only remember jobs after Telegram accepted the digest, so failures retry next hour.
    await saveSeen(env, [...fresh.map((j) => j.id), ...seen]);
    return { status: "sent", count: fresh.length };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(error);
    await alertOnce(env, error);
    return { status: "error", error };
  }
}

async function alertOnce(env: Env, error: string): Promise<void> {
  try {
    if (await alertCooldownActive(env)) return;
    await sendMessage(env, `⚠️ Job notifier error:\n${error.slice(0, 500)}`);
    await startAlertCooldown(env, ALERT_COOLDOWN_SECONDS);
  } catch (e) {
    console.error("Failed to send alert", e);
  }
}
