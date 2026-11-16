# 🚀 Guia de Implantação e Banco de Dados (Render + PostgreSQL)

Instruções para provisionamento do banco de dados relacional e deploy contínuo do back-end Node.js na nuvem através do **Render**.

---

## 🗄️ 1. Criação do Banco de Dados PostgreSQL no Render

1. Acesse o painel do [Render](https://dashboard.render.com/) e faça login (recomenda-se login com sua conta do GitHub).
2. Clique em **New +** no canto superior direito e selecione **PostgreSQL**.
3. Preencha as configurações do banco:
   - **Name:** `sistema-doacoes-db`
   - **Database:** `sistema_doacoes`
   - **User:** `postgres_user` (ou o gerado pelo Render)
   - **Region:** `Ohio (US East)` ou `Oregon (US West)` (mantenha a mesma região no Web Service)
   - **PostgreSQL Version:** 16 (ou superior)
   - **Plan Type:** `Free`
4. Clique em **Create Database**.
5. Aguarde até o status ficar como **Available**.
6. Copie as URLs de conexão fornecidas na página do banco:
   - **Internal Database URL:** usada para comunicação entre serviços no Render (mais rápida e sem consumo de tráfego externo). Exemplo: `postgresql://postgres_user:SENHA@dpg-xxxx-a:5432/sistema_doacoes`.
   - **External Database URL:** usada para conectar ferramentas locais (pgAdmin, DBeaver, psql).

---

## 💾 2. Execução do Script SQL no Banco Remoto

Para criar as 12 tabelas e carregar a massa de dados inicial:

### Opção A: Via pgAdmin 4
1. No pgAdmin, clique com botão direito em **Servers** > **Register** > **Server...**.
2. Na aba **General**, defina um nome (ex: `Render PostgreSQL`).
3. Na aba **Connection**, insira os dados da **External Database URL**:
   - **Host name/address:** copie o host da URL externa (ex: `dpg-xxxx-a.oregon-postgres.render.com`).
   - **Port:** `5432`
   - **Maintenance database:** `sistema_doacoes`
   - **Username:** copie o usuário da URL externa.
   - **Password:** copie a senha da URL externa.
   - Na aba **SSL**, selecione `Require`.
4. Conecte-se ao banco, abra a **Query Tool** e cole o conteúdo integral do arquivo:
   [`Criacao_banco_postgres_projeto_integrador.sql`](../Criacao_banco_postgres_projeto_integrador.sql).
5. Pressione **F5** para executar. Verifique se as 12 tabelas foram criadas com sucesso.

### Opção B: Via CLI `psql`
```bash
psql "SUA_EXTERNAL_DATABASE_URL?sslmode=require" -f Criacao_banco_postgres_projeto_integrador.sql
```

---

## 🌐 3. Criação do Web Service (API Node.js) no Render

1. No dashboard do Render, clique em **New +** > **Web Service**.
2. Conecte o repositório GitHub do projeto (`sistemaDeDoacoesBack`).
3. Preencha os parâmetros do serviço:
   - **Name:** `sistemadedoacoesback`
   - **Region:** Mesma região escolhida para o PostgreSQL.
   - **Branch:** `main`
   - **Root Directory:** deixe vazio (raiz do repositório).
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

---

## 🔑 4. Configuração das Variáveis de Ambiente no Render

Na seção **Environment Variables** do Web Service, adicione as seguintes variáveis:

| Key | Value | Descrição |
|---|---|---|
| `DATABASE_URL` | *(Cole a **Internal Database URL** do PostgreSQL criado)* | URL de conexão PostgreSQL. O pool em `src/config/db.js` detecta automaticamente e ativa `ssl: { rejectUnauthorized: false }`. |
| `JWT_SECRET` | *(Gere uma string segura de pelo menos 32 caracteres)* | Chave privada para assinatura dos tokens JWT. Exemplo: `fmp_jwt_secreto_super_seguro_producao_2026` |
| `JWT_EXPIRES_IN` | `8h` | Tempo de validade do token (ex: `8h`, `1d`). |
| `PORT` | `10000` | Porta padrão do Render (o Express mapeia automaticamente via `process.env.PORT`). |

Clique em **Save Changes**. O Render irá disparar o deploy automaticamente.

---

## 🔍 5. Como o Código Suporta o Render com SSL

Nosso arquivo [`src/config/db.js`](../src/config/db.js) possui a lógica de conexão condicional:

```javascript
const poolConfig = process.env.DATABASE_URL
    ? {
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false } // Essencial para certificados gerenciados do Render/Heroku
      }
    : {
          host: process.env.DB_HOST || "localhost",
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME
      };
```

---

## ✅ 6. Validação do Deploy

Assim que o deploy for finalizado e o status estiver como **Live**:

1. Acesse o endpoint de health check no navegador ou via curl:
   ```bash
   curl https://sistemadedoacoesback.onrender.com/
   ```
   **Resposta esperada:**
   ```json
   {
     "mensagem": "API do Sistema de Doações FMP conectada ao PostgreSQL.",
     "versao": "2.0.0"
   }
   ```
2. Abra a coleção Postman [`docs/postman/Sistema_Doacoes_FMP.postman_collection.json`](postman/Sistema_Doacoes_FMP.postman_collection.json), altere a variável `base_url` para a URL da nuvem (`https://sistemadedoacoesback.onrender.com`) e execute a requisição de **Login** para obter o JWT e testar as rotas protegidas em produção.
