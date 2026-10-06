const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// Banco de dados em memória
let doacoes = [
  { id: 1, doador: "Maria Silva", item: "Cesta básica", quantidade: 2, status: "recebida" },
  { id: 2, doador: "João Souza", item: "Cobertor", quantidade: 5, status: "pendente" }
];

// Rota Raiz
app.get("/", (req, res) => {
  res.json({ mensagem: "API do Sistema de Doações funcionando" });
});

// GET /api/doacoes - Listar todas
app.get("/api/doacoes", (req, res) => {
  res.status(200).json(doacoes);
});

// GET /api/doacoes/:id - Buscar por ID
app.get("/api/doacoes/:id", (req, res) => {
  const id = Number(req.params.id);
  const doacao = doacoes.find((d) => d.id === id);

  if (!doacao) {
    return res.status(404).json({ erro: "Doação não encontrada" });
  }

  res.status(200).json(doacao);
});

// POST /api/doacoes - Cadastrar doação
app.post("/api/doacoes", (req, res) => {
  const { doador, item, quantidade } = req.body;

  if (!doador || !item || quantidade === undefined || Number(quantidade) <= 0) {
    return res
      .status(400)
      .json({ erro: "Informe um doador, item e uma quantidade válida (maior que 0)." });
  }

  const novoId = doacoes.length > 0 ? Math.max(...doacoes.map((d) => d.id)) + 1 : 1;

  const novaDoacao = {
    id: novoId,
    doador,
    item,
    quantidade: Number(quantidade),
    status: "pendente"
  };

  doacoes.push(novaDoacao);
  res.status(201).json(novaDoacao);
});

// Tratamento de rotas inexistentes
app.use((req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});