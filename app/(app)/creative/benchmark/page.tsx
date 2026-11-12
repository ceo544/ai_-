"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Busy from "@/components/Busy";
import MerchantSource, { type SourceValue } from "@/components/MerchantSource";
import WorkList from "@/components/WorkList";
import { api, copyText, saveBlob } from "@/lib/api";
import type { BenchmarkOutput, Job, JobImage } from "@/lib/types";

export default function Page() {
  return <Suspense><Benchmark /></Suspense>;
}

function Benchmark() {
  const id = useSearchParams().get("id");
  return id ? <Result id={id} /> : <Start />;
}

function DropBox({ label, file, onFile }: { label: string; file: File | null; onFile: (f: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <label className="drop"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}>
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onFile(e.target.files?.[0] || null)} />
      {preview ? <img src={preview} alt={label} /> : <span>{label}<br /><span className="note">눌러서 고르거나 끌어다 놓기</span></span>}
    </label>
  );
}

function Start() {
  const router = useRouter();
  const [reference, setReference] = useState<File | null>(null);
  const [product, setProduct] = useState<File | null>(null);
  const [src, setSrc] = useState<SourceValue>({ merchantId: null, url: "" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("reference", reference!);
      if (product) fd.append("product", product);
      if (src.merchantId) fd.append("merchantId", src.merchantId);
      if (src.url) fd.append("url", src.url);
      fd.append("note", note);
      const { job } = await api<{ job: Job }>("/api/benchmark", { method: "POST", body: fd });
      router.push(`/creative/benchmark?id=${job.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/" className="crumb">← 처음 화면</Link>
      <div className="page-head">
        <h1>잘 된 광고 사진의 분위기를 내 상품으로</h1>
        <p>레퍼런스의 구도·조명·색감만 가져오고, 로고나 글자는 따라 하지 않습니다.</p>
      </div>
      <div className="panel">
        <div className="two">
          <div>
            <p className="field"><label>벤치마킹할 사진 (필수)</label></p>
            <DropBox label="레퍼런스 광고 사진" file={reference} onFile={setReference} />
          </div>
          <div>
            <p className="field"><label>내 상품 사진 (권장)</label></p>
            <DropBox label="실제 상품 사진" file={product} onFile={setProduct} />
          </div>
        </div>
        <p className="note" style={{ margin: "10px 0 18px" }}>상품 사진을 넣으면 상품 모양과 라벨을 유지한 채 분위기만 바꿉니다. 없으면 상품 정보를 보고 새로 그립니다.</p>
        <MerchantSource value={src} onChange={setSrc} optional />
        <div className="field">
          <label htmlFor="note">추가 요청 (선택)</label>
          <textarea id="note" className="textarea" placeholder="예: 배경은 원목 식탁, 아침 햇살 느낌" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Busy busy={busy} className="btn bench" onClick={run} disabled={!reference}>
          {busy ? "분석하고 사진 만드는 중 (1~2분)" : "이미지 만들기"}
        </Busy>
        {error && <p className="error">{error}</p>}
      </div>
      <h2 className="section-title">벤치마킹 기록</h2>
      <WorkList type="benchmark" emptyText="아직 만든 벤치마킹 사진이 없습니다." />
    </>
  );
}

const ANALYSIS_LABEL: Record<string, string> = {
  mood: "분위기", composition: "구도", lighting: "조명", color: "색감", props: "소품·배경", camera: "앵글",
};

function Result({ id }: { id: string }) {
  const [job, setJob] = useState<Job<BenchmarkOutput> | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ job: Job<BenchmarkOutput> }>(`/api/jobs?id=${id}`)
      .then(({ job }) => { setJob(job); setCurrent(job.images.at(-1)?.url || null); setPrompt(job.output.prompt); })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error && !job) return <p className="error">{error}</p>;
  if (!job) return <p className="note">불러오는 중…</p>;

  async function regenerate() {
    setBusy(true);
    setError("");
    try {
      const { image, images } = await api<{ image: JobImage; images: JobImage[] }>("/api/image", {
        method: "POST", json: { jobId: job!.id, key: "variant", prompt },
      });
      setJob({ ...job!, images });
      setCurrent(image.url);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <>
      <Link href="/creative/benchmark" className="crumb">← AI 벤치마킹</Link>
      <div className="page-head"><h1>{job.title}</h1></div>
      <div className="studio">
        <div>
          {current && <img className="result-img" src={current} alt="생성된 광고 사진" />}
          {job.images.length > 1 && (
            <div className="gallery" style={{ marginTop: 10 }}>
              {job.images.map((im) => (
                <button key={im.url} className={im.url === current ? "on" : ""} onClick={() => setCurrent(im.url)}>
                  <img src={im.url} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn ghost small" onClick={async () => current && saveBlob(await (await fetch(current)).blob(), "벤치마킹.png")}>사진 내려받기</button>
          </div>
        </div>
        <div className="sticky">
          <div className="panel">
            <h2>레퍼런스 분석</h2>
            <div className="agrid" style={{ marginTop: 0 }}>
              {Object.entries(job.output.analysis).map(([k, v]) => (
                <div key={k} className="box"><h3>{ANALYSIS_LABEL[k] || k}</h3><p>{v}</p></div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>함께 쓸 카피</h2>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {job.output.copies.map((c, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {c} <button className="linkbtn" onClick={() => copyText(c)}>복사</button>
                </li>
              ))}
            </ol>
          </div>
          <div className="panel">
            <details className="more">
              <summary>프롬프트 고쳐서 다시 만들기</summary>
              <textarea className="textarea" style={{ minHeight: 140, fontSize: 13.5, marginTop: 8 }} value={prompt} onChange={(e) => setPrompt(e.target.value)} aria-label="이미지 프롬프트" />
              <p className="note" style={{ margin: "6px 0 10px" }}>다시 만들 때는 올린 사진 없이 프롬프트만으로 생성합니다.</p>
              <Busy busy={busy} className="btn bench" onClick={regenerate}>{busy ? "만드는 중" : "다시 만들기"}</Busy>
            </details>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
