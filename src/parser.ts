import { load } from "cheerio";
import type { Job } from "./types";

export function parseJobs(html: string, baseUrl: string): Job[] {
  const $ = load(html);
  const jobs: Job[] = [];
  const seen = new Set<string>();

  $(".jobpost-cat-box").each((_, el) => {
    const box = $(el);
    const href = box.find('a[href^="/jobseekers/job/"]').first().attr("href");
    if (!href) return;

    const path = href.split("?")[0];
    const id = /-(\d+)\/?$/.exec(path)?.[1] ?? path;
    if (seen.has(id)) return;

    const h4 = box.find("h4").first().clone();
    const type = h4.find(".badge").first().text().trim() || undefined;
    h4.find(".badge").remove();
    const title = h4.text().replace(/\s+/g, " ").trim();
    if (!title) return;

    const postedAt =
      box.find("p em").first().text().replace(/^\s*Posted on\s*/i, "").trim() || undefined;
    const pay = box.find("dl dd.col").first().text().replace(/\s+/g, " ").trim() || undefined;

    seen.add(id);
    jobs.push({ id, title, url: new URL(path, baseUrl).toString(), type, postedAt, pay });
  });

  return jobs;
}
