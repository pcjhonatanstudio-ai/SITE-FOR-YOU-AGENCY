# For You Agency — Website Oficial & Plataforma de Formulários

Website institucional de alta performance da **For You Agency**, com portal integrado de geração e gestão de formulários estratégicos para novos clientes e diagnósticos.

🌐 **Site em Produção:** [https://grupoforyou.com.br](https://grupoforyou.com.br)

---

## ⚠️ "Page Not Found" no GitHub Pages? Entenda o motivo:

Se você tentou acessar o projeto via **GitHub Pages** (ex: `https://pcjhonatanstudio-ai.github.io/SITE-FOR-YOU-AGENCY`) e recebeu **404 / Page Not Found**, isso acontece por uma destas razões:

1. **A aplicação é Full-Stack (Node.js + Express):**
   - O projeto possui um servidor backend (`server.ts`) responsável pelas rotas de API (`/api/forms`, `/api/responses`, `/api/auth/login`, integração com o banco de dados Firebase Firestore).
   - O **GitHub Pages só suporta arquivos estáticos** (HTML/CSS simples) e **não executa servidores Node.js**.
   - Por isso, o site oficial é hospedado no **Render**, apontando para o domínio oficial: **[https://grupoforyou.com.br](https://grupoforyou.com.br)**.

2. **Repositório Privado no GitHub:**
   - Se ao abrir o link do repositório (`https://github.com/pcjhonatanstudio-ai/SITE-FOR-YOU-AGENCY`) aparecer "Page Not Found", certifique-se de estar conectado na conta GitHub proprietária (`pcjhonatanstudio-ai`). O GitHub exibe 404 quando um repositório é privado e o usuário não está autenticado.

3. **Link do AI Studio:**
   - Se o erro foi ao clicar no link do AI Studio (`https://ai.studio/apps/...`), certifique-se de estar logado com a conta Google dona do applet (`rfgroupagencia@gmail.com`).

---

## 🚀 Como Rodar Localmente

**Pré-requisitos:** Node.js 18+ instalado.

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Crie ou edite o arquivo `.env` ou `.env.local` na raiz:
   ```env
   PORT=3000
   GEMINI_API_KEY=sua_chave_gemini_aqui
   ADMIN_PASSWORD=senha_do_painel_de_formularios
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse: `http://localhost:3000`

---

## 📦 Como Funciona o Deploy no Render

O deploy é automático a cada `git push` na branch `main`:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start` (executa `NODE_ENV=production node server.ts`)
- **Porta:** Detectada automaticamente via variável `PORT`
- **Domínio Principal:** `https://grupoforyou.com.br`

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Backend:** Node.js, Express, tsx
- **Banco de Dados:** Firebase Firestore
- **Geração Inteligente:** Google Gen AI SDK
