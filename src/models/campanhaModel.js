const pool = require("../config/db");

/**
 * Lista todas as campanhas cadastradas
 * @returns {Promise<Array>}
 */
async function listarTodas() {
    const resultado = await pool.query(`
        SELECT id, titulo, descricao, data_limite, status, regras_conversao, limite_horas
        FROM campanhas
        ORDER BY id ASC
    `);
    return resultado.rows;
}

module.exports = {
    listarTodas
};
