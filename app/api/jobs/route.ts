import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");
  if (id) {
    const { data, error } = await auth.supabase.from("jobs").select("*").eq("id", id).single();
    if (error) return NextResponse.json({ error: "작업을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ job: data });
  }
  let q = auth.supabase
    .from("jobs")
    .select("id,type,title,merchant_id,created_at,images")
    .order("created_at", { ascending: false })
    .limit(Number(sp.get("limit") || 60));
  const type = sp.get("type");
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ jobs: data });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { id, title, output } = await req.json();
  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.title = title;
  if (output !== undefined) patch.output = output;
  const { data, error } = await auth.supabase.from("jobs").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}

export async function DELETE(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  const { error } = await auth.supabase.from("jobs").delete().eq("id", id!);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
