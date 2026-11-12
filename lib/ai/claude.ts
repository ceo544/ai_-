import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export type UserContent = Anthropic.MessageParam["content"];

/** JSON만 돌려받는 호출. 실패 시 한 번 재시도 */
export async function askJSON<T>(system: string, content: UserContent, maxTokens = 8000): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: system + "\n\n반드시 JSON 객체 하나만 출력하세요. 설명, 마크다운, 코드펜스 없이.",
      messages: [{ role: "user", content }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    try {
      return parseJSON<T>(text);
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error("AI 응답을 해석하지 못했습니다. 다시 시도해 주세요. " + String(lastError));
}

export function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("JSON 없음");
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

export function imageBlock(base64: string, mediaType: string): Anthropic.ImageBlockParam {
  return {
    type: "image",
    source: { type: "base64", media_type: mediaType as Anthropic.Base64ImageSource["media_type"], data: base64 },
  };
}
