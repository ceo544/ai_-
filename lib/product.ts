import type { SupabaseClient } from "@supabase/supabase-js";
import { crawl } from "./crawl";
import type { Merchant } from "./types";

export interface ProductSource {
  merchantId?: string | null;
  url?: string | null;
}

export interface ProductContext {
  name: string;
  advertiser: string;
  url: string;
  merchantId: string | null;
  context: string;
}

/** 머천트를 골랐으면 저장된 분석을, URL만 넣었으면 즉석 크롤링 결과를 프롬프트용 텍스트로 */
export async function resolveProduct(supabase: SupabaseClient, src: ProductSource): Promise<ProductContext> {
  if (src.merchantId) {
    const { data, error } = await supabase.from("merchants").select("*").eq("id", src.merchantId).single();
    if (error || !data) throw new Error("머천트를 찾을 수 없습니다.");
    const m = data as Merchant;
    return {
      name: m.analysis.name || m.name,
      advertiser: m.analysis.brand || m.name,
      url: m.url,
      merchantId: m.id,
      context: `[상품 분석 결과]\n${JSON.stringify(m.analysis, null, 2)}`,
    };
  }
  if (src.url) {
    const page = await crawl(src.url);
    return {
      name: page.title || "새 상품",
      advertiser: page.title || "광고주",
      url: page.url,
      merchantId: null,
      context: `[상품 페이지]\n주소: ${page.url}\n제목: ${page.title}\n설명: ${page.description}\n본문:\n${page.text}`,
    };
  }
  throw new Error("머천트를 고르거나 상품 페이지 주소를 넣어주세요.");
}
