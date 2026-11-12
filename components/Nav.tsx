"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { href: "/creative/daangn", label: "당근 광고", color: "var(--daangn)" },
  { href: "/creative/benchmark", label: "AI 벤치마킹", color: "var(--bench)" },
  { href: "/creative/carousel", label: "캐러셀 광고", color: "var(--carousel)" },
  { href: "/creative/meta", label: "메타 광고 기획", color: "var(--meta)" },
];

export default function Nav({ logout }: { logout: () => Promise<void> }) {
  const path = usePathname();
  const cls = (href: string) => (href === "/" ? path === "/" : path.startsWith(href)) ? "active" : "";
  return (
    <aside className="side">
      <Link href="/" className="brand">광고 제작실</Link>
      <Link href="/" className={cls("/")}>처음 화면</Link>
      <Link href="/merchants" className={cls("/merchants")}>머천트 분석</Link>
      <div className="group">만들기</div>
      {tools.map((t) => (
        <Link key={t.href} href={t.href} className={cls(t.href)}>
          <span className="dot" style={{ background: t.color }} />
          {t.label}
        </Link>
      ))}
      <div className="group">보관</div>
      <Link href="/works" className={cls("/works")}>저장한 작업</Link>
      <form action={logout}>
        <button className="logout">로그아웃</button>
      </form>
    </aside>
  );
}
