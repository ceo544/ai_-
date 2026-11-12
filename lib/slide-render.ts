import type { CarouselSlide } from "./types";

const SIZE = 1080;
const FONT = '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif';

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const ch of [...para]) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        // 한국어는 어절 단위로 끊는 게 자연스러워서, 마지막 공백에서 자름
        const cut = line.lastIndexOf(" ");
        if (cut > 0) {
          lines.push(line.slice(0, cut));
          line = line.slice(cut + 1) + ch;
        } else {
          lines.push(line);
          line = ch;
        }
      } else line = test;
    }
    lines.push(line);
  }
  return lines;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    img.src = url;
  });
}

/** 이미지 + 문구를 1080×1080 PNG로 합성 */
export async function renderSlide(slide: CarouselSlide, imageUrl: string | null, index: number, total: number) {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  if (imageUrl) {
    ctx.drawImage(await loadImage(imageUrl), 0, 0, SIZE, SIZE);
    const g = ctx.createLinearGradient(0, SIZE * 0.45, 0, SIZE);
    g.addColorStop(0, "rgba(10,14,30,0)");
    g.addColorStop(1, "rgba(10,14,30,0.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
  } else {
    ctx.fillStyle = "#17203b";
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  const pad = 76;
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";

  ctx.font = `800 76px ${FONT}`;
  const hLines = wrap(ctx, slide.headline, SIZE - pad * 2);
  ctx.font = `500 38px ${FONT}`;
  const bLines = wrap(ctx, slide.body, SIZE - pad * 2);

  const blockH = hLines.length * 92 + 24 + bLines.length * 56;
  let y = imageUrl ? SIZE - pad - blockH + 76 : (SIZE - blockH) / 2 + 76;

  ctx.font = `800 76px ${FONT}`;
  for (const l of hLines) { ctx.fillText(l, pad, y); y += 92; }
  y += 24 - 92 + 56;
  ctx.font = `500 38px ${FONT}`;
  ctx.globalAlpha = 0.92;
  for (const l of bLines) { ctx.fillText(l, pad, y); y += 56; }
  ctx.globalAlpha = 1;

  ctx.font = `600 30px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(`${index + 1}/${total}`, SIZE - pad, pad + 10);

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 합성 실패"))), "image/png")
  );
}
