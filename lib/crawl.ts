import * as cheerio from "cheerio";

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  text: string;
}

function assertPublicUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("주소 형식이 올바르지 않습니다. https://로 시작하는 주소를 넣어주세요.");
  }
  if (!/^https?:$/.test(u.protocol)) throw new Error("http 또는 https 주소만 분석할 수 있습니다.");
  const h = u.hostname;
  if (
    h === "localhost" ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h.endsWith(".internal")
  ) {
    throw new Error("내부 주소는 분석할 수 없습니다.");
  }
  return u;
}

export async function crawl(raw: string): Promise<CrawlResult> {
  const u = assertPublicUrl(raw);
  const res = await fetch(u, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      "Accept-Language": "ko-KR,ko;q=0.9",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`페이지를 불러오지 못했습니다 (HTTP ${res.status}).`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const meta = (sel: string) => $(sel).attr("content")?.trim() || "";
  const title = meta('meta[property="og:title"]') || $("title").text().trim();
  const description = meta('meta[property="og:description"]') || meta('meta[name="description"]');
  const og = meta('meta[property="og:image"]');

  $("script, style, noscript, svg, iframe, header nav, footer").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 14000);

  // 이미지 alt 텍스트도 상세페이지 정보가 많아 함께 넣음
  const alts = $("img[alt]")
    .map((_, el) => $(el).attr("alt"))
    .get()
    .filter((a) => a && a.length > 3)
    .slice(0, 40)
    .join(" / ");

  return {
    url: u.toString(),
    title,
    description,
    ogImage: og ? new URL(og, u).toString() : null,
    text: alts ? `${text}\n[이미지 설명] ${alts}` : text,
  };
}
