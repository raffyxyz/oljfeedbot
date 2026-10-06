import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseJobs } from "../src/parser";
import { isQuietHour } from "../src/quiet";
import { diffNew } from "../src/store";
import { escapeHtml, formatDigest } from "../src/telegram";
import type { Job } from "../src/types";

const BASE = "https://www.onlinejobs.ph";
const html = readFileSync("test/fixtures/listing.html", "utf8");

describe("parseJobs", () => {
  it("extracts a job card", () => {
    expect(parseJobs(html, BASE)).toEqual([
      {
        id: "1744334",
        title: "Senior System Analyst",
        url: "https://www.onlinejobs.ph/jobseekers/job/senior-system-analyst-1744334",
        type: "Full Time",
        postedAt: "2026-10-06 08:52:13",
        pay: undefined,
      },
    ]);
  });

  it("returns [] for unrelated markup", () => {
    expect(parseJobs("<html><body>Just a moment...</body></html>", BASE)).toEqual([]);
  });
});

describe("isQuietHour (Asia/Manila, 2-4)", () => {
  const q = (iso: string) => isQuietHour(new Date(iso), "Asia/Manila", 2, 4);
  it("is quiet at 02:00 and 03:59 Manila", () => {
    expect(q("2026-10-05T18:00:00Z")).toBe(true);
    expect(q("2026-10-05T19:59:00Z")).toBe(true);
  });
  it("is not quiet at 01:59 or 04:00 Manila", () => {
    expect(q("2026-10-05T17:59:00Z")).toBe(false);
    expect(q("2026-10-05T20:00:00Z")).toBe(false);
  });
});

describe("diffNew", () => {
  it("returns only unseen jobs", () => {
    const jobs: Job[] = [
      { id: "1", title: "a", url: "u1" },
      { id: "2", title: "b", url: "u2" },
    ];
    expect(diffNew(jobs, ["1"]).map((j) => j.id)).toEqual(["2"]);
  });
});

describe("formatDigest", () => {
  it("escapes HTML in titles", () => {
    const [msg] = formatDigest([{ id: "1", title: "C# <Dev> & Co", url: "https://x/y?a=1&b=2" }], "developer", "https://s");
    expect(msg).toContain("C# &lt;Dev&gt; &amp; Co");
    expect(msg).toContain("a=1&amp;b=2");
  });

  it("splits long digests under the Telegram limit", () => {
    const jobs: Job[] = Array.from({ length: 40 }, (_, i) => ({
      id: String(i),
      title: "T".repeat(150),
      url: `https://www.onlinejobs.ph/jobseekers/job/${"x".repeat(80)}-${i}`,
      type: "Full Time",
      postedAt: "2026-10-06 08:52:13",
    }));
    const msgs = formatDigest(jobs, "developer", "https://s");
    expect(msgs.length).toBeGreaterThan(1);
    expect(msgs.every((m) => m.length <= 4096)).toBe(true);
  });

  it("summarizes overflow", () => {
    const jobs: Job[] = Array.from({ length: 45 }, (_, i) => ({ id: String(i), title: "t", url: `https://x/${i}` }));
    expect(formatDigest(jobs, "developer", "https://s").join("\n")).toContain("and 5 more");
  });

  it("escapeHtml handles quotes", () => {
    expect(escapeHtml('"')).toBe("&quot;");
  });
});
