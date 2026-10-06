export const BASE_URL = "https://www.onlinejobs.ph";

export const SEARCH_URL =
  "https://www.onlinejobs.ph/jobseekers/jobsearch?jobkeyword=developer&skill_tags=&gig=on&partTime=on&fullTime=on&isFromJobsearchForm=1";

/** Quiet hours are evaluated in this timezone. */
export const TIMEZONE = "Asia/Manila";
/** No notifications from 02:00 up to (not including) 04:00. */
export const QUIET_START_HOUR = 2;
export const QUIET_END_HOUR = 4;

/** Max jobs listed in one digest; the rest are summarized as "and N more". */
export const MAX_JOBS_PER_DIGEST = 40;
/** Max remembered job IDs (the search page only shows a few dozen). */
export const SEEN_LIMIT = 500;
/** Telegram's hard limit is 4096; leave headroom. */
export const TELEGRAM_MAX_CHARS = 3800;
/** Minimum gap between error alerts, in seconds. */
export const ALERT_COOLDOWN_SECONDS = 6 * 60 * 60;
