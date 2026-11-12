"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "info"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ type: "error", text: "이메일 또는 비밀번호가 맞지 않습니다." });
      else {
        router.replace("/");
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) setMsg({ type: "error", text: error.message });
      else if (data.session) {
        router.replace("/");
        router.refresh();
      } else setMsg({ type: "info", text: "확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 끝납니다." });
    }
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <div>
          <h1>상품 주소 하나로<br />광고 소재까지.</h1>
          <p>상품을 한 번 분석해 두면, 채널마다 맞는 카피와 사진을 바로 뽑아 씁니다.</p>
        </div>
        <div className="channels">
          <span>당근 피드</span><span>인스타 캐러셀</span><span>메타 광고</span><span>사진 벤치마킹</span>
        </div>
      </div>
      <div className="auth-right">
        <form className="auth-card" onSubmit={submit}>
          <h2>{mode === "login" ? "로그인" : "회원가입"}</h2>
          <p className="sub">팀 계정 이메일과 비밀번호를 입력하세요.</p>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="pw">비밀번호</label>
            <input id="pw" className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          <button className="btn" style={{ width: "100%" }} disabled={busy}>
            {busy && <span className="spinner" />}
            {mode === "login" ? "로그인" : "가입하기"}
          </button>
          {msg && <p className={msg.type === "error" ? "error" : "note"} style={{ marginTop: 12 }}>{msg.text}</p>}
          <p className="note" style={{ marginTop: 18 }}>
            {mode === "login" ? "계정이 없나요? " : "이미 계정이 있나요? "}
            <button type="button" className="linkbtn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMsg(null); }}>
              {mode === "login" ? "회원가입" : "로그인"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
