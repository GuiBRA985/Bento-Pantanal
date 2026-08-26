begin;

grant select (
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
  criado_em,
  status
) on public.guides to anon;

commit;

