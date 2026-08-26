begin;

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

  if tg_op = 'UPDATE' and not private.is_admin() and (
    new.status is distinct from old.status
    or new.cadastur_verificado is distinct from old.cadastur_verificado
    or new.cadastur_status is distinct from old.cadastur_status
    or new.user_id is distinct from old.user_id
  ) then
    raise exception 'Campos de aprovação são exclusivos da administração';
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

drop policy if exists guides_admin_delete on public.guides;
create policy guides_admin_delete
on public.guides for delete
to authenticated
using ((select private.is_admin()));

grant update (status, cadastur_verificado, cadastur_status) on public.guides to authenticated;
grant delete on public.guides to authenticated;

drop function if exists public.admin_review_guide(uuid, text, boolean);
drop function if exists public.admin_delete_guide(uuid);

commit;

