# Rede de Guias — operação da primeira versão

## Endereços

- Lista pública: `https://pantanal.bento.host/guias/`
- Cadastro: `https://pantanal.bento.host/guias/cadastro/`
- Acesso do guia: `https://pantanal.bento.host/guias/login/`
- Painel do guia: `https://pantanal.bento.host/guias/painel/`
- Administração: `https://pantanal.bento.host/admin/guias/`
- Perfil: `https://pantanal.bento.host/guias/perfil/?slug=nome-do-guia`

O arquivo `404.html` também encaminha URLs como `/guias/nome-do-guia` para o perfil dinâmico.

## Configuração do Supabase Auth

Em **Authentication → URL Configuration**, use:

- Site URL: `https://pantanal.bento.host`
- Redirect URLs:
  - `https://pantanal.bento.host/guias/cadastro/`
  - `https://pantanal.bento.host/guias/painel/`
  - `https://pantanal.bento.host/guias/login/`
  - `http://127.0.0.1:4173/**` durante o desenvolvimento local

O login por e-mail funciona com o provedor de e-mail padrão. O botão do Google exige que o provedor Google seja ativado no Supabase Auth.

## Definir o primeiro administrador

1. Crie uma conta normalmente em `/guias/login/` e confirme o e-mail.
2. No SQL Editor do projeto Supabase, execute substituindo o endereço:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('seu-email@exemplo.com')
on conflict (user_id) do nothing;
```

3. Acesse `/admin/guias/` com essa conta.

Não use metadados editáveis do usuário para conceder acesso administrativo.

## Teste completo

1. Crie uma conta de guia e confirme o e-mail.
2. Abra `/guias/cadastro/`, preencha os campos, envie fotos e informe o Cadastur.
3. Confirme no painel do guia que o status é **Aguardando verificação**.
4. Entre com a conta administradora em `/admin/guias/`.
5. Confira o Cadastur e clique em **Aprovar e verificar**.
6. Abra `/guias/` e acesse o perfil aprovado.
7. Teste o botão **Falar com o guia**.

## Segurança aplicada

- RLS habilitada em `guides`, `guide_gallery` e `admin_users`.
- Visitantes anônimos só leem perfis aprovados pela view `public_guide_profiles`.
- O número completo do Cadastur não é concedido ao visitante anônimo.
- Guias só inserem e alteram seu próprio perfil.
- Status, verificação do Cadastur, vínculo de usuário e exclusão são protegidos no banco.
- Alterar o Cadastur devolve automaticamente o perfil ao status `pending`.
- Imagens ficam no bucket público `guide-media`; gravação e remoção são limitadas à pasta do próprio usuário.

## Desenvolvimento local

O projeto é estático. Na raiz do repositório, execute um servidor HTTP, por exemplo:

```powershell
python -m http.server 4173
```

Depois abra `http://127.0.0.1:4173/guias/`.

Não abra os arquivos diretamente com `file://`, pois o fluxo de autenticação precisa de uma origem HTTP permitida.

