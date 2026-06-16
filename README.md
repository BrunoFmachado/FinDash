# FINDASH

Projeto web para controle financeiro pessoal, desenvolvido com **HTML**, **CSS** e **JavaScript puro**.

O objetivo do sistema é permitir o gerenciamento de informações financeiras como contas, transações, metas, boletos e visão geral do saldo, mantendo uma estrutura simples, organizada e fácil de evoluir.

---

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- LocalStorage
- Estrutura modular por arquivos

---

## Objetivo do projeto

O APP-FINANÇAS tem como finalidade auxiliar no controle financeiro pessoal, permitindo ao usuário organizar melhor suas informações financeiras em diferentes áreas do sistema.

Entre as funcionalidades previstas/implementadas estão:

- Cadastro e gerenciamento de contas
- Controle de transações financeiras
- Controle de contas/boletos
- Cadastro de metas financeiras
- Visão geral do dashboard financeiro
- Persistência de dados no navegador utilizando LocalStorage

---

## Estrutura atual do projeto

Atualmente, o projeto está organizado da seguinte forma:

```txt
APP-FINANCAS/
│
├── assets/
│   └── icons/
│
├── css/
│   ├── components.css
│   ├── dashboard.css
│   ├── forms.css
│   ├── globals.css
│   ├── layout.css
│   ├── tables.css
│   └── variables.css
│
├── js/
│   ├── accounts.js
│   ├── app.js
│   ├── bills.js
│   ├── dashboard.js
│   ├── goals.js
│   ├── script.js
│   ├── seed.js
│   ├── storage.js
│   ├── transaction.js
│   └── utils.js
│
├── pages/
│   ├── accounts.html
│   ├── bills.html
│   ├── goals.html
│   ├── overview.html
│   └── transactions.html
│
├── index.html
└── README.md

Organização dos arquivos
assets/

Pasta responsável por armazenar arquivos estáticos do projeto, como ícones, imagens e outros recursos visuais.

css/

Pasta responsável pelos arquivos de estilo da aplicação.

variables.css: variáveis globais de cores, espaçamentos, fontes e demais padrões visuais.
globals.css: estilos globais aplicados em todo o projeto.
layout.css: estrutura visual principal, como containers, grid, sidebar e organização das páginas.
components.css: estilos reutilizáveis de componentes.
forms.css: estilos específicos para formulários.
tables.css: estilos específicos para tabelas.
dashboard.css: estilos específicos da tela de dashboard.
js/

Pasta responsável pelos arquivos JavaScript da aplicação.

app.js: arquivo principal da aplicação.
script.js: arquivo geral inicial, que deverá ser reorganizado conforme a evolução da arquitetura.
storage.js: responsável pela comunicação com o LocalStorage.
utils.js: funções utilitárias reutilizáveis.
seed.js: dados iniciais para popular ou testar o sistema.
accounts.js: lógica relacionada à tela de contas.
bills.js: lógica relacionada à tela de contas/boletos.
goals.js: lógica relacionada à tela de metas.
transaction.js: lógica relacionada às transações financeiras.
dashboard.js: lógica relacionada ao dashboard financeiro.
pages/

Pasta responsável pelas páginas internas da aplicação.

accounts.html: página de contas.
bills.html: página de contas/boletos.
goals.html: página de metas.
overview.html: página de visão geral.
transactions.html: página de transações.
Arquitetura adotada

O projeto está em processo de organização para seguir uma arquitetura simples chamada:

Feature-Based Layered Architecture

Ou seja:

Arquitetura em Camadas por Funcionalidade

A ideia é separar o projeto por funcionalidades e, dentro de cada funcionalidade, separar as responsabilidades em camadas.

Fluxo proposto:

Controller → Service → Repository → Storage

Controller

Responsável por lidar com a tela, eventos, formulários, cliques e manipulação do DOM.

Service

Responsável pelas regras de negócio da aplicação.

Repository

Responsável por buscar, salvar, atualizar e remover dados.

Storage

Responsável pela comunicação direta com o LocalStorage.