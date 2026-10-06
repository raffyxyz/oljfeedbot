import { runJob } from "./run";
import type { Env } from "./types";

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(runJob(env, { respectQuietHours: true }));
  },

  // Manual trigger for testing from Cloudflare's network: GET /run?key=<ADMIN_KEY>
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/run" && env.ADMIN_KEY && url.searchParams.get("key") === env.ADMIN_KEY) {
      return Response.json(await runJob(env, { respectQuietHours: false }));
    }
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
