# Atualização manual — Rede de Guias

Este pacote foi preparado para o repositório `GuiBRA985/Bento-Pantanal` e para o domínio `pantanal.bento.host`.

## O que mudou

- o botão **Ver perfil** abre uma página existente no GitHub Pages e não gera mais erro 404;
- foi adicionado um `404.html` na raiz para recuperar links antigos no formato `/guias/nome-do-guia`;
- o cadastro gratuito foi reduzido ao essencial: nome, foto de perfil, foto de capa, Cadastur, WhatsApp e Instagram;
- o perfil gratuito mostra capa, foto, nome, selo de verificação, WhatsApp e Instagram;
- os campos complementares continuam disponíveis no painel do guia, mas agora são opcionais;
- as páginas antigas de compatibilidade apenas redirecionam para a versão atual e não consultam diretamente dados privados.

## Como subir pelo GitHub

1. Abra o repositório `Bento-Pantanal`.
2. Envie os arquivos deste pacote preservando exatamente as pastas.
3. Quando o GitHub perguntar, confirme a substituição dos arquivos existentes.
4. Aguarde a publicação do GitHub Pages.
5. Abra `https://pantanal.bento.host/guias/` e atualize a página com `Ctrl + F5`.

## Banco de dados

O projeto Supabase `Bento-Pantanal` já está ativo e as migrations principais da Rede de Guias já estão aplicadas. Não execute novamente as migrations antigas apenas para esta atualização visual.

Antes do primeiro cadastro real, execute uma vez o arquivo `supabase/APLICAR_PRIVACIDADE_EMAIL.sql` no SQL Editor. Ele impede que o e-mail usado para entrar na conta seja incluído na consulta pública dos perfis.

Para aprovar novos cadastros, é necessário cadastrar uma conta como administradora. Primeiro crie a conta pela página de login e depois execute o arquivo `supabase/CRIAR_PRIMEIRO_ADMIN.sql` no SQL Editor, substituindo o e-mail indicado.

## Endereços para o teste

- Rede pública: `https://pantanal.bento.host/guias/`
- Cadastro gratuito: `https://pantanal.bento.host/guias/cadastro/`
- Login: `https://pantanal.bento.host/guias/login/`
- Painel do guia: `https://pantanal.bento.host/guias/painel/`
- Administração: `https://pantanal.bento.host/admin/guias/`
- Perfil padrão: `https://pantanal.bento.host/guias/perfil/?slug=nome-do-guia`

## Fluxo do primeiro teste

1. Cadastre a guia.
2. Confirme o e-mail dela, caso a confirmação esteja habilitada no Supabase.
3. Envie os dados e as fotos.
4. O cadastro ficará pendente e invisível ao público.
5. Entre na administração, confira o Cadastur e aprove.
6. O cartão aparecerá na Rede de Guias e o botão **Ver perfil** abrirá a página padrão.
