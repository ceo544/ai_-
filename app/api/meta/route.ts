import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { resolveProduct } from "@/lib/product";
import { askJSON } from "@/lib/ai/claude";
import { META_SYSTEM, metaUser } from "@/lib/prompts";
import type { MetaOutput } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  try {
    const { merchantId, url, note, goal, budget, region } = await req.json();
    const product = await resolveProduct(auth.supabase, { merchantId, url });
    const output = await askJSON<MetaOutput>(META_SYSTEM, metaUser(product.context, goal, budget, region, note), 9000);
    const { data, error } = await auth.supabase
      .from("jobs")
      .insert({
        type: "meta",
        title: `${product.name} · 메타 광고 기획`,
        merchant_id: product.merchantId,
        input: { merchantId, url: product.url, note, goal, budget, region },
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
