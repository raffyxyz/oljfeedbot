import { MAX_JOBS_PER_DIGEST, TELEGRAM_MAX_CHARS } from "./config";
import type { Env, Job } from "./types";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatJob(job: Job): string {
  const meta = [job.type, job.pay, job.postedAt].filter(Boolean).map((m) => escapeHtml(m!));
  const head = `• <a href="${escapeHtml(job.url)}">${escapeHtml(job.title)}</a>`;
  return meta.length ? `${head}\n   <i>${meta.join(" · ")}</i>` : head;
}

/** Builds the hourly digest, split into messages that fit Telegram's size limit. */
export function formatDigest(jobs: Job[], keyword: string, searchUrl: string): string[] {
  const shown = jobs.slice(0, MAX_JOBS_PER_DIGEST);
  const extra = jobs.length - shown.length;

  const header = `🆕 <b>${jobs.length} new "${escapeHtml(keyword)}" job${jobs.length === 1 ? "" : "s"}</b>`;
  const blocks = shown.map(formatJob);
  if (extra > 0) {
    blocks.push(`…and ${extra} more. <a href="${escapeHtml(searchUrl)}">See all</a>`);
  }

  const messages: string[] = [];
  let current = header;
  for (const block of blocks) {
    if (current.length + block.length + 2 > TELEGRAM_MAX_CHARS) {
      messages.push(current);
      current = block;
    } else {
      current += `\n\n${block}`;
    }
  }
  messages.push(current);
  return messages;
}

export async function sendMessage(env: Env, text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    // Don't include the request URL: it contains the bot token.
    throw new Error(`Telegram sendMessage failed: HTTP ${res.status} ${await res.text()}`);
  }
}
