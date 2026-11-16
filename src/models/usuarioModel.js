const pool = require("../config/db");

/**
 * Busca um usuário pelo e-mail
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
async function buscarPorEmail(email) {
    const resultado = await pool.query(
        `SELECT id, nome, email, senha, tentativas_falhas, bloqueado_ate
         FROM usuarios
         WHERE email = $1`,
        [email ? email.toLowerCase() : ""]
    );
    return resultado.rows[0];
}

/**
 * Registra um novo usuário com perfil de aluno em transação atômica
 * @param {object} dados
 * @param {string} dados.nome
 * @param {string} [dados.cpf]
 * @param {string} dados.email
 * @param {string} dados.senhaHash
 * @returns {Promise<object>}
 */
async function registrarAluno({ nome, cpf, email, senhaHash }) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const resUsuario = await client.query(
            `INSERT INTO usuarios (nome, cpf, email, senha)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, email, cpf`,
            [nome.trim(), cpf || null, email.toLowerCase(), senhaHash]
        );
        const usuario = resUsuario.rows[0];

        const matricula = String(10000 + usuario.id);
        await client.query(
            `INSERT INTO alunos (id, matricula, curso, saldo_horas)
             VALUES ($1, $2, $3, 0)`,
            [usuario.id, matricula, "Análise e Desenvolvimento de Sistemas"]
        );

        await client.query("COMMIT");

        return { ...usuario, matricula };
    } catch (erro) {
        await client.query("ROLLBACK");
        throw erro;
    } finally {
        client.release();
    }
}

/**
 * Registra tentativas falhas e define bloqueio temporário caso necessário
 * @param {number|string} id
 * @param {number} novasTentativas
 * @param {Date|null} [bloqueadoAte=null]
 * @returns {Promise<object>}
 */
async function registrarTentativaFalha(id, novasTentativas, bloqueadoAte = null) {
    const resultado = await pool.query(
        `UPDATE usuarios
         SET tentativas_falhas = $1, bloqueado_ate = $2
         WHERE id = $3
         RETURNING id, tentativas_falhas, bloqueado_ate`,
        [novasTentativas, bloqueadoAte, id]
    );
    return resultado.rows[0];
}

/**
 * Reseta o contador de tentativas e cancela bloqueio
 * @param {number|string} id
 * @returns {Promise<object>}
 */
async function resetarTentativas(id) {
    const resultado = await pool.query(
        `UPDATE usuarios
         SET tentativas_falhas = 0, bloqueado_ate = NULL
         WHERE id = $1
         RETURNING id, tentativas_falhas, bloqueado_ate`,
        [id]
    );
    return resultado.rows[0];
}
/**
 * Busca o perfil do usuário com os dados de aluno
 * @param {number|string} id
 * @returns {Promise<object|undefined>}
 */
async function buscarPerfilPorId(id) {
    const resultado = await pool.query(
        `SELECT u.id, u.nome, u.email, u.cpf,
                a.matricula, a.curso, a.saldo_horas
         FROM usuarios u
         LEFT JOIN alunos a ON a.id = u.id
         WHERE u.id = $1`,
        [id]
    );
    return resultado.rows[0];
}

module.exports = {
    buscarPorEmail,
    registrarAluno,
    registrarTentativaFalha,
    resetarTentativas,
    buscarPerfilPorId
};
