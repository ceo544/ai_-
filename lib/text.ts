const EMOJI = /\p{Extended_Pictographic}|\uFE0F|\u200D|[\u{1F3FB}-\u{1F3FF}]/gu;

/** 당근 카피 글자수: 공백 포함, 이모지 제외 */
export function copyLength(text: string) {
  return [...text.replace(EMOJI, "").trim()].length;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
