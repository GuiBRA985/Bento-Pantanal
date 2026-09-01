-- Rede de Guias Bento Pantanal
-- Compatível com a tabela public.guides já existente no projeto.

begin;

create extension if not exists pgcrypto;

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  nome text,
  email text,
  slug text,
  instagram text,
  whatsapp text,
  bio text,
  idiomas text[] default '{}',
  especialidades text[] default '{}',
  foto_perfil text,
  foto_capa text,
  galeria_link text,
  calendario_link text,
  cadastur_numero text,
  cadastur_status text,
  status text default 'pending',
  created_at timestamptz not null default now()
);

alter table public.guides add column if not exists nome_profissional text;
alter table public.guides add column if not exists facebook text;
alter table public.guides add column if not exists site text;
alter table public.guides add column if not exists regioes text[] default '{}';
alter table public.guides add column if not exists cadastur_verificado boolean not null default false;
alter table public.guides add column if not exists created_at timestamptz not null default now();
alter table public.guides add column if not exists updated_at timestamptz not null default now();

-- Perfis que já estavam publicados foram aprovados manualmente no sistema antigo.
update public.guides
set cadastur_verificado = true
where lower(coalesce(status, '')) in ('publicado', 'approved')
   or lower(coalesce(cadastur_status, '')) in ('verificado', 'validado', 'aprovado');

update public.guides
set status = case lower(coalesce(status, ''))
  when 'publicado' then 'approved'
  when 'aprovado' then 'approved'
  when 'approved' then 'approved'
  when 'rejeitado' then 'rejected'
  when 'rejected' then 'rejected'
  when 'suspenso' then 'suspended'
  when 'suspended' then 'suspended'
  else 'pending'
end;

update public.guides set updated_at = coalesce(updated_at, created_at, now());

alter table public.guides drop constraint if exists guides_status_check;
alter table public.guides add constraint guides_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'));

create unique index if not exists guides_slug_unique_idx
  on public.guides (lower(slug)) where slug is not null;
create unique index if not exists guides_user_unique_idx
  on public.guides (user_id) where user_id is not null;
create index if not exists guides_status_idx on public.guides (status);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.guide_slug(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(input, 'guia'),
      'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN')),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

create or replace function public.protect_guide_profile()
returns trigger
language plpgsql
set search_path = public, auth
as $$
begin
  new.updated_at := now();
  new.slug := public.guide_slug(coalesce(nullif(new.slug, ''), new.nome));

  if public.is_admin() then
    return new;
  end if;

  if auth.uid() is null then
    raise exception 'É necessário entrar na conta.';
  end if;

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.status := 'pending';
    new.cadastur_verificado := false;
    new.cadastur_status := 'aguardando validação';
  else
    new.id := old.id;
    new.user_id := old.user_id;
    new.slug := old.slug;
    new.created_at := old.created_at;
    new.status := old.status;
    new.cadastur_verificado := old.cadastur_verificado;
    new.cadastur_status := old.cadastur_status;

    if new.cadastur_numero is distinct from old.cadastur_numero then
      new.status := 'pending';
      new.cadastur_verificado := false;
      new.cadastur_status := 'aguardando validação';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_guide_profile_trigger on public.guides;
create trigger protect_guide_profile_trigger
before insert or update on public.guides
for each row execute function public.protect_guide_profile();

-- Cria a galeria usando exatamente o mesmo tipo da chave guides.id,
-- seja UUID ou bigint no projeto antigo.
do $$
declare
  guide_id_type text;
begin
  select pg_catalog.format_type(a.atttypid, a.atttypmod)
    into guide_id_type
  from pg_catalog.pg_attribute a
  join pg_catalog.pg_class c on c.oid = a.attrelid
  join pg_catalog.pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'guides' and a.attname = 'id' and a.attnum > 0;

  execute format(
    'create table if not exists public.guide_gallery (
      id uuid primary key default gen_random_uuid(),
      guide_id %s not null references public.guides(id) on delete cascade,
      image_url text not null,
      storage_path text,
      caption text,
      position integer not null default 0,
      created_at timestamptz not null default now()
    )', guide_id_type
  );
end $$;

alter table public.guide_gallery add column if not exists storage_path text;
alter table public.guide_gallery add column if not exists caption text;
alter table public.guide_gallery add column if not exists position integer not null default 0;
alter table public.guide_gallery add column if not exists created_at timestamptz not null default now();
create index if not exists guide_gallery_guide_idx on public.guide_gallery (guide_id, position, created_at);

create or replace function public.can_view_guide(target_guide_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guides g
    where g.id::text = target_guide_id
      and (
        (g.status = 'approved' and g.cadastur_verificado = true)
        or g.user_id = auth.uid()
        or public.is_admin()
      )
  );
$$;

create or replace function public.can_manage_guide(target_guide_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.guides g
    where g.id::text = target_guide_id
      and (g.user_id = auth.uid() or public.is_admin())
  );
$$;

revoke all on function public.can_view_guide(text) from public;
revoke all on function public.can_manage_guide(text) from public;
grant execute on function public.can_view_guide(text) to anon, authenticated;
grant execute on function public.can_manage_guide(text) to authenticated;

-- Remove políticas antigas dessas tabelas. Políticas permissivas se somam por OR;
-- deixar uma política antiga poderia anular a proteção nova.
do $$
declare policy_row record;
begin
  for policy_row in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('guides', 'guide_gallery', 'admin_users')
  loop
    execute format('drop policy %I on public.%I', policy_row.policyname, policy_row.tablename);
  end loop;
end $$;

alter table public.guides enable row level security;
alter table public.guide_gallery enable row level security;
alter table public.admin_users enable row level security;

revoke all on table public.guides from anon, authenticated;
grant select, insert, update, delete on table public.guides to authenticated;

create policy guides_select_own_or_admin
on public.guides for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy guides_insert_own_pending
on public.guides for insert to authenticated
with check (
  (user_id = auth.uid() and status = 'pending' and cadastur_verificado = false)
  or public.is_admin()
);

create policy guides_update_own_or_admin
on public.guides for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

create policy guides_delete_admin
on public.guides for delete to authenticated
using (public.is_admin());

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

create policy admin_users_read_self
on public.admin_users for select to authenticated
using (user_id = auth.uid());

revoke all on table public.guide_gallery from anon, authenticated;
grant select on table public.guide_gallery to anon, authenticated;
grant insert, update, delete on table public.guide_gallery to authenticated;

create policy gallery_read_public_or_owner
on public.guide_gallery for select to anon, authenticated
using (public.can_view_guide(guide_id::text));

create policy gallery_insert_owner
on public.guide_gallery for insert to authenticated
with check (public.can_manage_guide(guide_id::text));

create policy gallery_update_owner
on public.guide_gallery for update to authenticated
using (public.can_manage_guide(guide_id::text))
with check (public.can_manage_guide(guide_id::text));

create policy gallery_delete_owner
on public.guide_gallery for delete to authenticated
using (public.can_manage_guide(guide_id::text));

-- A view pública não contém o número completo do Cadastur nem o user_id.
drop view if exists public.public_guide_profiles;
create view public.public_guide_profiles
with (security_barrier = true)
as
select
  id,
  slug,
  nome,
  nome_profissional,
  bio,
  foto_perfil,
  foto_capa,
  whatsapp,
  email,
  instagram,
  facebook,
  site,
  regioes,
  idiomas,
  especialidades,
  cadastur_verificado,
  created_at,
  updated_at
from public.guides
where status = 'approved' and cadastur_verificado = true;

revoke all on table public.public_guide_profiles from public, anon, authenticated;
grant select on table public.public_guide_profiles to anon, authenticated;

-- Armazenamento público das imagens; somente o dono grava em sua pasta.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guide-media', 'guide-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists guide_media_public_read on storage.objects;
drop policy if exists guide_media_insert_own_folder on storage.objects;
drop policy if exists guide_media_update_own_folder on storage.objects;
drop policy if exists guide_media_delete_own_folder on storage.objects;

create policy guide_media_public_read
on storage.objects for select to public
using (bucket_id = 'guide-media');

create policy guide_media_insert_own_folder
on storage.objects for insert to authenticated
with check (
  bucket_id = 'guide-media'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

create policy guide_media_update_own_folder
on storage.objects for update to authenticated
using (bucket_id = 'guide-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'guide-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy guide_media_delete_own_folder
on storage.objects for delete to authenticated
using (bucket_id = 'guide-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

commit;
