begin;

grant execute on function private.slugify(text) to authenticated;

commit;

