"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/text";
import { JOB_LABEL, JOB_PATH, type Job, type JobType } from "@/lib/types";

export default function WorkList({ type, limit = 12, showType = false, emptyText }: {
  type?: JobType; limit?: number; showType?: boolean; emptyText?: string;
}) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ limit: String(limit) });
    if (type) q.set("type", type);
    api<{ jobs: Job[] }>(`/api/jobs?${q}`).then((d) => setJobs(d.jobs)).catch((e) => setError(e.message));
  }, [type, limit]);

  if (error) return <p className="error">{error}</p>;
  if (!jobs) return <p className="note">불러오는 중…</p>;
  if (jobs.length === 0) return <div className="empty">{emptyText || "아직 만든 작업이 없습니다."}</div>;

  return (
    <div className="works">
      {jobs.map((j) => (
        <Link key={j.id} href={`${JOB_PATH[j.type]}?id=${j.id}`} className="work">
          <span className="t">{j.title}</span>
          {j.images?.length > 0 && (
            <span className="thumbs">
              {j.images.slice(-4).map((im) => <img key={im.url} src={im.url} alt="" />)}
            </span>
          )}
          <span className="meta">
            <span>{formatDate(j.created_at)}</span>
            {showType && <span className="tag">{JOB_LABEL[j.type]}</span>}
          </span>
        </Link>
      ))}
    </div>
  );
}
