// ===== DEPENDÊNCIAS =====
const express = require("express");
const pool = require("./db"); // Conexão com o PostgreSQL via db.js
require("dotenv").config(); // Lê o arquivo .env

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE GLOBAL: lê JSON do body (sem isso, req.body = undefined)
app.use(express.json());

// MIDDLEWARE 1: Log de requisições
function registrarLog(req, res, next) {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
}
app.use(registrarLog);

// ===== ROTAS =====

// Rota de verificação
app.get("/", (req, res) => {
  return res.status(200).json({ mensagem: "API do Sistema de Doações funcionando com PostgreSQL!" });
});

// GET /api/doacoes -> Lista todas as doações do banco
app.get("/api/doacoes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.id, 
        u.nome AS doador, 
        c.titulo AS campanha, 
        d.status, 
        d.data,
        d.horas_concedidas,
        d.local_entrega
      FROM doacoes d
      JOIN alunos a ON d.aluno_id = a.id
      JOIN usuarios u ON a.id = u.id
      LEFT JOIN campanhas c ON d.campanha_id = c.id
      ORDER BY d.id ASC;
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar doações do banco de dados", detalhe: err.message });
  }
});

// GET /api/doacoes/:id -> Busca doação por ID
app.get("/api/doacoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ mensagem: "O ID deve ser um número válido" });
  }

  try {
    const result = await pool.query(
      `SELECT 
        d.id, 
        u.nome AS doador, 
        c.titulo AS campanha, 
        d.status, 
        d.data,
        d.horas_concedidas,
        d.local_entrega
      FROM doacoes d
      JOIN alunos a ON d.aluno_id = a.id
      JOIN usuarios u ON a.id = u.id
      LEFT JOIN campanhas c ON d.campanha_id = c.id
      WHERE d.id = $1;`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: "Doação não encontrada" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao buscar doação por ID", detalhe: err.message });
  }
});

// POST /api/doacoes -> Insere nova doação no PostgreSQL
app.post("/api/doacoes", async (req, res) => {
  const { aluno_id, campanha_id, data, status, local_entrega } = req.body;

  if (!aluno_id || !data) {
    return res.status(400).json({ mensagem: "Os campos aluno_id e data são obrigatórios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO doacoes (aluno_id, campanha_id, data, status, local_entrega)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [aluno_id, campanha_id || null, data, status || "Pendente", local_entrega || "Recepção Principal FMP"]
    );

    return res.status(201).json(result.rows[0]); // 201 = Criado com sucesso
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao cadastrar doação no banco", detalhe: err.message });
  }
});

// PUT /api/doacoes/:id -> Atualiza doação existente
app.put("/api/doacoes/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { status, local_entrega, horas_concedidas } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ mensagem: "O ID deve ser um número válido" });
  }

  try {
    const result = await pool.query(
      `UPDATE doacoes 
       SET status = COALESCE($1, status),
           local_entrega = COALESCE($2, local_entrega),
           horas_concedidas = COALESCE($3, horas_concedidas)
       WHERE id = $4
       RETURNING *;`,
      [status, local_entrega, horas_concedidas, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: "Doação não encontrada" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao atualizar doação", detalhe: err.message });
  }
});

// DELETE /api/doacoes/:id -> Remove doação do banco
app.delete("/api/doacoes/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ mensagem: "O ID deve ser um número válido" });
  }

  try {
    const result = await pool.query("DELETE FROM doacoes WHERE id = $1 RETURNING *;", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensagem: "Doação não encontrada" });
    }

    return res.status(200).json({ mensagem: "Doação removida com sucesso do banco de dados" });
  } catch (err) {
    return res.status(500).json({ erro: "Erro ao deletar doação", detalhe: err.message });
  }
});

// MIDDLEWARE FINAL: Rota inexistente -> 404
app.use((req, res) => {
  return res.status(404).json({ mensagem: "Rota não encontrada" });
});

// SUBIR O SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});