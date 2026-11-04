// ─── Bootstrap ───────────────────────────────────────────────────────────────
require("dotenv").config();

const express    = require("express");
const pool       = require("./db");
const authRouter = require("./routes/auth");
const doacoesRouter = require("./routes/doacoes");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globais ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log de requisições
app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleString("pt-BR")}] ${req.method} ${req.url}`);
    next();
});

// ─── Rotas públicas ───────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.status(200).json({
        mensagem: "API do Sistema de Doações FMP conectada ao PostgreSQL.",
        versao:   "2.0.0"
    });
});

// Autenticação (registro + login) — sem JWT
app.use("/api/auth", authRouter);

// ─── Rotas protegidas (exigem JWT) ───────────────────────────────────────────
app.use("/api/doacoes", doacoesRouter);

// ─── Rota 404 ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ mensagem: "Rota não encontrada." });
});

// ─── Inicialização ────────────────────────────────────────────────────────────
async function iniciarServidor() {
    try {
        await pool.query("SELECT 1");
        console.log("✔  Conexão com PostgreSQL estabelecida.");

        app.listen(PORT, () => {
            console.log(`✔  Servidor rodando em http://localhost:${PORT}`);
            console.log(`   POST /api/auth/registrar  — cadastro de usuário`);
            console.log(`   POST /api/auth/login       — login (retorna JWT)`);
            console.log(`   GET  /api/doacoes          — listar doações (JWT)`);
        });
    } catch (erro) {
        console.error("✖  Não foi possível conectar ao PostgreSQL:", erro.message);
        process.exit(1);
    }
}

iniciarServidor();
