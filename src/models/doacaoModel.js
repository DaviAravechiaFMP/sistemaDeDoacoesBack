const pool = require("../config/db");

/**
 * Lista todas as doações com dados do doador e da campanha
 * @returns {Promise<Array>}
 */
async function listarTodas() {
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
    return resultado.rows;
}

/**
 * Busca uma doação específica por ID com dados do doador e da campanha
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
async function buscarPorId(id) {
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

    return resultado.rows[0] || null;
}

/**
 * Cadastra uma nova doação
 * @param {object} dados
 * @param {number|string} dados.aluno_id
 * @param {number|string|null} [dados.campanha_id]
 * @param {string} dados.data
 * @param {string} [dados.status="Pendente"]
 * @param {string} [dados.local_entrega="Recepção Principal FMP"]
 * @returns {Promise<object>}
 */
async function criar({ aluno_id, campanha_id, data, status, local_entrega }) {
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
        local_entrega !== undefined ? local_entrega : "Recepção Principal FMP"
    ]);

    return resultado.rows[0];
}

/**
 * Atualiza os campos de uma doação
 * @param {number|string} id
 * @param {object} dados
 * @param {string} [dados.status]
 * @param {string} [dados.local_entrega]
 * @param {number|null} [dados.horas_concedidas]
 * @returns {Promise<object|null>}
 */
async function atualizar(id, { status, local_entrega, horas_concedidas }) {
    const resultado = await pool.query(`
        UPDATE doacoes
        SET
            status           = COALESCE($1, status),
            local_entrega    = COALESCE($2, local_entrega),
            horas_concedidas = COALESCE($3, horas_concedidas)
        WHERE id = $4
        RETURNING *
    `, [
        status ? status.trim() : null,
        local_entrega || null,
        horas_concedidas !== undefined ? horas_concedidas : null,
        Number(id)
    ]);

    return resultado.rows[0] || null;
}

/**
 * Remove uma doação pelo ID
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
async function excluir(id) {
    const resultado = await pool.query(`
        DELETE FROM doacoes
        WHERE id = $1
        RETURNING *
    `, [Number(id)]);

    return resultado.rows[0] || null;
}

module.exports = {
    listarTodas,
    buscarPorId,
    criar,
    atualizar,
    excluir
};
