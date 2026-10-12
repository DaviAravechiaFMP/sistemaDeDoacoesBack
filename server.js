// ===== DEPENDÊNCIAS =====
const express = require("express");
require("dotenv").config(); // lê o arquivo .env

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE GLOBAL: lê JSON do body (sem isso, req.body = undefined)
app.use(express.json());

// "BANCO DE DADOS" EM MEMÓRIA (array) - o banco real vem nas próximas aulas
let doacoes = [
  { id: 1, doador: "Maria Silva", item: "Cesta básica", quantidade: 2, status: "recebida" },
  { id: 2, doador: "João Souza", item: "Cobertor", quantidade: 5, status: "pendente" },
];

// MIDDLEWARE 1: o "porteiro" que registra tudo (logs)
function registrarLog(req, res, next) {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next(); // SEMPRE chamar next(), senão a requisição trava
}
app.use(registrarLog);

// MIDDLEWARE 2: validação de dados (usado só no POST e PUT)
function validarDoacao(req, res, next) {
  const { doador, item, quantidade } = req.body;
  if (!doador) {
    return res.status(400).json({ mensagem: "O doador é obrigatório" });
  }
  if (!item) {
    return res.status(400).json({ mensagem: "O item é obrigatório" });
  }
  if (quantidade === undefined || quantidade === null || typeof quantidade !== "number" || quantidade <= 0) {
  return res.status(400).json({ mensagem: "A quantidade deve ser um número maior que 0" });
  }
  next(); // dados ok, pode continuar
}

// ===== ROTAS =====

app.get("/", (req, res) => {
  return res.status(200).json({ mensagem: "API do Sistema de Doações funcionando" });
});

// GET /api/doacoes -> lista todas (200)
app.get("/api/doacoes", (req, res) => {
  return res.status(200).json(doacoes);
});

// GET /api/doacoes/:id -> busca por ID (parâmetro de rota)
app.get("/api/doacoes/:id", (req, res) => {
  const id = Number(req.params.id); // :id vem como STRING -> converter!
  const doacao = doacoes.find((d) => d.id === id);

  if (!doacao) {
    return res.status(404).json({ mensagem: "Doação não encontrada" });
  }
  return res.status(200).json(doacao);
});

// POST /api/doacoes -> cria nova (com middleware de validação)
app.post("/api/doacoes", validarDoacao, (req, res) => {
  const { doador, item, quantidade } = req.body;

  // maior id existente + 1 (assim não repete id depois de um DELETE)
  const proximoId = doacoes.length > 0 ? Math.max(...doacoes.map((d) => d.id)) + 1 : 1;

  const novaDoacao = { id: proximoId, doador, item, quantidade, status: "pendente" };
  doacoes.push(novaDoacao);
  return res.status(201).json(novaDoacao); // 201 = criado com sucesso
});

// PUT /api/doacoes/:id -> atualiza existente
app.put("/api/doacoes/:id", validarDoacao, (req, res) => {
  const id = Number(req.params.id);
  const doacao = doacoes.find((d) => d.id === id);

  if (!doacao) {
    return res.status(404).json({ mensagem: "Doação não encontrada" });
  }

  const { doador, item, quantidade } = req.body;
  doacao.doador = doador;
  doacao.item = item;
  doacao.quantidade = quantidade;
  return res.status(200).json(doacao);
});

// DELETE /api/doacoes/:id -> remove
app.delete("/api/doacoes/:id", (req, res) => {
  const id = Number(req.params.id);
  const doacao = doacoes.find((d) => d.id === id);

  if (!doacao) {
    return res.status(404).json({ mensagem: "Doação não encontrada" });
  }

  doacoes = doacoes.filter((d) => d.id !== id);
  return res.status(200).json({ mensagem: "Doação removida com sucesso" });
});

// MIDDLEWARE FINAL: rota que não existe -> 404
app.use((req, res) => {
  return res.status(404).json({ mensagem: "Rota não encontrada" });
});

// SUBIR O SERVIDOR
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});