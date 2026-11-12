import OpenAI, { toFile } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const QUALITY = (process.env.OPENAI_IMAGE_QUALITY || "medium") as "low" | "medium" | "high";

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

function pick(res: OpenAI.ImagesResponse) {
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("이미지 생성 결과가 비어 있습니다.");
  return Buffer.from(b64, "base64");
}

export async function generateImage(prompt: string, size: ImageSize = "1024x1024") {
  const res = await openai.images.generate({ model: MODEL, prompt, size, quality: QUALITY, n: 1 });
  return pick(res);
}

/** 참고 이미지를 넣어 생성 (벤치마킹: 상품 사진 + 레퍼런스 사진) */
export async function editImage(
  prompt: string,
  images: { data: Buffer; name: string; type: string }[],
  size: ImageSize = "1024x1024"
) {
  const files = await Promise.all(images.map((i) => toFile(i.data, i.name, { type: i.type })));
  const res = await openai.images.edit({ model: MODEL, image: files, prompt, size, quality: QUALITY, n: 1 });
  return pick(res);
}
