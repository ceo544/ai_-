"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Busy from "@/components/Busy";
import MerchantSource, { hasSource, type SourceValue } from "@/components/MerchantSource";
import WorkList from "@/components/WorkList";
import { api, copyText, downloadZip, saveBlob } from "@/lib/api";
import { renderSlide } from "@/lib/slide-render";
import type { CarouselOutput, Job, JobImage } from "@/lib/types";

export default function Page() {
  return <Suspense><Carousel /></Suspense>;
}

function Carousel() {
  const id = useSearchParams().get("id");
  return id ? <Studio id={id} /> : <Start />;
}

function Start() {
  const router = useRouter();
  const [src, setSrc] = useState<SourceValue>({ merchantId: null, url: "" });
  const [format, setFormat] = useState<"cardnews" | "instatoon">("cardnews");
  const [count, setCount] = useState(6);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const { job } = await api<{ job: Job }>("/api/carousel", { method: "POST", json: { ...src, format, count, note } });
      router.push(`/creative/carousel?id=${job.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/" className="crumb">← 처음 화면</Link>
      <div className="page-head">
        <h1>넘겨 보는 광고, 장마다 기획</h1>
        <p>첫 장은 멈추게, 마지막 장은 누르게. 문구와 이미지를 장별로 만듭니다.</p>
      </div>
      <div className="panel">
        <div className="field">
          <label>형식</label>
          <div className="seg">
            <button className={format === "cardnews" ? "on" : ""} onClick={() => setFormat("cardnews")}>카드뉴스</button>
            <button className={format === "instatoon" ? "on" : ""} onClick={() => setFormat("instatoon")}>인스타툰</button>
          </div>
          <span className="hint">{format === "cardnews" ? "문제 제기부터 혜택까지 정보형으로 풀어갑니다." : "주인공 한 명의 짧은 에피소드로 풀고, 캐릭터 외형을 장마다 맞춥니다."}</span>
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <label htmlFor="count">장 수</label>
          <select id="count" className="select" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[4, 5, 6, 7, 8, 10].map((n) => <option key={n} value={n}>{n}장</option>)}
          </select>
        </div>
        <MerchantSource value={src} onChange={setSrc} />
        <div className="field">
          <label htmlFor="note">추가 요청 (선택)</label>
          <textarea id="note" className="textarea" placeholder="예: 자취하는 20대 직장인 이야기로" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Busy busy={busy} className="btn carousel" onClick={run} disabled={!hasSource(src)}>
          {busy ? "기획하는 중" : "캐러셀 기획하기"}
        </Busy>
        {error && <p className="error">{error}</p>}
      </div>
      <h2 className="section-title">캐러셀 기록</h2>
      <WorkList type="carousel" emptyText="아직 만든 캐러셀이 없습니다." />
    </>
  );
}

function Studio({ id }: { id: string }) {
  const [job, setJob] = useState<Job<CarouselOutput> | null>(null);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [allBusy, setAllBusy] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ job: Job<CarouselOutput> }>(`/api/jobs?id=${id}`).then(({ job }) => setJob(job)).catch((e) => setError(e.message));
  }, [id]);

  if (error && !job) return <p className="error">{error}</p>;
  if (!job) return <p className="note">불러오는 중…</p>;
  const out = job.output;
  const imageOf = (i: number) => job.images.filter((im) => im.key === `slide-${i}`).at(-1)?.url || null;

  async function gen(i: number, current: Job<CarouselOutput>) {
    const { images } = await api<{ image: JobImage; images: JobImage[] }>("/api/image", {
      method: "POST", json: { jobId: current.id, key: `slide-${i}`, prompt: current.output.slides[i].image_prompt },
    });
    return { ...current, images };
  }

  async function genOne(i: number) {
    setBusyIdx(i);
    setError("");
    try { setJob(await gen(i, job!)); } catch (e) { setError((e as Error).message); }
    setBusyIdx(null);
  }

  async function genMissing() {
    setAllBusy(true);
    setError("");
    let cur = job!;
    try {
      for (let i = 0; i < out.slides.length; i++) {
        if (cur.images.some((im) => im.key === `slide-${i}`)) continue;
        setBusyIdx(i);
        cur = await gen(i, cur);
        setJob(cur);
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyIdx(null);
    setAllBusy(false);
  }

  function editSlide(i: number, field: "headline" | "body" | "image_prompt", value: string) {
    const slides = out.slides.map((s, k) => (k === i ? { ...s, [field]: value } : s));
    setJob({ ...job!, output: { ...out, slides } });
  }

  async function persist() {
    await api("/api/jobs", { method: "PATCH", json: { id: job!.id, output: job!.output } }).catch(() => {});
  }

  async function downloadSlide(i: number) {
    try { saveBlob(await renderSlide(out.slides[i], imageOf(i), i, out.slides.length), `slide_${i + 1}.png`); }
    catch (e) { setError((e as Error).message); }
  }

  async function zipAll() {
    setZipBusy(true);
    try {
      const files = [];
      for (let i = 0; i < out.slides.length; i++) {
        files.push({ name: `slide_${String(i + 1).padStart(2, "0")}.png`, blob: await renderSlide(out.slides[i], imageOf(i), i, out.slides.length) });
      }
      files.push({ name: "캡션.txt", text: `${out.caption}\n\n${out.hashtags.map((h) => "#" + h).join(" ")}` });
      await downloadZip(`${out.title || "캐러셀"}.zip`, files);
    } catch (e) {
      setError((e as Error).message);
    }
    setZipBusy(false);
  }

  return (
    <>
      <Link href="/creative/carousel" className="crumb">← 캐러셀 광고</Link>
      <div className="page-head">
        <h1>{out.title}</h1>
        <p>{out.format === "instatoon" ? "인스타툰" : "카드뉴스"} {out.slides.length}장 · 문구를 바로 고치면 미리보기에 반영됩니다.</p>
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        <Busy busy={allBusy} className="btn carousel" onClick={genMissing}>{allBusy ? "이미지 만드는 중" : "빈 장 이미지 모두 만들기"}</Busy>
        <Busy busy={zipBusy} className="btn ghost" onClick={zipAll}>완성본 전체 다운로드 (ZIP)</Busy>
        <span className="note">이미지는 장마다 생성 비용이 발생합니다.</span>
      </div>
      {error && <p className="error" style={{ marginBottom: 12 }}>{error}</p>}

      <div className="slides">
        {out.slides.map((s, i) => {
          const img = imageOf(i);
          return (
            <div key={i} className="slide">
              <div className={`canvas ${img ? "" : "noimg"}`}>
                {img && <img src={img} alt="" />}
                <span className="idx">{i + 1}/{out.slides.length}</span>
                <div className="overlay">
                  <div className="h">{s.headline}</div>
                  <div className="b">{s.body}</div>
                </div>
              </div>
              <div className="tools-row">
                <input className="input" value={s.headline} onChange={(e) => editSlide(i, "headline", e.target.value)} onBlur={persist} aria-label={`${i + 1}장 제목`} />
                <textarea className="textarea" style={{ minHeight: 60 }} value={s.body} onChange={(e) => editSlide(i, "body", e.target.value)} onBlur={persist} aria-label={`${i + 1}장 본문`} />
                <details className="more">
                  <summary>이미지 프롬프트</summary>
                  <textarea className="textarea" style={{ fontSize: 12.5 }} value={s.image_prompt} onChange={(e) => editSlide(i, "image_prompt", e.target.value)} onBlur={persist} />
                </details>
                <div className="row">
                  <Busy busy={busyIdx === i} className="btn small" onClick={() => genOne(i)} disabled={allBusy}>{img ? "이미지 다시" : "이미지 만들기"}</Busy>
                  <button className="btn ghost small" onClick={() => downloadSlide(i)}>이 장 저장</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>게시물 본문</h2>
          <button className="btn ghost small" onClick={() => copyText(`${out.caption}\n\n${out.hashtags.map((h) => "#" + h).join(" ")}`)}>본문 복사</button>
        </div>
        <p style={{ whiteSpace: "pre-line", marginTop: 12 }}>{out.caption}</p>
        <p className="note" style={{ marginTop: 10 }}>{out.hashtags.map((h) => "#" + h).join(" ")}</p>
      </div>
    </>
  );
}
