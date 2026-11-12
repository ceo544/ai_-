import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobImage } from "./types";

export async function uploadPng(supabase: SupabaseClient, userId: string, data: Buffer) {
  const path = `${userId}/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from("creatives").upload(path, data, {
    contentType: "image/png",
    upsert: false,
  });
  if (error) throw new Error("이미지 저장 실패: " + error.message);
  return supabase.storage.from("creatives").getPublicUrl(path).data.publicUrl;
}

export async function appendJobImage(supabase: SupabaseClient, jobId: string, image: JobImage) {
  const { data: job, error } = await supabase.from("jobs").select("images").eq("id", jobId).single();
  if (error || !job) throw new Error("작업을 찾을 수 없습니다.");
  const images = [...((job.images as JobImage[]) || []), image];
  const { error: upErr } = await supabase.from("jobs").update({ images }).eq("id", jobId);
  if (upErr) throw new Error(upErr.message);
  return images;
}
