# Escala Escolar

Sistema web desenvolvido para auxiliar a equipe gestora da **Escola Estadual Eusébio de Paula Marcondes** na organização e no acompanhamento das escalas de funcionários, especialmente inspetores de alunos.

O objetivo é centralizar as informações sobre horários, locais de atuação e ocorrências, facilitando a gestão da rotina escolar.

## Funcionalidades

* **Dashboard:** visão geral das escalas e da distribuição dos funcionários.
* **Funcionários:** cadastro, consulta e gerenciamento dos funcionários.
* **Escalas:** organização dos horários e locais de atuação.
* **Ocorrências:** registro e acompanhamento de ocorrências escolares.
* **Relatórios:** consulta de informações para acompanhamento da rotina.
* **Locais:** gerenciamento dos espaços e áreas de atuação.
* **Interface intuitiva:** navegação simples, com identidade visual inspirada na escola.

## Tecnologias utilizadas

### Frontend

* React
* Vite
* JavaScript
* React Router
* React Hot Toast
* CSS

### Backend e banco de dados

* Google Apps Script
* Supabase
* Google Sheets

### Hospedagem

* Vercel (planejada)

## Estrutura do projeto

```text
EPM/
├── public/
│   └── logo.png
├── src/
│   ├── components/
│   │   └── Header/
│   ├── pages/
│   │   ├── Dashboard/
│   │   ├── Funcionarios/
│   │   ├── Escalas/
│   │   ├── Ocorrencias/
│   │   ├── Relatorios/
│   │   └── Locais/
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── .env
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

*Estrutura ilustrativa, que pode variar conforme a organização atual do projeto.*

## Como executar localmente

### Pré-requisitos

* Node.js
* npm
* Git

### 1. Clone o repositório

```bash
git clone https://github.com/Nayana-Oliveira/Escala-Escolar-Direcao.git
```

### 2. Acesse a pasta

```bash
cd Escala-Escolar-Direcao
```

### 3. Instale as dependências

```bash
npm install
```

### 4. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_APPS_SCRIPT_URL=sua_url_do_google_apps_script
```

Substitua o valor pela URL do seu Google Apps Script publicado.

### 5. Inicie o servidor

```bash
npm run dev
```

O Vite exibirá o endereço local para acessar a aplicação, geralmente:

```text
http://localhost:5173
```

## Arquitetura

O sistema utiliza a seguinte estrutura de comunicação:

```text
React + Vite
     |
     v
Google Apps Script
     |
     v
Supabase
```

* **React:** responsável pela interface e interação com o usuário.
* **Google Apps Script:** processa as requisições e conecta a aplicação ao banco de dados.
* **Supabase:** armazena os dados utilizados pelo sistema.
* **Google Sheets:** utilizado para informações auxiliares, conforme a configuração do projeto.

## Identidade visual

O projeto utiliza uma identidade visual baseada nas cores institucionais da Escola Estadual Eusébio de Paula Marcondes:

* Vermelho
* Preto
* Branco

A interface foi pensada para oferecer uma experiência clara e funcional para a equipe escolar.