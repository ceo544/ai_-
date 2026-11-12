import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { generateImage, type ImageSize } from "@/lib/ai/image";
import { appendJobImage, uploadPng } from "@/lib/storage";

export const maxDuration = 180;

/** 프롬프트 1개 → 이미지 1장 생성 후 작업에 첨부 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  try {
    const { jobId, key, prompt, size } = (await req.json()) as {
      jobId: string;
      key: string;
      prompt: string;
      size?: ImageSize;
    };
    if (!prompt?.trim()) throw new Error("프롬프트가 비어 있습니다.");
    const png = await generateImage(prompt, size || "1024x1024");
    const url = await uploadPng(auth.supabase, auth.user.id, png);
    const image = { key, url, prompt, created_at: new Date().toISOString() };
    const images = await appendJobImage(auth.supabase, jobId, image);
    return NextResponse.json({ image, images });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
