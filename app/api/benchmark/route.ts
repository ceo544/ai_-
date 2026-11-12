import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { resolveProduct } from "@/lib/product";
import { askJSON, imageBlock, type UserContent } from "@/lib/ai/claude";
import { editImage, generateImage } from "@/lib/ai/image";
import { uploadPng } from "@/lib/storage";
import { BENCHMARK_SYSTEM } from "@/lib/prompts";
import type { BenchmarkOutput } from "@/lib/types";

export const maxDuration = 240;

const OK_TYPES = ["image/png", "image/jpeg", "image/webp"];

async function readImage(file: File | null) {
  if (!file || file.size === 0) return null;
  if (!OK_TYPES.includes(file.type)) throw new Error("PNG, JPG, WEBP 이미지만 올릴 수 있습니다.");
  if (file.size > 8 * 1024 * 1024) throw new Error("이미지는 8MB 이하로 올려주세요.");
  const data = Buffer.from(await file.arrayBuffer());
  return { data, type: file.type, name: file.name || "image.png" };
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  try {
    const form = await req.formData();
    const reference = await readImage(form.get("reference") as File | null);
    const productImg = await readImage(form.get("product") as File | null);
    if (!reference) throw new Error("벤치마킹할 레퍼런스 사진을 올려주세요.");
    const merchantId = (form.get("merchantId") as string) || null;
    const url = (form.get("url") as string) || null;
    const note = (form.get("note") as string) || "";

    const product =
      merchantId || url
        ? await resolveProduct(auth.supabase, { merchantId, url })
        : { name: "내 상품", advertiser: "", url: "", merchantId: null, context: "[상품 정보 없음: 상품 사진 기준으로 작업]" };

    const content: UserContent = [
      imageBlock(reference.data.toString("base64"), reference.type),
      ...(productImg ? [imageBlock(productImg.data.toString("base64"), productImg.type)] : []),
      {
        type: "text",
        text: `${product.context}\n\n${note ? `[추가 요청]\n${note}\n\n` : ""}${
          productImg ? "두 번째 이미지가 실제 상품 사진입니다." : "상품 사진은 없습니다."
        } 레퍼런스 분위기로 우리 상품 광고 사진 프롬프트를 만들어 주세요.`,
      },
    ];
    const output = await askJSON<BenchmarkOutput>(BENCHMARK_SYSTEM, content, 3000);

    const png = productImg
      ? await editImage(output.prompt, [productImg, reference])
      : await generateImage(output.prompt);
    const imageUrl = await uploadPng(auth.supabase, auth.user.id, png);

    const { data, error } = await auth.supabase
      .from("jobs")
      .insert({
        type: "benchmark",
        title: `${product.name} · 벤치마킹`,
        merchant_id: product.merchantId,
        input: { merchantId, url, note, hasProductImage: !!productImg },
        output,
        images: [{ key: "main", url: imageUrl, prompt: output.prompt, created_at: new Date().toISOString() }],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ job: data });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
