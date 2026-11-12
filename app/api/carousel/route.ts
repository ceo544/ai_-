import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { resolveProduct } from "@/lib/product";
import { askJSON } from "@/lib/ai/claude";
import { CAROUSEL_SYSTEM, carouselUser } from "@/lib/prompts";
import type { CarouselOutput } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  try {
    const { merchantId, url, note, format, count } = await req.json();
    const n = Math.min(10, Math.max(3, Number(count) || 6));
    const product = await resolveProduct(auth.supabase, { merchantId, url });
    const output = await askJSON<CarouselOutput>(CAROUSEL_SYSTEM, carouselUser(product.context, format, n, note), 6000);
    output.format = format === "instatoon" ? "instatoon" : "cardnews";
    const { data, error } = await auth.supabase
      .from("jobs")
      .insert({
        type: "carousel",
        title: `${product.name} · ${output.format === "instatoon" ? "인스타툰" : "카드뉴스"}`,
        merchant_id: product.merchantId,
        input: { merchantId, url: product.url, note, format: output.format, count: n },
        output,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ job: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
