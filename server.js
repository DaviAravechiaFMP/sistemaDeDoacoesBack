const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// "Banco de dados" temporário em memória (será trocado por um banco real nas próximas aulas)
let doacoes = [
  { id: 1, doador: "Maria Silva", item: "Cesta básica", quantidade: 2, status: "recebida" },
  { id: 2, doador: "João Souza", item: "Cobertor", quantidade: 5, status: "pendente" },
];

app.get("/", (req, res) => {
  res.json({ mensagem: "API do Sistema de Doações funcionando" });
});

// GET /api/doacoes -> lista todas
app.get("/api/doacoes", (req, res) => {
  res.status(200).json(doacoes);
});

// GET /api/doacoes/:id -> busca uma pelo id
app.get("/api/doacoes/:id", (req, res) => {
  const id = Number(req.params.id);
  const doacao = doacoes.find((d) => d.id === id);

  if (!doacao) {
    return res.status(404).json({ erro: "Doação não encontrada" });
  }
  res.status(200).json(doacao);
});

// POST /api/doacoes -> cria uma nova
app.post("/api/doacoes", (req, res) => {
  const { doador, item, quantidade } = req.body;

  if (!doador || !item || !quantidade) {
    return res
      .status(400)
      .json({ erro: "Informe doador, item e quantidade" });
  }

  const nova = {
    id: doacoes.length + 1,
    doador,
    item,
    quantidade,
    status: "pendente",
  };
  doacoes.push(nova);
  res.status(201).json(nova);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});