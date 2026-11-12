-- Supabase SQL Editor에 붙여넣고 실행하세요.

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  url text not null,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  type text not null check (type in ('daangn','benchmark','carousel','meta')),
  title text not null,
  merchant_id uuid references public.merchants(id) on delete set null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists jobs_user_created on public.jobs(user_id, created_at desc);
create index if not exists merchants_user_created on public.merchants(user_id, created_at desc);

alter table public.merchants enable row level security;
alter table public.jobs enable row level security;

-- 팀 내부용: 본인 데이터만 보고 쓰기
create policy "own merchants" on public.merchants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 생성 이미지 저장소 (공개 버킷, 경로에 uuid가 들어가 추측 불가)
insert into storage.buckets (id, name, public)
values ('creatives', 'creatives', true)
on conflict (id) do nothing;

create policy "upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'creatives' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'creatives' and (storage.foldername(name))[1] = auth.uid()::text);
