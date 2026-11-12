"use client";

import { useEffect, useState } from "react";
import Busy from "@/components/Busy";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/text";
import type { Merchant, MerchantAnalysis } from "@/lib/types";

const SECTIONS: { key: keyof MerchantAnalysis; label: string }[] = [
  { key: "target", label: "타깃" },
  { key: "pains", label: "타깃의 고민" },
  { key: "benefits", label: "장점" },
  { key: "offers", label: "혜택·프로모션" },
  { key: "proof", label: "신뢰 근거" },
  { key: "cautions", label: "광고 표현 주의" },
];

export default function MerchantsPage() {
  const [list, setList] = useState<Merchant[] | null>(null);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ merchants: Merchant[] }>("/api/merchants").then((d) => setList(d.merchants)).catch((e) => setError(e.message));
  }, []);

  async function add() {
    setBusy(true);
    setError("");
    try {
      const { merchant } = await api<{ merchant: Merchant }>("/api/merchants", { method: "POST", json: { url, name } });
      setList((l) => [merchant, ...(l || [])]);
      setUrl("");
      setName("");
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function remove(m: Merchant) {
    if (!confirm(`'${m.name}' 머천트를 삭제할까요? 이 머천트로 만든 작업은 남습니다.`)) return;
    await api(`/api/merchants?id=${m.id}`, { method: "DELETE" });
    setList((l) => (l || []).filter((x) => x.id !== m.id));
  }

  return (
    <>
      <div className="page-head">
        <h1>머천트 분석</h1>
        <p>상품 페이지를 한 번 분석해 저장하면, 당근·캐러셀·메타 광고에서 바로 불러옵니다.</p>
      </div>

      <div className="panel">
        <h2>새 상품 등록</h2>
        <div className="row">
          <input className="input grow" type="url" placeholder="상품 페이지 주소 https://" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="상품 페이지 주소" />
          <input className="input" style={{ maxWidth: 220 }} placeholder="부를 이름 (선택)" value={name} onChange={(e) => setName(e.target.value)} aria-label="머천트 이름" />
          <Busy busy={busy} onClick={add} disabled={!/^https?:\/\/.+/.test(url)}>{busy ? "분석 중" : "분석하고 저장"}</Busy>
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          페이지 내용을 읽고 타깃, 고민, 혜택, 주의할 표현을 정리합니다. 이미지로만 된 상세페이지는 정보가 적게 잡힐 수 있어요.
        </p>
        {error && <p className="error">{error}</p>}
      </div>

      <h2 className="section-title">저장된 머천트</h2>
      {!list ? (
        <p className="note">불러오는 중…</p>
      ) : list.length === 0 ? (
        <div className="empty">아직 저장된 상품이 없습니다. 위에 상품 주소를 넣어 첫 머천트를 등록하세요.</div>
      ) : (
        <div className="mlist">
          {list.map((m) => (
            <details key={m.id} className="mitem">
              <summary>
                <span>
                  <span className="name">{m.name}</span>
                  <span className="url">{m.url}</span>
                </span>
                <span className="note">{formatDate(m.created_at)}</span>
              </summary>
              <p style={{ marginTop: 12 }}>{m.analysis.one_liner}</p>
              {m.analysis.price_info && <p className="note" style={{ marginTop: 4 }}>가격: {m.analysis.price_info}</p>}
              <div className="agrid">
                {SECTIONS.map((s) => {
                  const items = (m.analysis[s.key] as string[]) || [];
                  if (!items.length) return null;
                  return (
                    <div key={s.key} className="box">
                      <h3>{s.label}</h3>
                      <ul>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
                    </div>
                  );
                })}
              </div>
              <div className="row" style={{ marginTop: 12, justifyContent: "space-between" }}>
                <span className="note">말투: {m.analysis.tone}</span>
                <button className="linkbtn" onClick={() => remove(m)}>삭제</button>
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
