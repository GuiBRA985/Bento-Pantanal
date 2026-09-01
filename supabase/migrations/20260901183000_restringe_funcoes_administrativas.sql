-- Remove concessões antigas que não são necessárias para visitantes anônimos.

begin;

revoke execute on function public.assign_guide_login(uuid, text) from anon;
revoke execute on function public.can_manage_guide(text) from anon;
revoke execute on function public.is_admin() from anon;

commit;
