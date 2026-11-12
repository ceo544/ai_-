"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Busy from "@/components/Busy";
import MerchantSource, { hasSource, type SourceValue } from "@/components/MerchantSource";
import WorkList from "@/components/WorkList";
import { api, copyText, downloadZip } from "@/lib/api";
import { DAANGN_IMAGE_SUFFIX } from "@/lib/prompts";
import { copyLength } from "@/lib/text";
import type { DaangnOutput, Job, JobImage } from "@/lib/types";

const ANGLES: Record<string, string> = {
  condition: "조건형", number: "숫자", question: "질문형", loss: "손실회피",
  gift: "사은품", compare: "비교·전환", local: "동네 톤", now: "행동 유도",
};

export default function Page() {
  return <Suspense><Daangn /></Suspense>;
}

function Daangn() {
  const id = useSearchParams().get("id");
  return id ? <Studio id={id} /> : <Start />;
}

function Start() {
  const router = useRouter();
  const [src, setSrc] = useState<SourceValue>({ merchantId: null, url: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const { job } = await api<{ job: Job }>("/api/daangn", { method: "POST", json: { ...src, note } });
      router.push(`/creative/daangn?id=${job.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/" className="crumb">← 처음 화면</Link>
      <div className="page-head">
        <h1>눈길 끄는 카피 40개, 한 번에</h1>
        <p>25~27자 카피를 골라 쓰고, 어울리는 실사 사진도 만들어 보세요.</p>
      </div>
      <div className="panel">
        <MerchantSource value={src} onChange={setSrc} />
        <div className="field">
          <label htmlFor="note">추가로 강조할 점 (선택)</label>
          <textarea id="note" className="textarea" placeholder="예: 이번 달 사은품 1+1+1 강조, 30~40대 주부 타깃" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <p className="note">카피 40개와 사진 장면 10개를 추천합니다. 마음에 드는 장면을 골라 사진을 1장씩 만들 수 있어요.</p>
        <p className="note">정사각형 1024 × 1024 · 기획과 이미지 생성은 각각 API 비용이 발생합니다.</p>
        <div style={{ marginTop: 16 }}>
          <Busy busy={busy} className="btn daangn" onClick={run} disabled={!hasSource(src)}>
            {busy ? "카피 쓰는 중 (30초 정도)" : "카피 40개 추천받기"}
          </Busy>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
      <h2 className="section-title">당근 제작 기록</h2>
      <WorkList type="daangn" emptyText="아직 만든 당근 광고가 없습니다." />
    </>
  );
}

function Studio({ id }: { id: string }) {
  const [job, setJob] = useState<Job<DaangnOutput> | null>(null);
  const [error, setError] = useState("");
  const [copyIdx, setCopyIdx] = useState(0);
  const [angle, setAngle] = useState<string | null>(null);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ job: Job<DaangnOutput> }>(`/api/jobs?id=${id}`)
      .then(({ job }) => {
        setJob(job);
        setPrompt(job.output.scenes[0]?.prompt || "");
        setImgUrl(job.images.at(-1)?.url || null);
        setDraft(job.output.copies[0]?.text || "");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const out = job?.output;
  const visible = useMemo(
    () => (out?.copies || []).map((c, i) => ({ ...c, i })).filter((c) => !angle || c.angle === angle),
    [out, angle]
  );

  if (error) return <p className="error">{error}</p>;
  if (!job || !out) return <p className="note">불러오는 중…</p>;

  const imagesByScene = (i: number) => job.images.filter((im) => im.key === `scene-${i}`);
  const selected = out.copies[copyIdx];

  function pickCopy(i: number) {
    setCopyIdx(i);
    setDraft(out!.copies[i].text);
    setCopied(false);
  }

  function pickScene(i: number) {
    setSceneIdx(i);
    setPrompt(out!.scenes[i].prompt);
    const last = imagesByScene(i).at(-1);
    if (last) setImgUrl(last.url);
  }

  async function saveDraft() {
    const copies = out!.copies.map((c, i) => (i === copyIdx ? { ...c, text: draft } : c));
    const { job: updated } = await api<{ job: Job<DaangnOutput> }>("/api/jobs", {
      method: "PATCH", json: { id: job!.id, output: { ...out, copies } },
    });
    setJob(updated);
  }

  async function generate() {
    setGenBusy(true);
    setError("");
    try {
      const { image, images } = await api<{ image: JobImage; images: JobImage[] }>("/api/image", {
        method: "POST",
        json: { jobId: job!.id, key: `scene-${sceneIdx}`, prompt: prompt + DAANGN_IMAGE_SUFFIX },
      });
      setJob({ ...job!, images });
      setImgUrl(image.url);
    } catch (e) {
      setError((e as Error).message);
    }
    setGenBusy(false);
  }

  async function zipAll() {
    setZipBusy(true);
    try {
      const txt = out!.copies.map((c, i) => `${i + 1}. ${c.text}`).join("\n");
      await downloadZip(`${out!.product_name || "당근광고"}.zip`, [
        { name: "카피40.txt", text: txt },
        ...job!.images.map((im, i) => ({ name: `사진_${String(i + 1).padStart(2, "0")}.png`, url: im.url })),
      ]);
    } catch (e) {
      setError("내려받기에 실패했습니다: " + (e as Error).message);
    }
    setZipBusy(false);
  }

  const len = copyLength(draft);

  return (
    <>
      <Link href="/creative/daangn" className="crumb">← 당근 광고</Link>
      <div className="page-head">
        <h1>{job.title}</h1>
        <p>카피를 눌러 미리보기에 넣고, 장면을 골라 사진을 만드세요.</p>
      </div>

      <div className="studio">
        <div className="panel">
          <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>추천 카피 {out.copies.length}개</h2>
            <button className="btn ghost small" onClick={() => copyText(out.copies.map((c) => c.text).join("\n"))}>전체 복사</button>
          </div>
          <div className="angle-filter">
            <button className={`chip ${!angle ? "on" : ""}`} onClick={() => setAngle(null)}>전체</button>
            {Object.entries(ANGLES).map(([k, v]) => (
              <button key={k} className={`chip ${angle === k ? "on" : ""}`} onClick={() => setAngle(k)}>{v}</button>
            ))}
          </div>
          <ol className="copylist">
            {visible.map((c) => {
              const n = copyLength(c.text);
              const ok = n >= 25 && n <= 27;
              return (
                <li key={c.i} className={`copy ${c.i === copyIdx ? "on" : ""}`} onClick={() => pickCopy(c.i)}
                  tabIndex={0} onKeyDown={(e) => e.key === "Enter" && pickCopy(c.i)}>
                  <span className="n">{c.i + 1}</span>
                  <span className="txt">{c.text}</span>
                  <span className="gauge" title="공백 포함, 이모지 제외 글자수 (목표 25~27자)">
                    <span className={`num ${n > 30 ? "bad" : ""}`}>{n}/30</span>
                    <span className="track">
                      <span className="band" />
                      <span className={`fill ${ok ? "ok" : ""}`} style={{ width: `${Math.min(100, (n / 30) * 100)}%` }} />
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="sticky">
          <div className="feed">
            <div className="label">당근 피드 미리보기</div>
            <div className="item">
              {imgUrl ? <img className="thumb" src={imgUrl} alt="선택한 광고 사진" /> : <div className="thumb">사진을 만들면<br />여기 보여요</div>}
              <div>
                <div className="title">{draft || selected?.text}</div>
                <div className="sub">{out.advertiser} · 광고</div>
                <div className="cta">바로가기 ›</div>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <div className="field" style={{ marginBottom: 8 }}>
              <label htmlFor="draft">고른 카피 다듬기</label>
              <input id="draft" className="input" value={draft} onChange={(e) => setDraft(e.target.value)} />
            </div>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className={`count ${len > 30 ? "bad" : ""}`}>{len}/30자 (이모지 제외)</span>
              <span className="row">
                <button className="btn ghost small" onClick={async () => { await copyText(draft); setCopied(true); }}>{copied ? "복사됨" : "복사"}</button>
                <button className="btn small" onClick={saveDraft} disabled={draft === selected?.text}>수정 저장</button>
              </span>
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <h2>추천 사진 장면 {out.scenes.length}개</h2>
            <p className="note" style={{ marginBottom: 10 }}>장면을 하나 고른 뒤 생성해 주세요.</p>
            <div className="scenes">
              {out.scenes.map((s, i) => (
                <button key={i} className={`scene ${i === sceneIdx ? "on" : ""}`} onClick={() => pickScene(i)}>
                  {i + 1}. {s.title}
                  {imagesByScene(i).length > 0 && <span className="has">{imagesByScene(i).length}장</span>}
                </button>
              ))}
            </div>
            <details className="more" style={{ marginTop: 10 }}>
              <summary>사진 장면 수정</summary>
              <textarea className="textarea" style={{ minHeight: 120, fontSize: 13.5 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} aria-label="이미지 프롬프트" />
            </details>
            <p className="note" style={{ margin: "8px 0 12px" }}>버튼을 누르면 선택한 장면 1장만 생성합니다. 이미지 생성 비용이 발생합니다.</p>
            <Busy busy={genBusy} className="btn daangn" onClick={generate}>
              {genBusy ? "사진 만드는 중 (최대 1분)" : "선택한 장면 1장 생성"}
            </Busy>
            {error && <p className="error">{error}</p>}
          </div>

          {job.images.length > 0 && (
            <div className="panel" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
                <h2 style={{ margin: 0 }}>생성된 사진 {job.images.length}장</h2>
                <Busy busy={zipBusy} className="btn ghost small" onClick={zipAll}>전체 다운로드 (ZIP)</Busy>
              </div>
              <div className="gallery">
                {job.images.map((im) => (
                  <button key={im.url} className={im.url === imgUrl ? "on" : ""} onClick={() => setImgUrl(im.url)}>
                    <img src={im.url} alt="생성된 사진" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
