const express    = require("express");
const pool       = require("../db");
const validar    = require("../middlewares/validar");
const autenticar = require("../middlewares/autenticar");
const { doacaoSchema, doacaoUpdateSchema } = require("../schemas");

const router = express.Router();

// ─── Utilitários ─────────────────────────────────────────────────────────────
function validarId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

// ─── GET /api/doacoes ─────────────────────────────────────────────────────────
router.get("/", autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT
                d.id,
                d.aluno_id,
                u.nome          AS doador,
                d.campanha_id,
                c.titulo        AS campanha,
                d.data,
                d.status,
                d.horas_concedidas,
                d.local_entrega
            FROM doacoes d
            INNER JOIN alunos   a ON a.id = d.aluno_id
            INNER JOIN usuarios u ON u.id = a.id
            LEFT  JOIN campanhas c ON c.id = d.campanha_id
            ORDER BY d.id ASC
        `);

        return res.status(200).json(resultado.rows);
    } catch (erro) {
        console.error("Erro ao listar doações:", erro.message);
        return res.status(500).json({ mensagem: "Erro interno ao consultar as doações." });
    }
});

// ─── GET /api/doacoes/:id ─────────────────────────────────────────────────────
router.get("/:id", autenticar, async (req, res) => {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({ mensagem: "O ID deve ser um número inteiro positivo." });
    }

    try {
        const resultado = await pool.query(`
            SELECT
                d.id,
                d.aluno_id,
                u.nome          AS doador,
                d.campanha_id,
                c.titulo        AS campanha,
                d.data,
                d.status,
                d.horas_concedidas,
                d.local_entrega
            FROM doacoes d
            INNER JOIN alunos   a ON a.id = d.aluno_id
            INNER JOIN usuarios u ON u.id = a.id
            LEFT  JOIN campanhas c ON c.id = d.campanha_id
            WHERE d.id = $1
        `, [Number(id)]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: "Doação não encontrada." });
        }

        return res.status(200).json(resultado.rows[0]);
    } catch (erro) {
        console.error("Erro ao buscar doação:", erro.message);
        return res.status(500).json({ mensagem: "Erro interno ao consultar a doação." });
    }
});

// ─── POST /api/doacoes ────────────────────────────────────────────────────────
router.post("/", autenticar, validar(doacaoSchema), async (req, res) => {
    const { aluno_id, campanha_id, data, status, local_entrega } = req.body;

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
            status        ? status.trim()     : "Pendente",
            local_entrega !== undefined ? local_entrega : "Recepção Principal FMP"
        ]);

        return res.status(201).json({
            mensagem: "Doação cadastrada com sucesso.",
            doacao:   resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao cadastrar doação:", erro.message);

        if (erro.code === "23503") {
            return res.status(400).json({ mensagem: "Aluno ou campanha informado não existe no banco." });
        }

        return res.status(500).json({ mensagem: "Erro interno ao cadastrar a doação." });
    }
});

// ─── PUT /api/doacoes/:id ─────────────────────────────────────────────────────
router.put("/:id", autenticar, validar(doacaoUpdateSchema), async (req, res) => {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({ mensagem: "O ID deve ser um número inteiro positivo." });
    }

    const { status, local_entrega, horas_concedidas } = req.body;

    try {
        const resultado = await pool.query(`
            UPDATE doacoes
            SET
                status           = COALESCE($1, status),
                local_entrega    = COALESCE($2, local_entrega),
                horas_concedidas = COALESCE($3, horas_concedidas)
            WHERE id = $4
            RETURNING *
        `, [
            status           ? status.trim() : null,
            local_entrega    || null,
            horas_concedidas !== undefined ? horas_concedidas : null,
            Number(id)
        ]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: "Doação não encontrada." });
        }

        return res.status(200).json({
            mensagem: "Doação atualizada com sucesso.",
            doacao:   resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao atualizar doação:", erro.message);

        if (erro.code === "23503") {
            return res.status(400).json({ mensagem: "Aluno ou campanha informado não existe no banco." });
        }

        return res.status(500).json({ mensagem: "Erro interno ao atualizar a doação." });
    }
});

// ─── DELETE /api/doacoes/:id ──────────────────────────────────────────────────
router.delete("/:id", autenticar, async (req, res) => {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({ mensagem: "O ID deve ser um número inteiro positivo." });
    }

    try {
        const resultado = await pool.query(`
            DELETE FROM doacoes
            WHERE id = $1
            RETURNING *
        `, [Number(id)]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: "Doação não encontrada." });
        }

        return res.status(200).json({
            mensagem: "Doação excluída com sucesso.",
            doacao:   resultado.rows[0]
        });
    } catch (erro) {
        console.error("Erro ao excluir doação:", erro.message);

        if (erro.code === "23503") {
            return res.status(400).json({
                mensagem: "Não foi possível excluir: existem registros relacionados a esta doação."
            });
        }

        return res.status(500).json({ mensagem: "Erro interno ao excluir a doação." });
    }
});

module.exports = router;

