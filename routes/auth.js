const express  = require("express");
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const pool     = require("../db");
const validar  = require("../middlewares/validar");
const { registroSchema, loginSchema } = require("../schemas");

const router = express.Router();

const SALT_ROUNDS    = 10;   // custo do bcrypt
const MAX_TENTATIVAS = 5;    // bloqueio após N falhas consecutivas
const BLOQUEIO_MIN   = 15;   // minutos de bloqueio

// ─── POST /api/auth/registrar ────────────────────────────────────────────────
/**
 * Registra um novo usuário (tipo: aluno).
 *
 * Body:  { nome, email, senha, cpf? }
 *
 * - Valida os dados com Joi.
 * - Verifica se o e-mail já está cadastrado.
 * - Faz hash da senha com bcrypt.
 * - Insere na tabela usuarios e, em seguida, na tabela alunos
 *   (gera matrícula automática).
 * - Retorna o usuário criado (sem a senha).
 */
router.post("/registrar", validar(registroSchema), async (req, res) => {
    const { nome, email, senha, cpf } = req.body;

    try {
        // 1. Verifica duplicidade de e-mail
        const existe = await pool.query(
            "SELECT id FROM usuarios WHERE email = $1",
            [email.toLowerCase()]
        );
        if (existe.rows.length > 0) {
            return res.status(409).json({
                mensagem: "E-mail já cadastrado."
            });
        }

        // 2. Hash da senha
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

        // 3. Insere na tabela usuarios (dentro de uma transaction)
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

            // 4. Gera matrícula e insere na tabela alunos
            const matricula = String(10000 + usuario.id); // ex.: "10005"
            await client.query(
                `INSERT INTO alunos (id, matricula, curso, saldo_horas)
                 VALUES ($1, $2, $3, 0)`,
                [usuario.id, matricula, "Análise e Desenvolvimento de Sistemas"]
            );

            await client.query("COMMIT");

            return res.status(201).json({
                mensagem:  "Usuário registrado com sucesso.",
                usuario:   { ...usuario, matricula }
            });
        } catch (erroTx) {
            await client.query("ROLLBACK");
            throw erroTx;
        } finally {
            client.release();
        }
    } catch (erro) {
        console.error("Erro ao registrar usuário:", erro.message);

        if (erro.code === "23505") { // unique_violation
            return res.status(409).json({
                mensagem: "E-mail ou CPF já cadastrado."
            });
        }

        return res.status(500).json({
            mensagem: "Erro interno ao registrar o usuário."
        });
    }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
/**
 * Autentica um usuário e devolve um JWT.
 *
 * Body:  { email, senha }
 *
 * Fluxo de segurança:
 *  1. Busca o usuário pelo e-mail.
 *  2. Verifica se a conta está bloqueada (tentativas_falhas >= MAX_TENTATIVAS).
 *  3. Compara a senha com bcrypt.compare().
 *  4. Se a senha estiver errada → incrementa tentativas_falhas; ao atingir
 *     MAX_TENTATIVAS registra bloqueado_ate.
 *  5. Se correta → zera tentativas_falhas e emite JWT.
 */
router.post("/login", validar(loginSchema), async (req, res) => {
    const { email, senha } = req.body;

    try {
        // 1. Busca o usuário
        const resultado = await pool.query(
            `SELECT id, nome, email, senha, tentativas_falhas, bloqueado_ate
             FROM usuarios
             WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (resultado.rows.length === 0) {
            // Resposta genérica para não revelar quais e-mails existem
            return res.status(401).json({
                mensagem: "Credenciais inválidas."
            });
        }

        const usuario = resultado.rows[0];

        // 2. Verifica bloqueio temporário
        if (usuario.bloqueado_ate && new Date() < new Date(usuario.bloqueado_ate)) {
            const restante = Math.ceil(
                (new Date(usuario.bloqueado_ate) - new Date()) / 60000
            );
            return res.status(403).json({
                mensagem: `Conta bloqueada temporariamente. Tente novamente em ${restante} minuto(s).`
            });
        }

        // 3. Compara senha com bcrypt
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            // 4a. Incrementa contador de tentativas
            const novasTentativas = (usuario.tentativas_falhas || 0) + 1;

            if (novasTentativas >= MAX_TENTATIVAS) {
                // Bloqueia a conta por BLOQUEIO_MIN minutos
                const bloqueadoAte = new Date(
                    Date.now() + BLOQUEIO_MIN * 60 * 1000
                );
                await pool.query(
                    `UPDATE usuarios
                     SET tentativas_falhas = $1, bloqueado_ate = $2
                     WHERE id = $3`,
                    [novasTentativas, bloqueadoAte, usuario.id]
                );
                return res.status(403).json({
                    mensagem: `Muitas tentativas falhas. Conta bloqueada por ${BLOQUEIO_MIN} minuto(s).`
                });
            }

            await pool.query(
                `UPDATE usuarios SET tentativas_falhas = $1 WHERE id = $2`,
                [novasTentativas, usuario.id]
            );

            return res.status(401).json({
                mensagem: "Credenciais inválidas.",
                tentativas_restantes: MAX_TENTATIVAS - novasTentativas
            });
        }

        // 4b. Senha correta → reseta contadores
        await pool.query(
            `UPDATE usuarios
             SET tentativas_falhas = 0, bloqueado_ate = NULL
             WHERE id = $1`,
            [usuario.id]
        );

        // 5. Gera JWT
        const payload = { id: usuario.id, email: usuario.email, nome: usuario.nome };
        const token   = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "8h"
        });

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (erro) {
        console.error("Erro no login:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao processar o login."
        });
    }
});

module.exports = router;

