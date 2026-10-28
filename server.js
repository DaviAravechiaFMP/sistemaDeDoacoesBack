require("dotenv").config();

const express = require("express");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON (Deve vir antes das rotas)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registro das requisições recebidas
app.use((req, res, next) => {
    console.log(
        `[${new Date().toLocaleString("pt-BR")}] ${req.method} ${req.url}`
    );
    next();
});

// Verifica se o ID é um inteiro positivo
function validarId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

// Verifica os campos básicos de uma doação
function validarDoacao(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        return "Envie os dados da doação em formato JSON.";
    }

    if (
        !Number.isInteger(Number(dados.aluno_id)) ||
        Number(dados.aluno_id) <= 0
    ) {
        return "aluno_id deve ser um número inteiro positivo.";
    }

    if (
        dados.campanha_id !== undefined &&
        dados.campanha_id !== null &&
        dados.campanha_id !== "" &&
        (!Number.isInteger(Number(dados.campanha_id)) ||
            Number(dados.campanha_id) <= 0)
    ) {
        return "campanha_id deve ser um número inteiro positivo ou nulo.";
    }

    if (
        typeof dados.data !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dados.data) ||
        Number.isNaN(Date.parse(dados.data)) ||
        new Date(dados.data).toISOString().slice(0, 10) !== dados.data
    ) {
        return "Informe data no formato YYYY-MM-DD com uma data válida.";
    }

    if (
        dados.status !== undefined &&
        (typeof dados.status !== "string" || dados.status.trim() === "")
    ) {
        return "status deve ser um texto não vazio.";
    }

    if (
        dados.local_entrega !== undefined &&
        typeof dados.local_entrega !== "string"
    ) {
        return "local_entrega deve ser um texto.";
    }

    return null;
}

// Rota inicial
app.get("/", (req, res) => {
    res.status(200).json({
        mensagem: "API do Sistema de Doações FMP conectada ao PostgreSQL."
    });
});

// GET /api/doacoes - Lista doações
app.get("/api/doacoes", async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                d.id,
                d.aluno_id,
                u.nome AS doador,
                d.campanha_id,
                c.titulo AS campanha,
                d.data,
                d.status,
                d.horas_concedidas,
                d.local_entrega
            FROM doacoes d
            INNER JOIN alunos a ON a.id = d.aluno_id
            INNER JOIN usuarios u ON u.id = a.id
            LEFT JOIN campanhas c ON c.id = d.campanha_id
            ORDER BY d.id ASC
        `);

        return res.status(200).json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao listar doações:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao consultar as doações."
        });
    }
});

// GET /api/doacoes/:id - Busca doação por ID
app.get("/api/doacoes/:id", async (req, res) => {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({
            mensagem: "O ID deve ser um número inteiro positivo."
        });
    }

    try {
        const resultado = await pool.query(`
            SELECT
                d.id,
                d.aluno_id,
                u.nome AS doador,
                d.campanha_id,
                c.titulo AS campanha,
                d.data,
                d.status,
                d.horas_concedidas,
                d.local_entrega
            FROM doacoes d
            INNER JOIN alunos a ON a.id = d.aluno_id
            INNER JOIN usuarios u ON u.id = a.id
            LEFT JOIN campanhas c ON c.id = d.campanha_id
            WHERE d.id = $1
        `, [Number(id)]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Doação não encontrada."
            });
        }

        return res.status(200).json(resultado.rows[0]);
    } catch (erro) {
        console.error("Erro ao buscar doação:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao consultar a doação."
        });
    }
});

// POST /api/doacoes - Cadastra uma doação
app.post("/api/doacoes", async (req, res) => {
    const erroValidacao = validarDoacao(req.body);

    if (erroValidacao) {
        return res.status(400).json({
            mensagem: erroValidacao
        });
    }

    const {
        aluno_id,
        campanha_id,
        data,
        status,
        local_entrega
    } = req.body;

    try {
        const resultado = await pool.query(`
            INSERT INTO doacoes
                (aluno_id, campanha_id, data, status, local_entrega)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            Number(aluno_id),
            campanha_id ? Number(campanha_id) : null,
            data,
            status ? status.trim() : "Pendente",
            local_entrega !== undefined
                ? local_entrega
                : "Recepção Principal FMP"
        ]);

        return res.status(201).json({
            mensagem: "Doação cadastrada com sucesso.",
            doacao: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao cadastrar doação:", erro.message);

        if (erro.code === "23503") {
            return res.status(400).json({
                mensagem: "Aluno ou campanha informado não existe no banco."
            });
        }

        return res.status(500).json({
            mensagem: "Erro interno ao cadastrar a doação."
        });
    }
});

// PUT /api/doacoes/:id - Atualiza uma doação
app.put("/api/doacoes/:id", async (req, res) => {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({
            mensagem: "O ID deve ser um número inteiro positivo."
        });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({
            mensagem: "Envie os campos da atualização em formato JSON."
        });
    }

    const { aluno_id, campanha_id, data, status, local_entrega, horas_concedidas } = req.body;

    if (
        aluno_id === undefined &&
        campanha_id === undefined &&
        data === undefined &&
        status === undefined &&
        local_entrega === undefined &&
        horas_concedidas === undefined
    ) {
        return res.status(400).json({
            mensagem: "Informe ao menos um campo para atualizar."
        });
    }

    try {
        const resultado = await pool.query(`
            UPDATE doacoes
            SET
                aluno_id = COALESCE($1, aluno_id),
                campanha_id = COALESCE($2, campanha_id),
                data = COALESCE($3, data),
                status = COALESCE($4, status),
                local_entrega = COALESCE($5, local_entrega),
                horas_concedidas = COALESCE($6, horas_concedidas)
            WHERE id = $7
            RETURNING *
        `, [
            aluno_id ? Number(aluno_id) : null,
            campanha_id ? Number(campanha_id) : null,
            data || null,
            status ? status.trim() : null,
            local_entrega || null,
            horas_concedidas !== undefined ? horas_concedidas : null,
            Number(id)
        ]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Doação não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Doação atualizada com sucesso.",
            doacao: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao atualizar doação:", erro.message);

        if (erro.code === "23503") {
            return res.status(400).json({
                mensagem: "Aluno ou campanha informado não existe no banco."
            });
        }

        return res.status(500).json({
            mensagem: "Erro interno ao atualizar a doação."
        });
    }
});

// DELETE /api/doacoes/:id - Exclui uma doação
app.delete("/api/doacoes/:id", async (req, res) => {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({
            mensagem: "O ID deve ser um número inteiro positivo."
        });
    }

    try {
        const resultado = await pool.query(`
            DELETE FROM doacoes
            WHERE id = $1
            RETURNING *
        `, [Number(id)]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Doação não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Doação excluída com sucesso.",
            doacao: resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao excluir doação:", erro.message);

        if (erro.code === "23503") {
            return res.status(400).json({
                mensagem: "Não foi possível excluir: existem registros relacionados a esta doação."
            });
        }

        return res.status(500).json({
            mensagem: "Erro interno ao excluir a doação."
        });
    }
});

// Rota 404
app.use((req, res) => {
    return res.status(404).json({
        mensagem: "Rota não encontrada."
    });
});

// Inicia o servidor
async function iniciarServidor() {
    try {
        await pool.query("SELECT 1");
        console.log("Conexão com PostgreSQL estabelecida.");

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (erro) {
        console.error("Não foi possível conectar ao PostgreSQL:", erro.message);
        process.exit(1);
    }
}

iniciarServidor();