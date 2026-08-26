begin;

create extension if not exists unaccent with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter table public.guides
  add column if not exists nome_profissional text,
  add column if not exists facebook text,
  add column if not exists site text,
  add column if not exists regioes text[] default '{}'::text[],
  add column if not exists cadastur_verificado boolean default false,
  add column if not exists latitude numeric(9,6),
  add column if not exists longitude numeric(9,6);

update public.guides
set
  status = case
    when status = 'publicado' then 'approved'
    when status in ('approved', 'pending', 'rejected', 'suspended') then status
    else 'pending'
  end,
  cadastur_verificado = case
    when status = 'publicado' then true
    else coalesce(cadastur_verificado, false)
  end,
  cadastur_status = case
    when status = 'publicado' then 'verificado'
    else coalesce(cadastur_status, 'aguardando_validacao')
  end,
  idiomas = coalesce(idiomas, '{}'::text[]),
  especialidades = coalesce(especialidades, '{}'::text[]),
  regioes = coalesce(regioes, '{}'::text[]),
  criado_em = coalesce(criado_em, now()),
  atualizado_em = coalesce(atualizado_em, now());

alter table public.guides
  alter column status set default 'pending',
  alter column status set not null,
  alter column cadastur_status set default 'aguardando_validacao',
  alter column cadastur_status set not null,
  alter column cadastur_verificado set default false,
  alter column cadastur_verificado set not null,
  alter column idiomas set default '{}'::text[],
  alter column idiomas set not null,
  alter column especialidades set default '{}'::text[],
  alter column especialidades set not null,
  alter column regioes set default '{}'::text[],
  alter column regioes set not null,
  alter column criado_em set default now(),
  alter column criado_em set not null,
  alter column atualizado_em set default now(),
  alter column atualizado_em set not null;

alter table public.guides drop constraint if exists guides_status_check;
alter table public.guides add constraint guides_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'));

alter table public.guides drop constraint if exists guides_latitude_check;
alter table public.guides add constraint guides_latitude_check
  check (latitude is null or latitude between -90 and 90);

alter table public.guides drop constraint if exists guides_longitude_check;
alter table public.guides add constraint guides_longitude_check
  check (longitude is null or longitude between -180 and 180);

create unique index if not exists guides_one_profile_per_user_idx
  on public.guides (user_id)
  where user_id is not null;
create index if not exists guides_status_idx on public.guides (status);
create index if not exists guides_user_id_idx on public.guides (user_id);
create index if not exists guides_languages_gin_idx on public.guides using gin (idiomas);
create index if not exists guides_regions_gin_idx on public.guides using gin (regioes);
create index if not exists guides_specialties_gin_idx on public.guides using gin (especialidades);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

create table if not exists public.guide_gallery (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  image_url text not null,
  caption text,
  position integer not null default 0 check (position >= 0),
  criado_em timestamptz not null default now()
);

create index if not exists guide_gallery_guide_position_idx
  on public.guide_gallery (guide_id, position, criado_em);

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create or replace function private.slugify(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(
    lower(extensions.unaccent(coalesce(value, ''))),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

revoke all on function private.slugify(text) from public, anon, authenticated;

create or replace function private.prepare_guide()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base_slug text;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base_slug := private.slugify(coalesce(new.nome_profissional, new.nome));
    new.slug := base_slug;

    if exists (select 1 from public.guides where slug = new.slug and id <> new.id) then
      new.slug := base_slug || '-' || left(new.id::text, 8);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.cadastur_numero is distinct from old.cadastur_numero then
    new.status := 'pending';
    new.cadastur_verificado := false;
    new.cadastur_status := 'aguardando_validacao';
  end if;

  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists guides_prepare_before_write on public.guides;
create trigger guides_prepare_before_write
before insert or update on public.guides
for each row execute function private.prepare_guide();

alter table public.guides enable row level security;
alter table public.admin_users enable row level security;
alter table public.guide_gallery enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'guides'
  loop
    execute format('drop policy if exists %I on public.guides', policy_record.policyname);
  end loop;
end;
$$;

create policy guides_public_select_approved
on public.guides for select
to anon
using (status = 'approved');

create policy guides_authenticated_select
on public.guides for select
to authenticated
using (
  status = 'approved'
  or user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy guides_self_insert
on public.guides for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
  and status = 'pending'
  and cadastur_verificado = false
);

create policy guides_self_or_admin_update
on public.guides for update
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_admin())
)
with check (
  user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy admin_users_read_own_or_admin
on public.admin_users for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.is_admin())
);

create policy guide_gallery_public_select
on public.guide_gallery for select
to anon
using (
  exists (
    select 1 from public.guides
    where guides.id = guide_gallery.guide_id
      and guides.status = 'approved'
  )
);

create policy guide_gallery_authenticated_select
on public.guide_gallery for select
to authenticated
using (
  exists (
    select 1 from public.guides
    where guides.id = guide_gallery.guide_id
      and (
        guides.status = 'approved'
        or guides.user_id = (select auth.uid())
        or (select private.is_admin())
      )
  )
);

create policy guide_gallery_owner_insert
on public.guide_gallery for insert
to authenticated
with check (
  exists (
    select 1 from public.guides
    where guides.id = guide_gallery.guide_id
      and guides.user_id = (select auth.uid())
  )
  or (select private.is_admin())
);

create policy guide_gallery_owner_update
on public.guide_gallery for update
to authenticated
using (
  exists (
    select 1 from public.guides
    where guides.id = guide_gallery.guide_id
      and guides.user_id = (select auth.uid())
  )
  or (select private.is_admin())
)
with check (
  exists (
    select 1 from public.guides
    where guides.id = guide_gallery.guide_id
      and guides.user_id = (select auth.uid())
  )
  or (select private.is_admin())
);

create policy guide_gallery_owner_delete
on public.guide_gallery for delete
to authenticated
using (
  exists (
    select 1 from public.guides
    where guides.id = guide_gallery.guide_id
      and guides.user_id = (select auth.uid())
  )
  or (select private.is_admin())
);

create or replace view public.public_guide_profiles
with (security_invoker = true)
as
select
  id,
  slug,
  nome,
  nome_profissional,
  bio,
  meu_pantanal,
  whatsapp,
  email,
  instagram,
  facebook,
  site,
  regioes,
  idiomas,
  especialidades,
  foto_perfil,
  foto_capa,
  cadastur_verificado,
  cadastur_status,
  criado_em
from public.guides
where status = 'approved';

revoke all on public.guides from anon, authenticated;
grant select on public.guides to authenticated;
grant insert on public.guides to authenticated;
grant update (
  nome,
  nome_profissional,
  email,
  bio,
  meu_pantanal,
  whatsapp,
  instagram,
  facebook,
  site,
  galeria_link,
  calendario_link,
  regioes,
  idiomas,
  especialidades,
  foto_perfil,
  foto_capa,
  cadastur_numero
) on public.guides to authenticated;

revoke all on public.public_guide_profiles from public, anon, authenticated;
grant select on public.public_guide_profiles to anon, authenticated;

revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

revoke all on public.guide_gallery from anon, authenticated;
grant select on public.guide_gallery to anon, authenticated;
grant insert, update, delete on public.guide_gallery to authenticated;

create or replace function public.admin_review_guide(
  p_guide_id uuid,
  p_status text,
  p_cadastur_verified boolean default false
)
returns public.guides
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed public.guides;
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'Acesso administrativo necessário';
  end if;

  if p_status not in ('pending', 'approved', 'rejected', 'suspended') then
    raise exception 'Status inválido';
  end if;

  if p_status = 'approved' and not p_cadastur_verified then
    raise exception 'A aprovação exige a confirmação do Cadastur';
  end if;

  update public.guides
  set
    status = p_status,
    cadastur_verificado = p_cadastur_verified,
    cadastur_status = case
      when p_cadastur_verified then 'verificado'
      else 'aguardando_validacao'
    end,
    atualizado_em = now()
  where id = p_guide_id
  returning * into reviewed;

  if reviewed.id is null then
    raise exception 'Guia não encontrado';
  end if;

  return reviewed;
end;
$$;

revoke all on function public.admin_review_guide(uuid, text, boolean) from public, anon;
grant execute on function public.admin_review_guide(uuid, text, boolean) to authenticated;

create or replace function public.admin_delete_guide(p_guide_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.is_admin() then
    raise exception 'Acesso administrativo necessário';
  end if;

  delete from public.guides where id = p_guide_id;
end;
$$;

revoke all on function public.admin_delete_guide(uuid) from public, anon;
grant execute on function public.admin_delete_guide(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'guide-media',
  'guide-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists guide_media_owner_select on storage.objects;
create policy guide_media_owner_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'guide-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists guide_media_owner_insert on storage.objects;
create policy guide_media_owner_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'guide-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists guide_media_owner_update on storage.objects;
create policy guide_media_owner_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'guide-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'guide-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists guide_media_owner_delete on storage.objects;
create policy guide_media_owner_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'guide-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

commit;

