"use client";

import { useState } from "react";
import WorkList from "@/components/WorkList";
import { JOB_LABEL, type JobType } from "@/lib/types";

const types = Object.keys(JOB_LABEL) as JobType[];

export default function WorksPage() {
  const [type, setType] = useState<JobType | undefined>();
  return (
    <>
      <div className="page-head">
        <h1>저장한 작업</h1>
        <p>만든 광고는 모두 여기에 자동으로 저장됩니다. 눌러서 이어서 작업하세요.</p>
      </div>
      <div className="angle-filter">
        <button className={`chip ${!type ? "on" : ""}`} onClick={() => setType(undefined)}>전체</button>
        {types.map((t) => (
          <button key={t} className={`chip ${type === t ? "on" : ""}`} onClick={() => setType(t)}>{JOB_LABEL[t]}</button>
        ))}
      </div>
      <WorkList key={type || "all"} type={type} limit={100} showType />
    </>
  );
}
