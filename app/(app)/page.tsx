import Link from "next/link";
import WorkList from "@/components/WorkList";

const tools = [
  { href: "/creative/daangn", title: "당근 광고", desc: "피드에 맞는 25~27자 카피 40개와 동네 실사 느낌 사진을 만듭니다.", go: "카피 40개 받기", c: "var(--daangn)" },
  { href: "/creative/benchmark", title: "AI 자유 벤치마킹", desc: "잘 된 광고 사진의 분위기를 내 상품 사진으로 옮깁니다.", go: "사진 만들기", c: "var(--bench)" },
  { href: "/creative/carousel", title: "캐러셀 광고", desc: "넘겨 보는 카드뉴스와 인스타툰을 장마다 기획하고 이미지까지 뽑습니다.", go: "캐러셀 기획하기", c: "var(--carousel)" },
  { href: "/creative/meta", title: "메타 광고 기획", desc: "타깃, 소구 각도, 광고 문구 9개와 테스트 순서를 한 번에 짭니다.", go: "기획안 받기", c: "var(--meta)" },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>어떤 광고를<br />만들까요?</h1>
          <p>상품을 고르고, 채널에 맞는 문구와 사진을 받아, 마음에 드는 것만 골라 저장하세요.</p>
        </div>
        <ol className="steps">
          <li><b>1</b>상품 선택: 머천트를 불러오거나 주소 입력</li>
          <li><b>2</b>문구 다듬기: 추천 카피 중 골라 고치기</li>
          <li><b>3</b>작업 저장: 사진과 카피를 한 번에 내려받기</li>
        </ol>
      </section>

      <div className="merchant-strip">
        <div>
          <h2>머천트 분석</h2>
          <p>상품 주소와 분석 내용을 한 번 저장해 두면, 모든 광고에서 불러와 씁니다.</p>
        </div>
        <Link href="/merchants" className="btn ghost small">머천트 등록·관리</Link>
      </div>

      <div className="tools">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="tool" style={{ ["--c" as string]: t.c }}>
            <span className="bar" />
            <span className="body">
              <h3>{t.title}</h3>
              <p>{t.desc}</p>
              <span className="go">{t.go}</span>
            </span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">최근 작업</h2>
      <WorkList limit={8} showType emptyText="아직 만든 작업이 없습니다. 위에서 광고 종류를 골라 시작하세요." />
    </>
  );
}
