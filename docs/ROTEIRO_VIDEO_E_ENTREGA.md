# 🎬 Roteiro de Gravação do Vídeo e Checklist de Entrega (Aula 13)

**Duração Total:** 4 minutos (cronometrado — exatamente 1 minuto por integrante).  
**Integrantes:** Davi Aravechia, Lucas Schutz, Eduardo Silva e Vitor.

---

## ⏱️ Distribuição do Tempo e Falas

```
[00:00 - 01:00] Davi Aravechia   → Introdução, Contexto Institucional e Arquitetura MVC
[01:00 - 02:00] Lucas Schutz     → Camada de Segurança (bcrypt, JWT, Joi e Bloqueio Progressivo)
[02:00 - 03:00] Eduardo Silva    → Integração com PostgreSQL, Modelagem (12 Tabelas) e Transações
[03:00 - 04:00] Vitor            → Demonstração Prática (Postman + Token Automático + Deploy no Render)
```

---

### Minuto 1 [00:00 - 01:00] — Davi Aravechia
**Foco:** Contexto, problema de negócio e arquitetura limpa em `src/`.

> **Fala sugerida:**  
> *"Olá a todos! Eu sou o Davi e hoje nosso grupo vai apresentar o back-end completo do **Sistema de Gestão de Doações da Faculdade Municipal de Palhoça (FMP)**.*  
>  
> *O objetivo central deste projeto integrador é automatizar e dar total rastreabilidade à arrecadação de donativos — como agasalhos, alimentos e materiais escolares —, conectando as campanhas da COPER com os alunos para a concessão segura de horas complementares.*  
>  
> *Nesta etapa da Aula 13, consolidamos a aplicação no padrão de arquitetura **MVC**. Estruturamos todo o código dentro do diretório `src/`, separando com responsabilidade única os nossos **Controllers**, **Models**, **Middlewares**, **Schemas de validação** e **Rotas**, além de isolar as configurações do banco no `config/db.js` e a inicialização no `server.js`. Agora, o Lucas vai detalhar como implementamos a segurança robusta da API."*

---

### Minuto 2 [01:00 - 02:00] — Lucas Schutz
**Foco:** Camada de segurança (Joi, bcrypt, JWT e bloqueio progressivo contra força bruta).

> **Fala sugerida:**  
> *"Opa, pessoal, aqui é o Lucas! Na camada de segurança, nós implementamos uma barreira completa em múltiplos níveis:*  
>  
> *Primeiro, na entrada dos dados, usamos o **Joi** com schemas centralizados para sanitizar e validar tipos, regras de strings, formato de e-mail e conferência de datas reais de calendário, com mensagens de erro amigáveis em português.*  
>  
> *Para o armazenamento de credenciais, as senhas nunca são salvas em texto puro: utilizamos o **bcrypt** com 10 rounds de salt.  
> No login, emitimos tokens **JWT** assinados e com tempo de expiração configurável via variáveis de ambiente. Todas as rotas de doações e campanhas são protegidas pelo middleware `autenticar.js`, que valida o header `Authorization: Bearer`.*  
>  
> *E um diferencial crucial: implementamos um mecanismo de **bloqueio progressivo de conta**. Caso um usuário erre a senha 5 vezes consecutivas, a API trava o acesso por 15 minutos com status HTTP 403, mitigando ataques de força bruta. Agora o Eduardo vai mostrar como tudo isso se conecta ao banco de dados."*

---

### Minuto 3 [02:00 - 03:00] — Eduardo Silva
**Foco:** Banco de dados relacional PostgreSQL, 12 tabelas e transações atômicas.

> **Fala sugerida:**  
> *"Olá, eu sou o Eduardo! O nosso back-end conecta-se a um banco relacional **PostgreSQL** através do driver `pg` utilizando pool de conexões otimizado.*  
>  
> *A modelagem conta com **12 tabelas** completas que suportam todo o ciclo de vida institucional: desde usuários, alunos e funcionários, até campanhas, itens prioritários, anexos de comprovantes, certificados com hash e logs de auditoria de alterações.*  
>  
> *Na camada de dados, construímos a pasta `models/` sem qualquer acoplamento com objetos HTTP de requisição ou resposta. Destaco a nossa transação atômica no `usuarioModel.js`: ao registrar um novo aluno, abrimos uma transação com `BEGIN`, inserimos na tabela `usuarios`, calculamos a matrícula dinamicamente, inserimos na tabela `alunos` e aplicamos `COMMIT`. Se qualquer etapa falhar, o `ROLLBACK` é acionado imediatamente, garantindo integridade referencial absoluta. Agora, o Vitor vai demonstrar a API em ação e nosso deploy."*

---

### Minuto 4 [03:00 - 04:00] — Vitor
**Foco:** Teste ao vivo no Postman (script de token automático), endpoints e deploy em nuvem no Render.

> **Fala sugerida:**  
> *(Compartilhando tela do Postman e navegador)*  
> *"E aí, pessoal, aqui é o Vitor! Vou demonstrar agora os endpoints funcionando na prática.*  
>  
> *Criamos uma coleção Postman completa com todas as requisições salvas. Ao executar o `POST /api/auth/login`, temos um script automático na aba Tests que extrai o JWT retornado e salva diretamente na variável de ambiente `{{token}}` da coleção.*  
>  
> *Com isso, ao fazer o `GET /api/doacoes`, o token é injetado automaticamente no cabeçalho Bearer e recebemos a listagem com `JOIN` completo trazendo dados do doador e da campanha. Também demonstramos o `GET /api/campanhas` e o CRUD completo de doações.*  
>  
> *Para finalizar, realizamos o **deploy contínuo no Render**: provisionamos uma instância gerenciada de PostgreSQL em nuvem e publicamos o Web Service em Node.js com suporte a SSL automático através da `DATABASE_URL`. A API está 100% online, segura e pronta para ser consumida pela equipe de front-end. Muito obrigado a todos!"*

---

## 📋 Checklist de Entrega da Aula 13

- [x] **Arquitetura MVC** consolidada em `src/` (Controllers, Models, Routes, Middlewares, Schemas, Config).
- [x] **Validação com Joi** com mensagens personalizadas em português.
- [x] **Criptografia com bcrypt** (hash de senhas com 10 salt rounds).
- [x] **Autenticação JWT** em rotas protegidas (Bearer token).
- [x] **Proteção contra força bruta** (bloqueio temporário de 15 minutos após 5 erros).
- [x] **Transações Atômicas PostgreSQL** (`BEGIN` / `COMMIT` / `ROLLBACK`).
- [x] **Coleção Postman v2.1** em `docs/postman/` com script de token automático e exemplos de respostas.
- [x] **Contrato de API** formalizado em `docs/API_CONTRACT.md`.
- [x] **Guia Front-end (React + Vite)** em `docs/FRONTEND_INTEGRATION_GUIDE.md`.
- [x] **Manual de Deploy e PostgreSQL (Render)** em `docs/DATABASE_AND_DEPLOY.md`.
- [x] **README.md atualizado** na raiz com links para a documentação e diagrama.
