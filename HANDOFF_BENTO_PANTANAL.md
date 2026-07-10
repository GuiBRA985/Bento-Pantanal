# HANDOFF --- Bento Pantanal

## Objetivo

Este documento resume o estado atual do projeto **Bento Pantanal** para
continuar o desenvolvimento em uma nova conversa.

**Ignorar completamente qualquer outro projeto.**

------------------------------------------------------------------------

# Repositório

GitHub:

`https://github.com/GuiBRA985/Bento-Pantanal`

Domínio:

`https://pantanal.bento.host`

------------------------------------------------------------------------

# Objetivo do projeto

Criar a principal plataforma digital de turismo do Pantanal Norte.

A plataforma reunirá:

-   pousadas
-   destinos
-   mapa interativo
-   guias de turismo
-   informações sobre fauna
-   planejamento de viagens

O foco é ajudar o turista a escolher o melhor guia e fechar o passeio.

------------------------------------------------------------------------

# Estado atual

## Explorer

Já existe um mapa usando Leaflet.

Os dados são carregados por arquivos JavaScript.

Exemplo:

-   cidades.js
-   pousadas.js
-   destinos.js
-   pontes.js

Os marcadores já estão funcionando.

------------------------------------------------------------------------

## Banco de dados

Foi criado um projeto no Supabase.

Existe a tabela:

`guides`

Campos principais:

-   user_id
-   nome
-   email
-   slug
-   instagram
-   whatsapp
-   bio
-   idiomas
-   especialidades
-   foto_perfil
-   foto_capa
-   galeria_link
-   calendario_link
-   cadastur_numero
-   cadastur_status
-   status

Os primeiros registros são:

-   Bruno Marlon
-   Neyson Santos

Status:

`publicado`

------------------------------------------------------------------------

# Página pública dos guias

Já existe:

`guias.html`

Ela:

-   consulta o Supabase
-   mostra os cards
-   possui filtros
-   abre o perfil do guia

Também existe:

`guia.html?slug=nome-do-guia`

Exemplo:

`guia.html?slug=neyson-santos`

Essa página consulta o Supabase e monta o perfil automaticamente.

Não haverá mais páginas individuais por guia.

Tudo será dinâmico.

------------------------------------------------------------------------

# Conceito dos guias

Não é uma rede social.

É um catálogo profissional.

Objetivo:

Turista escolhe um guia.

Cada guia possui um perfil público.

Campos previstos:

-   Foto de capa
-   Foto de perfil
-   Nome
-   Biografia
-   Idiomas
-   Especialidades
-   WhatsApp
-   Instagram
-   E-mail
-   Link para galeria
-   Link do calendário
-   Número do Cadastur
-   Status do Cadastur

Posteriormente haverá selo de verificação.

------------------------------------------------------------------------

# Fluxo do guia

1.  Recebe convite.
2.  Cria conta.
3.  Confirma e-mail.
4.  Faz login.
5.  Edita apenas o próprio perfil.

Nunca poderá editar outro guia.

------------------------------------------------------------------------

# Próxima etapa

Criar:

`guia-login.html`

Funções:

-   Login Google
-   Login por e-mail
-   Recuperação de senha

Após login:

abrir

`guia-painel.html`

------------------------------------------------------------------------

# guia-painel.html

O painel permitirá editar:

-   Nome
-   Biografia
-   Idiomas
-   Especialidades
-   WhatsApp
-   Instagram
-   Foto de capa
-   Foto de perfil
-   Link da galeria
-   Link do Google Calendar
-   Número do Cadastur

Botão:

Salvar alterações.

------------------------------------------------------------------------

# Galeria

Para economizar armazenamento:

As fotos não ficarão no servidor.

Cada guia fornecerá um link público de:

-   Google Fotos
-   Google Drive
-   OneDrive

A página exibirá esse álbum.

------------------------------------------------------------------------

# Agenda

Cada guia poderá informar um calendário público do Google Calendar.

O turista poderá consultar disponibilidade.

------------------------------------------------------------------------

# Cadastur

Inicialmente:

O guia apenas informa o número.

Status:

"Aguardando validação"

No futuro haverá integração automática.

------------------------------------------------------------------------

# Administração

Somente o administrador poderá:

-   validar Cadastur
-   alterar status
-   remover guia
-   destacar parceiros

------------------------------------------------------------------------

# Evolução futura

Filtros:

-   Idioma
-   Região
-   Especialidade
-   Onças
-   Aves
-   Fotografia
-   Pesca
-   Família

Perfis poderão receber:

-   Guia Verificado
-   Guia Parceiro Pantanal Explorer

------------------------------------------------------------------------

# Filosofia

O objetivo não é criar mais uma rede social.

O objetivo é construir o maior catálogo profissional de guias do
Pantanal, onde cada guia controla seu próprio perfil, enquanto o
Pantanal Explorer concentra a descoberta, seleção e contato com
profissionais confiáveis.
