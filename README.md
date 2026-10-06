# Job Feed Notifier

Hourly Cloudflare Worker that scrapes a filtered onlinejobs.ph search page and sends one Telegram digest of new jobs.

- Schedule: cron `0 * * * *` (UTC, every hour on the hour)
- Quiet hours: no digests 02:00-03:59 Asia/Manila. Jobs found then are not marked as seen, so they arrive in the 04:00 digest.
- First run only records current jobs (no flood) and sends a "live" confirmation.
- Errors (HTTP failure, 0 jobs parsed) trigger a Telegram alert, at most once every 6 hours.

Settings live in `src/config.ts` (URL, timezone, quiet hours, limits).

## Setup

```bash
npm install

# 1. Create the bot with @BotFather and copy the token.
#    Send any message to your bot, then open
#    https://api.telegram.org/bot<TOKEN>/getUpdates  and copy message.chat.id

# 2. KV namespace: paste the returned id into wrangler.toml
npx wrangler kv namespace create SEEN_JOBS

# 3. Secrets
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put ADMIN_KEY          # any long random string

# 4. Deploy
npx wrangler deploy
```

## Verify it works from Cloudflare (do this first)

Open `https://job-feed-notifier.<your-subdomain>.workers.dev/run?key=<ADMIN_KEY>`

- `{"status":"seeded",...}` and a Telegram message: scraping works, you're set.
- `{"status":"error","error":"... HTTP 403 ..."}`: onlinejobs.ph is blocking Cloudflare IPs. Switch to the GitHub Actions fallback.
- `{"status":"error","error":"Parsed 0 jobs ..."}`: markup differs from the sample. Save the page HTML as `test/fixtures/listing.html` and adjust `src/parser.ts`.

After that, hourly cron runs on its own. Once verified you can delete the `ADMIN_KEY` secret to disable `/run`.

## Dev

```bash
npm test              # parser, quiet hours, dedupe, digest formatting
npm run typecheck
npm run dev           # wrangler dev --test-scheduled
```
