# Rede de Guias Bento Pantanal — primeira versão funcional

## Endereços

- Lista pública: `https://pantanal.bento.host/guias/`
- Cadastro gratuito: `https://pantanal.bento.host/guias/cadastro/`
- Login: `https://pantanal.bento.host/guias/login/`
- Painel do guia: `https://pantanal.bento.host/guias/painel/`
- Administração: `https://pantanal.bento.host/admin/guias/`
- Perfil amigável: `https://pantanal.bento.host/guias/nome-do-guia`
- Perfil de compatibilidade: `https://pantanal.bento.host/guias/perfil/?slug=nome-do-guia`

## Arquitetura encontrada e mantida

O Bento Pantanal continua como site estático no GitHub Pages. A Rede de Guias usa o mesmo projeto Supabase que já existia e reaproveita a tabela `guides`. Os registros antigos com status `publicado` são convertidos para `approved` pela migration.

Não há servidor Node, build ou variável secreta no navegador. A URL e a chave `anon` pública do Supabase ficam em `/js/supabase-config.js`. Nunca coloque a chave `service_role` nesse arquivo.

## Guias VIP

Os perfis VIP ficam no início do array `VIP_GUIDES`, em `/js/guides-list.js`. Eles usam o mesmo cartão da listagem, recebem o selo **Guia VIP** e o botão **Ver perfil** abre a página profissional externa.

Os dois primeiros são:

- Tchaco Pantaneiro → `https://www.pantanalwild4you.com.br/`
- Jhimy → `https://www.pantanaltourexpress.com.br/`

Idiomas, regiões, especialidades e fotografias desses cartões podem ser preenchidos posteriormente no mesmo bloco, sem alterar as páginas exclusivas.

## Ativação do banco

Antes de testar cadastro e administração, abra o **SQL Editor** do Supabase e execute integralmente:

`supabase/migrations/20260901090000_rede_guias.sql`

A migration:

- amplia a tabela `guides` sem apagar os dados existentes;
- cria `guide_gallery` e `admin_users`;
- cria a view segura `public_guide_profiles`, sem o número completo do Cadastur;
- normaliza os status para `pending`, `approved`, `rejected` e `suspended`;
- cria o bucket público `guide-media`;
- aplica RLS e políticas de armazenamento;
- impede o guia de aprovar o próprio perfil;
- devolve o perfil a `pending` quando o Cadastur é alterado.

## Configuração do Supabase Auth

Em **Authentication → URL Configuration**, configure:

- Site URL: `https://pantanal.bento.host`
- Redirect URLs:
  - `https://pantanal.bento.host/guias/cadastro/`
  - `https://pantanal.bento.host/guias/login/`
  - `https://pantanal.bento.host/guias/painel/`
  - `https://pantanal.bento.host/admin/guias/`
  - `http://127.0.0.1:4173/**` para testes locais

O acesso por e-mail e senha funciona com o provedor de e-mail do Supabase. O botão Google só funciona depois que o provedor Google for ativado em **Authentication → Providers**.

## Definir o primeiro administrador

1. Crie uma conta em `/guias/login/` e confirme o e-mail.
2. No SQL Editor, execute substituindo o endereço pelo e-mail da conta escolhida:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('administrador@exemplo.com')
on conflict (user_id) do nothing;
```

3. Entre em `https://pantanal.bento.host/admin/guias/`.

O acesso administrativo não usa metadados editáveis pelo usuário.

## Teste completo

1. Abra `/guias/cadastro/`.
2. Crie uma conta e confirme o e-mail, se a confirmação estiver habilitada.
3. Entre novamente e preencha o perfil com Cadastur, fotos, idioma e região.
4. Envie o cadastro. Ele ficará `pending` e não aparecerá em `/guias/`.
5. Entre como administrador em `/admin/guias/`.
6. Abra o cadastro, confira o Cadastur e clique em **Aprovar e verificar**.
7. O guia aparecerá em `/guias/`.
8. Abra `/guias/nome-do-guia` e teste **Falar com o guia** e **Compartilhar perfil**.
9. No painel do guia, altere o Cadastur. O banco deve devolver o perfil para `pending` e ocultá-lo da lista pública.

## Desenvolvimento local

Na raiz do repositório:

```bash
python -m http.server 4173
```

Abra `http://127.0.0.1:4173/guias/`. Não use `file://`, pois a autenticação precisa de uma origem HTTP autorizada.

## Observação sobre URLs amigáveis no GitHub Pages

O arquivo `/404.html` reconhece caminhos no formato `/guias/slug` e monta o perfil no navegador sem mudar o endereço. Isso entrega a URL amigável ao visitante. Como o GitHub Pages não executa rotas dinâmicas no servidor, previews Open Graph específicos por guia dependem de uma futura função de borda ou geração de páginas estáticas; as metatags de identidade da Rede já ficam preparadas e são atualizadas no navegador.
