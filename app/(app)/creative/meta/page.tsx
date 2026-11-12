"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Busy from "@/components/Busy";
import MerchantSource, { hasSource, type SourceValue } from "@/components/MerchantSource";
import WorkList from "@/components/WorkList";
import { api, copyText } from "@/lib/api";
import type { Job, JobImage, MetaAd, MetaOutput } from "@/lib/types";

const GOALS = ["전환 (구매·신청)", "잠재고객 (DB 수집)", "트래픽 (방문)", "인지도"];

export default function Page() {
  return <Suspense><Meta /></Suspense>;
}

function Meta() {
  const id = useSearchParams().get("id");
  return id ? <Plan id={id} /> : <Start />;
}

function Start() {
  const router = useRouter();
  const [src, setSrc] = useState<SourceValue>({ merchantId: null, url: "" });
  const [goal, setGoal] = useState(GOALS[0]);
  const [budget, setBudget] = useState("");
  const [region, setRegion] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run() {
    setBusy(true);
    setError("");
    try {
      const { job } = await api<{ job: Job }>("/api/meta", { method: "POST", json: { ...src, goal, budget, region, note } });
      router.push(`/creative/meta?id=${job.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <Link href="/" className="crumb">← 처음 화면</Link>
      <div className="page-head">
        <h1>메타 광고, 세팅 직전까지 기획</h1>
        <p>타깃 3개, 소구 각도 3개, 광고 문구 9개와 테스트 순서를 한 번에 받습니다.</p>
      </div>
      <div className="panel">
        <MerchantSource value={src} onChange={setSrc} />
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="field grow">
            <label htmlFor="goal">캠페인 목표</label>
            <select id="goal" className="select" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div className="field grow">
            <label htmlFor="budget">일 예산</label>
            <input id="budget" className="input" placeholder="예: 5만원" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="field grow">
            <label htmlFor="region">지역</label>
            <input id="region" className="input" placeholder="예: 서울·경기 (비우면 전국)" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="note">추가 요청 (선택)</label>
          <textarea id="note" className="textarea" placeholder="예: 기존에 가격 소구는 반응이 약했음" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Busy busy={busy} className="btn meta" onClick={run} disabled={!hasSource(src)}>
          {busy ? "기획하는 중 (40초 정도)" : "기획안 받기"}
        </Busy>
        {error && <p className="error">{error}</p>}
      </div>
      <h2 className="section-title">메타 기획 기록</h2>
      <WorkList type="meta" emptyText="아직 만든 메타 기획안이 없습니다." />
    </>
  );
}

function Count({ text, max }: { text: string; max: number }) {
  const n = [...text].length;
  return <span className={`count ${n > max ? "bad" : ""}`}>{n}/{max}</span>;
}

function Plan({ id }: { id: string }) {
  const [job, setJob] = useState<Job<MetaOutput> | null>(null);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ job: Job<MetaOutput> }>(`/api/jobs?id=${id}`).then(({ job }) => setJob(job)).catch((e) => setError(e.message));
  }, [id]);

  if (error && !job) return <p className="error">{error}</p>;
  if (!job) return <p className="note">불러오는 중…</p>;
  const o = job.output;
  const imageOf = (i: number) => job.images.filter((im) => im.key === `ad-${i}`).at(-1)?.url;

  async function gen(i: number) {
    setBusyIdx(i);
    setError("");
    try {
      const { images } = await api<{ image: JobImage; images: JobImage[] }>("/api/image", {
        method: "POST", json: { jobId: job!.id, key: `ad-${i}`, prompt: o.ads[i].creative.image_prompt },
      });
      setJob({ ...job!, images });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyIdx(null);
  }

  const adText = (a: MetaAd) => `[기본 문구]\n${a.primary_text}\n\n[제목] ${a.headline}\n[설명] ${a.description}\n[버튼] ${a.cta}`;

  return (
    <>
      <Link href="/creative/meta" className="crumb">← 메타 광고 기획</Link>
      <div className="page-head">
        <h1>{job.title}</h1>
        <p>{o.summary}</p>
      </div>

      <div className="panel">
        <h2>캠페인 구조</h2>
        <div className="agrid" style={{ marginTop: 0 }}>
          <div className="box"><h3>목표</h3><p>{o.objective}</p></div>
          <div className="box"><h3>퍼널</h3><p>{o.funnel}</p></div>
        </div>
      </div>

      <div className="panel">
        <h2>타깃 3개</h2>
        <div className="meta-grid">
          {o.audiences.map((a, i) => (
            <div key={i} className="box">
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              <ul>
                <li>연령 {a.age} · 성별 {a.gender}</li>
                {a.interests?.length > 0 && <li>관심사: {a.interests.join(", ")}</li>}
                {a.exclusions && <li>제외: {a.exclusions}</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>소구 각도</h2>
        <div className="meta-grid">
          {o.angles.map((a, i) => (
            <div key={i} className="box">
              <h3>{a.name}</h3>
              <p><b>훅</b> {a.hook}</p>
              <p className="note" style={{ marginTop: 6 }}>{a.why}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>광고 {o.ads.length}개</h2>
        {error && <p className="error" style={{ marginBottom: 10 }}>{error}</p>}
        <div className="meta-grid">
          {o.ads.map((a, i) => {
            const img = imageOf(i);
            return (
              <div key={i} className="ad">
                <div className="top">
                  <span className="tag" style={{ marginBottom: 6 }}>{a.angle} · {a.creative.format}</span>
                  <div style={{ marginTop: 6 }}>{a.primary_text}</div>
                  <Count text={a.primary_text} max={125} />
                </div>
                <div className="img">{img ? <img src={img} alt="" /> : a.creative.concept}</div>
                <div className="bottom">
                  <div>
                    <div className="hl">{a.headline} <Count text={a.headline} max={40} /></div>
                    <div className="ds">{a.description} <Count text={a.description} max={30} /></div>
                  </div>
                  <span className="ctab">{a.cta}</span>
                </div>
                <div className="acts">
                  <button className="btn ghost small" onClick={() => copyText(adText(a))}>문구 복사</button>
                  <Busy busy={busyIdx === i} className="btn ghost small" onClick={() => gen(i)}>{img ? "이미지 다시" : "이미지 만들기"}</Busy>
                  {img && <a className="btn ghost small" href={img} download target="_blank" rel="noreferrer">이미지 열기</a>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="agrid" style={{ marginTop: 0 }}>
          <div className="box"><h3>테스트 순서</h3><ol style={{ margin: "6px 0 0", paddingLeft: 18 }}>{o.test_plan.map((t, i) => <li key={i}>{t}</li>)}</ol></div>
          <div className="box">
            <h3>예산 배분</h3><p>{o.budget_tip}</p>
            {o.cautions?.length > 0 && (<><h3 style={{ marginTop: 14 }}>정책·표현 주의</h3><ul>{o.cautions.map((c, i) => <li key={i}>{c}</li>)}</ul></>)}
          </div>
        </div>
      </div>
    </>
  );
}
