import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { crawl } from "@/lib/crawl";
import { askJSON } from "@/lib/ai/claude";
import { MERCHANT_SYSTEM } from "@/lib/prompts";
import type { MerchantAnalysis } from "@/lib/types";

export const maxDuration = 120;

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { data, error } = await auth.supabase
    .from("merchants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ merchants: data });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  try {
    const { url, name } = (await req.json()) as { url: string; name?: string };
    const page = await crawl(url);
    const analysis = await askJSON<MerchantAnalysis>(
      MERCHANT_SYSTEM,
      `주소: ${page.url}\n제목: ${page.title}\n설명: ${page.description}\n본문:\n${page.text}`,
      4000
    );
    const { data, error } = await auth.supabase
      .from("merchants")
      .insert({ name: name?.trim() || analysis.name || page.title, url: page.url, analysis })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ merchant: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  const { error } = await auth.supabase.from("merchants").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
