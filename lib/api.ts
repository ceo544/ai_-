/** 클라이언트에서 API 호출 (에러 메시지를 그대로 던짐) */
export async function api<T = any>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init || {};
  const res = await fetch(path, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* 타임아웃 등으로 JSON이 아닐 때 */
  }
  if (!res.ok) {
    if (res.status === 504) throw new Error("처리 시간이 초과됐습니다. 잠시 뒤 다시 시도해 주세요.");
    throw new Error(data?.error || `요청 실패 (${res.status})`);
  }
  return data as T;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

/** 이미지 + 텍스트 파일 묶어서 ZIP 다운로드 */
export async function downloadZip(
  filename: string,
  files: { name: string; url?: string; blob?: Blob; text?: string }[]
) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (const f of files) {
    if (f.text !== undefined) zip.file(f.name, f.text);
    else if (f.blob) zip.file(f.name, f.blob);
    else if (f.url) zip.file(f.name, await (await fetch(f.url)).blob());
  }
  const blob = await zip.generateAsync({ type: "blob" });
  saveBlob(blob, filename);
}

export function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
