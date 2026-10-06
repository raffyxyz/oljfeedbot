export interface Job {
  id: string;
  title: string;
  url: string;
  type?: string; // "Full Time" | "Part Time" | "Gig"
  postedAt?: string; // as shown by the site (Manila time)
  pay?: string;
}

export interface Env {
  SEEN_JOBS: KVNamespace;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  /** Optional. Enables GET /run?key=... for manual runs. */
  ADMIN_KEY?: string;
}

export type RunResult =
  | { status: "quiet" }
  | { status: "seeded"; count: number }
  | { status: "no_new" }
  | { status: "sent"; count: number }
  | { status: "error"; error: string };
