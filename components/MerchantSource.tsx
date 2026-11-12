"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Merchant } from "@/lib/types";

export interface SourceValue {
  merchantId: string | null;
  url: string;
}

/** 머천트 불러오기 또는 상품 페이지 주소 직접 입력 */
export default function MerchantSource({
  value, onChange, optional = false,
}: {
  value: SourceValue;
  onChange: (v: SourceValue) => void;
  optional?: boolean;
}) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  useEffect(() => {
    api<{ merchants: Merchant[] }>("/api/merchants").then((d) => setMerchants(d.merchants)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="field">
        <label htmlFor="merchant">어떤 상품을 광고할까요?{optional && " (선택)"}</label>
        <select
          id="merchant"
          className="select"
          value={value.merchantId || ""}
          onChange={(e) => onChange({ merchantId: e.target.value || null, url: "" })}
        >
          <option value="">머천트 불러오기 — 저장된 상품 선택</option>
          {merchants.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {merchants.length === 0 && (
          <span className="hint">
            저장된 머천트가 없습니다. 자주 쓰는 상품은 <Link href="/merchants" style={{ textDecoration: "underline" }}>머천트 분석</Link>에 등록해 두세요.
          </span>
        )}
      </div>
      {!value.merchantId && (
        <div className="field">
          <label htmlFor="url">또는 상품 페이지 주소</label>
          <input
            id="url"
            className="input"
            type="url"
            placeholder="https://"
            value={value.url}
            onChange={(e) => onChange({ merchantId: null, url: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

export function hasSource(v: SourceValue) {
  return !!v.merchantId || /^https?:\/\/.+/.test(v.url.trim());
}
