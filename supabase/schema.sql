create table if not exists public.site_content (
  id text primary key check (id = 'greeting'),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update on table public.site_content to authenticated;

drop policy if exists "Anyone can read greeting" on public.site_content;
create policy "Anyone can read greeting"
  on public.site_content for select
  to anon, authenticated
  using (id = 'greeting');

drop policy if exists "Admins can insert greeting" on public.site_content;
create policy "Admins can insert greeting"
  on public.site_content for insert
  to authenticated
  with check (
    id = 'greeting'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

drop policy if exists "Admins can update greeting" on public.site_content;
create policy "Admins can update greeting"
  on public.site_content for update
  to authenticated
  using (
    id = 'greeting'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  )
  with check (
    id = 'greeting'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  true,
  3670016,
  array['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/flac']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read audio" on storage.objects;
create policy "Public can read audio"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'audio');

drop policy if exists "Admins can upload audio" on storage.objects;
create policy "Admins can upload audio"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'audio'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
  );
