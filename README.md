# 광고 제작실

상품 주소 하나로 **당근 피드 광고 · AI 벤치마킹 사진 · 인스타 캐러셀 · 메타 광고 기획**을 만드는 팀 내부용 툴입니다.

- 프레임워크: Next.js 15 (App Router) → Vercel 배포
- 로그인·DB·이미지 저장: Supabase
- 카피·기획: Anthropic Claude API
- 이미지 생성: OpenAI 이미지 API (gpt-image-1)

## 1. Supabase 준비 (10분)

1. https://supabase.com 에서 새 프로젝트 생성
2. 왼쪽 메뉴 **SQL Editor** → `supabase/schema.sql` 내용을 붙여넣고 **Run**
   (테이블 2개, 보안 정책, `creatives` 이미지 버킷이 만들어집니다)
3. **Project Settings → API** 에서 `Project URL`, `anon public` 키 복사
4. 팀 내부용이면 **Authentication → Sign In / Providers → Email** 에서
   - 가입 확인 메일이 귀찮으면 `Confirm email` 끄기
   - 외부인 가입을 막으려면 팀원 계정 생성 후 `Allow new users to sign up` 끄기

## 2. API 키 준비

- Anthropic: https://console.anthropic.com → API Keys
- OpenAI: https://platform.openai.com → API keys
  (gpt-image-1은 조직 인증(Verify Organization)이 필요할 수 있습니다)

## 3. 로컬 실행

```bash
cp .env.example .env.local   # 키 채워넣기
npm install
npm run dev                  # http://localhost:3000
```

## 4. Vercel 배포

1. 이 폴더를 GitHub 저장소로 올리기
2. https://vercel.com/new 에서 저장소 Import
3. **Environment Variables** 에 `.env.example` 항목을 모두 입력
4. Deploy
5. Supabase **Authentication → URL Configuration** 의 Site URL을 Vercel 주소로 변경

> **함수 실행 시간 주의**: 이미지 생성은 20~60초, 벤치마킹은 최대 2분 걸립니다.
> Vercel Hobby 플랜은 함수 최대 실행 시간이 짧아 시간 초과가 날 수 있어요.
> 팀에서 쓸 거면 Pro 플랜을 권장합니다. (코드에 `maxDuration`이 120~240초로 잡혀 있습니다)

## 비용 감각 (대략)

| 작업 | 호출 | 비고 |
|---|---|---|
| 머천트 분석 | Claude 1회 | 몇십 원 수준 |
| 당근 카피 40개 + 장면 10개 | Claude 1회 | 몇십~100원 수준 |
| 이미지 1장 | OpenAI 1회 | `OPENAI_IMAGE_QUALITY` 에 따라 크게 다름 (low < medium < high) |

정확한 단가는 각 사 요금 페이지를 확인하세요. 테스트는 `low`로 하고, 실제 집행 소재만 `medium` 이상을 권장합니다.

## 프롬프트 고치기

모든 프롬프트는 **`lib/prompts.ts` 한 파일**에 있습니다.

- `DAANGN_SYSTEM`: 당근 카피 규칙(25~27자, 8개 각도 × 5개, 이모지, 금지 표현)과 사진 장면 규칙
- `DAANGN_IMAGE_SUFFIX`: 당근 사진에 항상 붙는 "스마트폰 실사, 글자 없음" 꼬리
- `BENCHMARK_SYSTEM`: 레퍼런스 분위기 분석 + 이미지 프롬프트
- `CAROUSEL_SYSTEM`: 카드뉴스/인스타툰 흐름, 글자수 제한
- `META_SYSTEM`: 타깃 3 × 각도 3 × 광고 9개, 메타 글자수·정책
- `MERCHANT_SYSTEM`: 상품 페이지에서 뽑을 항목

성과 좋았던 카피를 몇 개 `DAANGN_SYSTEM` 안에 "좋은 예시"로 넣어두면 결과가 그 스타일로 수렴합니다. 이게 원본 툴의 진짜 노하우에 해당하는 부분이에요.

## 폴더 구조

```
app/
  login/                 로그인·회원가입
  (app)/page.tsx         처음 화면
  (app)/merchants/       머천트 분석
  (app)/creative/daangn  당근 광고 (카피 40 + 장면 10 + 피드 미리보기 + ZIP)
  (app)/creative/benchmark  레퍼런스 사진 → 내 상품 사진
  (app)/creative/carousel   카드뉴스/인스타툰 + 문구 합성 PNG 저장
  (app)/creative/meta       메타 기획안 + 광고 미리보기
  (app)/works/           저장한 작업
  api/                   서버 API (키는 서버에서만 사용)
lib/
  prompts.ts             ★ 프롬프트 모음
  crawl.ts               상품 페이지 읽기
  ai/claude.ts           Claude 호출
  ai/image.ts            이미지 생성
supabase/schema.sql      DB 스키마
```

## 알려진 한계

- 이미지로만 된 상세페이지(쿠팡·스마트스토어 일부)는 글자 정보가 적어 분석이 약합니다. 이럴 땐 "추가로 강조할 점"에 핵심 혜택을 직접 적어주세요.
- 일부 쇼핑몰은 봇 접속을 막아 주소 분석이 실패할 수 있습니다.
- 생성 이미지 버킷은 공개 버킷입니다(주소는 추측 불가능한 uuid). 민감한 이미지는 넣지 마세요.
