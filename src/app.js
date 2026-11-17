const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const doacaoRoutes = require("./routes/doacaoRoutes");
const campanhaRoutes = require("./routes/campanhaRoutes");
const itemRoutes = require('./routes/itemRoutes');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log de requisições
app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleString("pt-BR")}] ${req.method} ${req.url}`);
    next();
});

// Rota inicial / health-check
app.get("/", (_req, res) => {
    res.status(200).json({
        mensagem: "API do Sistema de Doações FMP conectada ao PostgreSQL.",
        versao: "2.0.0"
    });
});

// Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/doacoes", doacaoRoutes);
app.use("/api/campanhas", campanhaRoutes);

// Handler 404
app.use((_req, res) => {
    res.status(404).json({ mensagem: "Rota não encontrada." });
});

app.use('/api/itens', itemRoutes);

module.exports = app;
