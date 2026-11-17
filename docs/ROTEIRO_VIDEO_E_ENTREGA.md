# 🎬 Roteiro de Gravação do Vídeo e Checklist de Entrega (Aula 13)

**Duração Total:** 4 minutos (cronometrado — exatamente 1 minuto e 20 segundos por integrante).  
**Integrantes:** Davi Aravechia, Lucas Alexandre Vieira Schutz e Eduardo Silva.

---

## ⏱️ Distribuição do Tempo e Falas

```
[00:00 - 01:20] Davi Aravechia                 → Introdução, Contexto FMP e Arquitetura MVC em src/
[01:20 - 02:40] Lucas Alexandre Vieira Schutz  → Camada de Segurança (bcrypt, JWT, Joi, Perfil/Itens e Bloqueio Progressivo)
[02:40 - 04:00] Eduardo Silva                  → PostgreSQL (12 Tabelas), Transações, Demonstração no Postman e Deploy no Render
```

---

### Parte 1 [00:00 - 01:20] — Davi Aravechia
**Foco:** Contexto institucional, problema de negócio da FMP e consolidação da Arquitetura MVC em `src/`.

> **Fala sugerida:**  
> *"Olá a todos! Eu sou o Davi e hoje nosso grupo vai apresentar o back-end completo do **Sistema de Gestão de Doações da Faculdade Municipal de Palhoça (FMP)**.*  
>  
> *O objetivo central do nosso Projeto Integrador é informatizar, dar transparência e rastreabilidade ao processo de arrecadação de donativos — como agasalhos, cobertores, alimentos e materiais escolares. O sistema conecta diretamente as campanhas institucionais da comissão COPER aos alunos, permitindo o registro das entregas e o cômputo automatizado de horas complementares.*  
>  
> *Para atender aos requisitos técnicos da Aula 13, consolidamos a aplicação no padrão rigoroso **MVC**, centralizando todo o código-fonte na pasta `src/`. Separamos responsabilidades em camadas independentes:*  
> *- **Controllers**: que orquestram requisições e respostas HTTP;*  
> *- **Models**: responsáveis pelas consultas SQL e regras de persistência;*  
> *- **Middlewares**: para autenticação via token e validação com Joi;*  
> *- **Schemas**: definindo as regras de entrada de dados;*  
> *- **Routes**: divididas modularmente em auth, doações, campanhas e itens;*  
> *- E a pasta **config/db.js**: isolando o pool de conexões do PostgreSQL.*  
>  
> *Agora, o Lucas vai explicar a camada de segurança que protege todo esse fluxo."*

---

### Parte 2 [01:20 - 02:40] — Lucas Alexandre Vieira Schutz
**Foco:** Camada de segurança (Joi, bcrypt, JWT, novos endpoints de perfil e itens, e bloqueio progressivo).

> **Fala sugerida:**  
> *"Olá, pessoal, eu sou o Lucas! Na camada de segurança, blindamos a API em múltiplos níveis para garantir que nenhuma operação ocorra sem validação prévia:*  
>  
> *1. **Validação de Entrada com Joi**: na entrada de todas as requisições, schemas centralizados sanitizam os dados, validam formatos de strings, e-mails e datas reais de calendário, respondendo mensagens amigáveis em português antes mesmo de tocar o banco de dados.*  
>  
> *2. **Criptografia com bcrypt**: as senhas dos usuários nunca trafegam em texto puro no banco de dados — geramos hashes unidirecionais seguros com 10 rounds de salt.*  
>  
> *3. **Autenticação via JWT**: no login emitimos tokens assinados digitalmente com tempo de expiração configurável via variáveis de ambiente. Todas as rotas de doações, campanhas, catálogo de itens e o endpoint `GET /api/auth/perfil` exigem o cabeçalho `Authorization: Bearer <token>`, identificando o usuário autenticado.*  
>  
> *4. **Bloqueio Progressivo de Conta**: como proteção ativa contra ataques de força bruta, implementamos um contador no banco de dados. Caso o usuário erre a senha 5 vezes consecutivas, a conta é bloqueada temporariamente por 15 minutos com status HTTP 403.*  
>  
> *Agora o Eduardo vai demonstrar como o banco de dados relacional foi estruturado, como rodamos os testes no Postman e o deploy em nuvem."*

---

### Parte 3 [02:40 - 04:00] — Eduardo Silva
**Foco:** PostgreSQL (12 tabelas), transações atômicas, demonstração no Postman e deploy no Render.

> **Fala sugerida:**  
> *(Compartilhando a tela do Postman e do navegador no Render)*  
> *"Olá a todos, eu sou o Eduardo! O nosso back-end conecta-se a um banco relacional **PostgreSQL** robusto, modelado com **12 tabelas** normalizadas, cobrindo usuários, alunos, funcionários, campanhas, itens doados, anexos de comprovantes e certificados.*  
>  
> *Um ponto alto da persistência são as **transações atômicas** (`BEGIN`, `COMMIT` e `ROLLBACK`): ao cadastrar um novo aluno, garantimos que a inserção na tabela `usuarios` e a geração da matrícula na tabela `alunos` aconteçam de forma indivisível.*  
>  
> *Aqui no **Postman**, temos a coleção oficial v2.1. Observem que ao disparar o `POST /api/auth/login`, nosso script de testes extrai o token JWT retornado e preenche automaticamente a variável `{{token}}`. Com isso, podemos requisitar imediatamente o `GET /api/auth/perfil` para ver o saldo de horas do aluno, consultar o catálogo em `GET /api/itens` e rodar o CRUD completo de doações.*  
>  
> *Por fim, a API está em produção no **Render**: provisionamos uma instância gerenciada de PostgreSQL em nuvem e publicamos o Web Service Node.js com suporte a SSL automático via `DATABASE_URL` e `CORS` habilitado para o front-end. O projeto está 100% funcional e aprovado. Muito obrigado!"*

---

## 📋 Checklist de Entrega da Aula 13

- [x] **Equipe ajustada:** Davi Aravechia, Eduardo Silva e Lucas Alexandre Vieira Schutz.
- [x] **Arquitetura MVC consolidada em `src/`:** Controllers, Models, Routes, Middlewares, Schemas e Config.
- [x] **Endpoints Completos:** Auth (`/registrar`, `/login`, `/perfil`), Doações (CRUD completo), Campanhas (`/campanhas`) e Itens (`/itens`).
- [x] **Validação com Joi:** Schemas centralizados com mensagens de erro em português.
- [x] **Criptografia com bcrypt:** Hash de senhas com 10 salt rounds.
- [x] **Autenticação JWT:** Proteção de rotas com `Authorization: Bearer <token>`.
- [x] **Proteção contra força bruta:** Bloqueio progressivo de 15 minutos após 5 falhas consecutivas.
- [x] **Transações Atômicas PostgreSQL:** Garantia de integridade com `BEGIN`, `COMMIT` e `ROLLBACK`.
- [x] **Coleção Postman v2.1:** Script automático de gravação de token e exemplos de request/response salvos para todos os 11 endpoints.
- [x] **Deploy em Produção no Render:** Web Service com SSL e instância gerenciada de PostgreSQL.
- [x] **Documentação Completa:** `API_CONTRACT.md`, `FRONTEND_INTEGRATION_GUIDE.md`, `DATABASE_AND_DEPLOY.md` e `README.md`.
