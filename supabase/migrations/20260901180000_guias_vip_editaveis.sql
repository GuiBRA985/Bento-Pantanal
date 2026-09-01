-- Perfis VIP editáveis e página padrão interna para todos os guias.

begin;

alter table public.guides alter column email drop not null;
alter table public.guides add column if not exists vip boolean not null default false;
alter table public.guides add column if not exists vip_position integer;
alter table public.guides add column if not exists personal_domain text;
alter table public.guides add column if not exists expedition_leader boolean not null default false;

create index if not exists guides_vip_order_idx
  on public.guides (vip desc, vip_position asc) where status = 'approved';

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
    new.vip := false;
    new.vip_position := null;
    new.personal_domain := null;
    new.expedition_leader := false;
  else
    new.id := old.id;
    new.user_id := old.user_id;
    new.slug := old.slug;
    new.created_at := old.created_at;
    new.status := old.status;
    new.cadastur_verificado := old.cadastur_verificado;
    new.cadastur_status := old.cadastur_status;
    new.vip := old.vip;
    new.vip_position := old.vip_position;
    new.personal_domain := old.personal_domain;
    new.expedition_leader := old.expedition_leader;

    if new.cadastur_numero is distinct from old.cadastur_numero then
      new.status := 'pending';
      new.cadastur_verificado := false;
      new.cadastur_status := 'aguardando validação';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.assign_guide_login(target_guide_id uuid, login_email text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem vincular contas.';
  end if;

  select id into matched_user_id
  from auth.users
  where lower(email) = lower(trim(login_email))
  order by created_at desc
  limit 1;

  if matched_user_id is null then
    raise exception 'Nenhuma conta encontrada com esse e-mail.';
  end if;

  if exists (
    select 1 from public.guides
    where user_id = matched_user_id and id <> target_guide_id
  ) then
    raise exception 'Essa conta já está vinculada a outro guia.';
  end if;

  update public.guides
  set user_id = matched_user_id, updated_at = now()
  where id = target_guide_id;

  if not found then
    raise exception 'Guia não encontrado.';
  end if;
  return true;
end;
$$;

revoke all on function public.assign_guide_login(uuid, text) from public;
revoke execute on function public.assign_guide_login(uuid, text) from anon;
grant execute on function public.assign_guide_login(uuid, text) to authenticated;

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
  vip,
  vip_position,
  personal_domain,
  expedition_leader,
  created_at,
  updated_at
from public.guides
where status = 'approved' and cadastur_verificado = true;

revoke all on table public.public_guide_profiles from public, anon, authenticated;
grant select on table public.public_guide_profiles to anon, authenticated;

-- A carga inicial precisa contornar somente o gatilho de edição do usuário.
alter table public.guides disable trigger protect_guide_profile_trigger;

insert into public.guides (
  nome, nome_profissional, slug, email, bio, whatsapp, instagram, site,
  idiomas, especialidades, regioes, cadastur_status, cadastur_verificado,
  status, vip, vip_position, personal_domain, expedition_leader
)
values
  (
    'Tchaco Pantaneiro', 'Tchaco Pantaneiro', 'tchaco-pantaneiro', null,
    'Guia profissional no Pantanal e integrante VIP da Rede de Guias Bento Pantanal.',
    '556599736139',
    'https://www.instagram.com/tchacopantaneiro',
    'https://www.pantanalwild4you.com.br/',
    '{}', '{}', '{}', 'verificado', true,
    'approved', true, 1, 'https://www.pantanalwild4you.com.br/', true
  ),
  (
    'Jhimy', 'Jhimy', 'jhimy', null,
    'Guia profissional no Pantanal e integrante VIP da Rede de Guias Bento Pantanal.',
    null, null,
    'https://www.pantanaltourexpress.com.br/',
    '{}', '{}', '{}', 'verificado', true,
    'approved', true, 2, 'https://www.pantanaltourexpress.com.br/', true
  )
on conflict (slug) do update set
  nome = excluded.nome,
  nome_profissional = excluded.nome_profissional,
  status = 'approved',
  cadastur_verificado = true,
  cadastur_status = 'verificado',
  vip = true,
  vip_position = excluded.vip_position,
  personal_domain = excluded.personal_domain,
  expedition_leader = true,
  updated_at = now();

alter table public.guides enable trigger protect_guide_profile_trigger;

commit;
