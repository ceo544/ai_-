import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "광고 제작실",
  description: "상품 하나로 당근·인스타·메타 광고 소재를 준비하는 팀 광고 제작실",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
