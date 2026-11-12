export type JobType = "daangn" | "benchmark" | "carousel" | "meta";

export interface MerchantAnalysis {
  name: string;
  brand: string;
  category: string;
  one_liner: string;
  price_info: string;
  target: string[];
  pains: string[];
  benefits: string[];
  offers: string[];
  proof: string[];
  tone: string;
  keywords: string[];
  cautions: string[];
}

export interface Merchant {
  id: string;
  name: string;
  url: string;
  analysis: MerchantAnalysis;
  created_at: string;
}

export interface JobImage {
  key: string;
  url: string;
  prompt: string;
  created_at: string;
}

export interface Job<T = any> {
  id: string;
  type: JobType;
  title: string;
  merchant_id: string | null;
  input: Record<string, any>;
  output: T;
  images: JobImage[];
  created_at: string;
}

export interface DaangnOutput {
  product_name: string;
  advertiser: string;
  copies: { text: string; angle: string }[];
  scenes: { title: string; prompt: string }[];
}

export interface BenchmarkOutput {
  analysis: {
    mood: string;
    composition: string;
    lighting: string;
    color: string;
    props: string;
    camera: string;
  };
  prompt: string;
  copies: string[];
}

export interface CarouselSlide {
  role: string;
  headline: string;
  body: string;
  image_prompt: string;
}

export interface CarouselOutput {
  format: "cardnews" | "instatoon";
  title: string;
  character?: string;
  caption: string;
  hashtags: string[];
  slides: CarouselSlide[];
}

export interface MetaAd {
  angle: string;
  primary_text: string;
  headline: string;
  description: string;
  cta: string;
  creative: { format: string; concept: string; image_prompt: string };
}

export interface MetaOutput {
  summary: string;
  objective: string;
  funnel: string;
  audiences: { name: string; description: string; age: string; gender: string; interests: string[]; exclusions: string }[];
  angles: { name: string; hook: string; why: string }[];
  ads: MetaAd[];
  test_plan: string[];
  budget_tip: string;
  cautions: string[];
}

export const JOB_LABEL: Record<JobType, string> = {
  daangn: "당근 광고",
  benchmark: "AI 벤치마킹",
  carousel: "캐러셀 광고",
  meta: "메타 광고 기획",
};

export const JOB_PATH: Record<JobType, string> = {
  daangn: "/creative/daangn",
  benchmark: "/creative/benchmark",
  carousel: "/creative/carousel",
  meta: "/creative/meta",
};
