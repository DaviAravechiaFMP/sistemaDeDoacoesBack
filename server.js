require("dotenv").config();

const app = require("./src/app");
const pool = require("./src/config/db");

const PORT = process.env.PORT || 3000;

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
