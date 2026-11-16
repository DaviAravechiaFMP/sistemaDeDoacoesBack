# 📜 Contrato Oficial da API — Sistema de Gestão de Doações FMP

Documentação formal dos endpoints, esquemas de entrada/saída, regras de autenticação e códigos de status HTTP da API REST (v2.0).

---

## 🌐 Informações Gerais

- **Base URL Local:** `http://localhost:3000`
- **Base URL Produção:** `https://sistemadedoacoesback.onrender.com` (ou URL configurada no Render)
- **Formato das Requisições/Respostas:** `application/json; charset=utf-8`

---

## 🔐 Autenticação & Cabeçalhos

A API utiliza **JSON Web Token (JWT)** no padrão RFC 6750:

```http
Authorization: Bearer <seu_token_jwt_aqui>
Content-Type: application/json
```

### Estrutura do Payload do JWT

O token é assinado com `HMAC-SHA256` utilizando a variável `process.env.JWT_SECRET` e contém:

```json
{
  "id": 2,
  "email": "davi@aluno.fmpsc.edu.br",
  "nome": "Davi",
  "iat": 1794950000,
  "exp": 1794978800
}
```

---

## 📑 Resumo dos Endpoints

| Método | Endpoint | Protegido? | Descrição |
|---|---|---|---|
| `GET` | `/` | Não | Health check e versão da API |
| `POST` | `/api/auth/registrar` | Não | Cadastro de novo usuário + perfil de aluno |
| `POST` | `/api/auth/login` | Não | Autenticação, bloqueio progressivo e emissão de JWT |
| `GET` | `/api/doacoes` | **Sim (JWT)** | Lista doações com dados do aluno e campanha |
| `GET` | `/api/doacoes/:id` | **Sim (JWT)** | Consulta uma doação por ID |
| `POST` | `/api/doacoes` | **Sim (JWT)** | Registra nova doação |
| `PUT` | `/api/doacoes/:id` | **Sim (JWT)** | Atualização parcial/total de dados da doação |
| `DELETE`| `/api/doacoes/:id` | **Sim (JWT)** | Remove uma doação por ID |
| `GET` | `/api/campanhas` | **Sim (JWT)** | Lista todas as campanhas institucionais |

---

## 1. Health Check

### `GET /`
Verifica a integridade da API e a conexão com o banco.

**Headers:** Nenhum  
**Body:** Nenhum

**Resposta de Sucesso — `200 OK`**
```json
{
  "mensagem": "API do Sistema de Doações FMP conectada ao PostgreSQL.",
  "versao": "2.0.0"
}
```

---

## 2. Autenticação

### `POST /api/auth/registrar`
Cadastra um novo usuário e perfil de aluno via **transação atômica** (`BEGIN`/`COMMIT`).

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "nome": "Mariana Souza",
  "cpf": "123.456.789-00",
  "email": "mariana@aluno.fmpsc.edu.br",
  "senha": "senhaForte123"
}
```

*Regras de validação (Joi):*
- `nome`: string, 2 a 100 caracteres, obrigatório.
- `cpf`: formato `000.000.000-00` (opcional/permitido nulo ou vazio).
- `email`: e-mail válido, obrigatório.
- `senha`: mínimo de 6 caracteres, obrigatório.

**Resposta de Sucesso — `201 Created`**
```json
{
  "mensagem": "Usuário registrado com sucesso.",
  "usuario": {
    "id": 8,
    "nome": "Mariana Souza",
    "email": "mariana@aluno.fmpsc.edu.br",
    "cpf": "123.456.789-00",
    "matricula": "10008"
  }
}
```

**Respostas de Erro:**

- `400 Bad Request` (validação de campos):
```json
{
  "mensagem": "E-mail deve ser um e-mail válido.",
  "erros": [
    "E-mail deve ser um e-mail válido."
  ]
}
```

- `409 Conflict` (duplicidade de e-mail ou CPF):
```json
{
  "mensagem": "E-mail já cadastrado."
}
```

---

### `POST /api/auth/login`
Autentica o usuário com comparação segura via `bcrypt.compare`, aplica bloqueio progressivo por tentativas incorretas e emite o token JWT.

**Headers:**
```http
Content-Type: application/json
```

**Body:**
```json
{
  "email": "davi@aluno.fmpsc.edu.br",
  "senha": "senhaCorreta123"
}
```

**Resposta de Sucesso — `200 OK`**
```json
{
  "mensagem": "Login realizado com sucesso.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZW1haWwiOiJkYXZpQGFsdW5vLmZtcHNjLmVkdS5iciIsIm5vbWUiOiJEYXZpIiwiaWF0IjoxNzE2NDAwMDAwLCJleHAiOjE3MTY0Mjg4MDB9.signature",
  "usuario": {
    "id": 2,
    "nome": "Davi",
    "email": "davi@aluno.fmpsc.edu.br"
  }
}
```

**Respostas de Erro:**

- `401 Unauthorized` (senha incorreta com contador de tentativas):
```json
{
  "mensagem": "Credenciais inválidas.",
  "tentativas_restantes": 4
}
```

- `403 Forbidden` (bloqueio temporário de 15 minutos atingido):
```json
{
  "mensagem": "Muitas tentativas falhas. Conta bloqueada por 15 minuto(s)."
}
```
*Se a conta já estiver bloqueada:*
```json
{
  "mensagem": "Conta bloqueada temporariamente. Tente novamente em 14 minuto(s)."
}
```

---

## 3. Doações (Rotas Protegidas)

Todas as rotas exigem o cabeçalho:
```http
Authorization: Bearer <token_jwt>
```

### `GET /api/doacoes`
Retorna a listagem de doações com `JOIN` nas tabelas `alunos`, `usuarios` e `campanhas`.

**Resposta de Sucesso — `200 OK`**
```json
[
  {
    "id": 1,
    "aluno_id": 2,
    "doador": "Davi",
    "campanha_id": 1,
    "campanha": "Campanha de Inverno 2026",
    "data": "2026-06-01",
    "status": "Aprovada",
    "horas_concedidas": "10.00",
    "local_entrega": "Recepção Principal FMP"
  },
  {
    "id": 2,
    "aluno_id": 3,
    "doador": "Eduardo",
    "campanha_id": 2,
    "campanha": "SOS Enchentes RS",
    "data": "2026-06-20",
    "status": "Aprovada",
    "horas_concedidas": "20.00",
    "local_entrega": "Hemocentro SC"
  }
]
```

**Respostas de Erro de Autenticação:**
- `401 Unauthorized` (sem token):
```json
{
  "mensagem": "Acesso negado. Token de autenticação não informado."
}
```
- `401 Unauthorized` (token inválido):
```json
{
  "mensagem": "Token inválido."
}
```
- `401 Unauthorized` (token expirado):
```json
{
  "mensagem": "Token expirado. Faça login novamente."
}
```

---

### `GET /api/doacoes/:id`
Busca os detalhes de uma doação específica.

**Parâmetros de Rota:**
- `id` (obrigatório, inteiro positivo)

**Resposta de Sucesso — `200 OK`**
```json
{
  "id": 1,
  "aluno_id": 2,
  "doador": "Davi",
  "campanha_id": 1,
  "campanha": "Campanha de Inverno 2026",
  "data": "2026-06-01",
  "status": "Aprovada",
  "horas_concedidas": "10.00",
  "local_entrega": "Recepção Principal FMP"
}
```

**Respostas de Erro:**
- `400 Bad Request` (ID inválido):
```json
{
  "mensagem": "O ID deve ser um número inteiro positivo."
}
```
- `404 Not Found` (não encontrada):
```json
{
  "mensagem": "Doação não encontrada."
}
```

---

### `POST /api/doacoes`
Registra uma nova doação associada a um aluno e opcionalmente a uma campanha.

**Body:**
```json
{
  "aluno_id": 2,
  "campanha_id": 1,
  "data": "2026-11-20",
  "status": "Pendente",
  "local_entrega": "Recepção Principal FMP"
}
```

*Regras de Validação (Joi):*
- `aluno_id`: inteiro positivo, obrigatório.
- `campanha_id`: inteiro positivo, opcional (permite nulo).
- `data`: string formato `YYYY-MM-DD` com validação de data real de calendário.
- `status`: string de 1 a 30 caracteres (padrão `"Pendente"`).
- `local_entrega`: string até 150 caracteres.

**Resposta de Sucesso — `201 Created`**
```json
{
  "mensagem": "Doação cadastrada com sucesso.",
  "doacao": {
    "id": 4,
    "aluno_id": 2,
    "campanha_id": 1,
    "func_registro_id": null,
    "func_validacao_id": null,
    "data": "2026-11-20T03:00:00.000Z",
    "status": "Pendente",
    "foto_evidencia": null,
    "motivo_reprovacao": null,
    "horas_concedidas": null,
    "horario_doacao": null,
    "retencao_anos": null,
    "local_entrega": "Recepção Principal FMP"
  }
}
```

**Respostas de Erro:**
- `400 Bad Request` (aluno ou campanha inexistente - FK 23503):
```json
{
  "mensagem": "Aluno ou campanha informado não existe no banco."
}
```

---

### `PUT /api/doacoes/:id`
Atualiza dados de uma doação existente (`status`, `local_entrega` e/ou `horas_concedidas`).

**Parâmetros de Rota:** `id` (inteiro positivo)

**Body:**
```json
{
  "status": "Aprovada",
  "horas_concedidas": 10,
  "local_entrega": "Coordenação COPER"
}
```
*Deve conter ao menos 1 campo para atualizar.*

**Resposta de Sucesso — `200 OK`**
```json
{
  "mensagem": "Doação atualizada com sucesso.",
  "doacao": {
    "id": 1,
    "aluno_id": 2,
    "campanha_id": 1,
    "func_registro_id": 1,
    "func_validacao_id": 1,
    "data": "2026-06-01T03:00:00.000Z",
    "status": "Aprovada",
    "foto_evidencia": null,
    "motivo_reprovacao": null,
    "horas_concedidas": "10.00",
    "horario_doacao": "08:30:00",
    "retencao_anos": 10,
    "local_entrega": "Coordenação COPER"
  }
}
```

**Respostas de Erro:**
- `400 Bad Request` (nenhum campo informado):
```json
{
  "mensagem": "Informe ao menos um campo para atualizar.",
  "erros": [
    "Informe ao menos um campo para atualizar."
  ]
}
```
- `404 Not Found`:
```json
{
  "mensagem": "Doação não encontrada."
}
```

---

### `DELETE /api/doacoes/:id`
Exclui uma doação do sistema.

**Parâmetros de Rota:** `id` (inteiro positivo)

**Resposta de Sucesso — `200 OK`**
```json
{
  "mensagem": "Doação excluída com sucesso.",
  "doacao": {
    "id": 1,
    "aluno_id": 2,
    "campanha_id": 1,
    "data": "2026-06-01T03:00:00.000Z",
    "status": "Aprovada"
  }
}
```

**Respostas de Erro:**
- `400 Bad Request` (quando há registros dependentes na integridade referencial):
```json
{
  "mensagem": "Não foi possível excluir: existem registros relacionados a esta doação."
}
```
- `404 Not Found`:
```json
{
  "mensagem": "Doação não encontrada."
}
```

---

## 4. Campanhas

### `GET /api/campanhas`
Lista todas as campanhas institucionais registradas.

**Headers:**
```http
Authorization: Bearer <token_jwt>
```

**Resposta de Sucesso — `200 OK`**
```json
[
  {
    "id": 1,
    "titulo": "Campanha de Inverno 2026",
    "descricao": "Arrecadação de agasalhos e cobertores.",
    "data_limite": "2026-08-30",
    "status": "Ativa",
    "regras_conversao": "1 agasalho/cobertor = 5 horas",
    "limite_horas": "40.00"
  },
  {
    "id": 2,
    "titulo": "SOS Enchentes RS",
    "descricao": "Alimentos não perecíveis e água potável.",
    "data_limite": "2026-07-15",
    "status": "Ativa",
    "regras_conversao": "1 kg/item = 2 horas",
    "limite_horas": "30.00"
  },
  {
    "id": 3,
    "titulo": "Material Escolar Solidário",
    "descricao": "Kits para o início do ano letivo.",
    "data_limite": "2026-03-10",
    "status": "Encerrada",
    "regras_conversao": "1 kit completo = 10 horas",
    "limite_horas": "20.00"
  }
]
```

---

## 5. Rota Inexistente (404 Fallback)

Para qualquer rota não mapeada na API:

**Resposta — `404 Not Found`**
```json
{
  "mensagem": "Rota não encontrada."
}
```
