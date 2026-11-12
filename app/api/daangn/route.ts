import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { resolveProduct } from "@/lib/product";
import { askJSON } from "@/lib/ai/claude";
import { DAANGN_SYSTEM, daangnUser } from "@/lib/prompts";
import type { DaangnOutput } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  try {
    const { merchantId, url, note } = await req.json();
    const product = await resolveProduct(auth.supabase, { merchantId, url });
    const output = await askJSON<DaangnOutput>(DAANGN_SYSTEM, daangnUser(product.context, note), 8000);
    output.advertiser ||= product.advertiser;
    const { data, error } = await auth.supabase
      .from("jobs")
      .insert({
        type: "daangn",
        title: `${output.product_name || product.name} · 당근 광고`,
        merchant_id: product.merchantId,
        input: { merchantId, url: product.url, note },
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
