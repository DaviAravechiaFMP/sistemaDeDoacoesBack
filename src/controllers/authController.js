const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usuarioModel = require("../models/usuarioModel");

const SALT_ROUNDS = 10;
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MIN = 15;

/**
 * Cadastro de novo usuário (aluno)
 */
async function registrar(req, res) {
    const { nome, email, senha, cpf } = req.body;

    try {
        const existe = await usuarioModel.buscarPorEmail(email);
        if (existe) {
            return res.status(409).json({
                mensagem: "E-mail já cadastrado."
            });
        }

        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
        const usuario = await usuarioModel.registrarAluno({
            nome,
            cpf,
            email,
            senhaHash
        });

        return res.status(201).json({
            mensagem: "Usuário registrado com sucesso.",
            usuario
        });
    } catch (erro) {
        console.error("Erro ao registrar usuário:", erro.message);

        if (erro.code === "23505") {
            return res.status(409).json({
                mensagem: "E-mail ou CPF já cadastrado."
            });
        }

        return res.status(500).json({
            mensagem: "Erro interno ao registrar o usuário."
        });
    }
}

/**
 * Autenticação de usuário com bloqueio progressivo e emissão de JWT
 */
async function login(req, res) {
    const { email, senha } = req.body;

    try {
        const usuario = await usuarioModel.buscarPorEmail(email);
        if (!usuario) {
            return res.status(401).json({
                mensagem: "Credenciais inválidas."
            });
        }

        if (usuario.bloqueado_ate && new Date() < new Date(usuario.bloqueado_ate)) {
            const restante = Math.ceil(
                (new Date(usuario.bloqueado_ate) - new Date()) / 60000
            );
            return res.status(403).json({
                mensagem: `Conta bloqueada temporariamente. Tente novamente em ${restante} minuto(s).`
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            const novasTentativas = (usuario.tentativas_falhas || 0) + 1;

            if (novasTentativas >= MAX_TENTATIVAS) {
                const bloqueadoAte = new Date(Date.now() + BLOQUEIO_MIN * 60 * 1000);
                await usuarioModel.registrarTentativaFalha(usuario.id, novasTentativas, bloqueadoAte);

                return res.status(403).json({
                    mensagem: `Muitas tentativas falhas. Conta bloqueada por ${BLOQUEIO_MIN} minuto(s).`
                });
            }

            await usuarioModel.registrarTentativaFalha(usuario.id, novasTentativas, null);

            return res.status(401).json({
                mensagem: "Credenciais inválidas.",
                tentativas_restantes: MAX_TENTATIVAS - novasTentativas
            });
        }

        await usuarioModel.resetarTentativas(usuario.id);

        const payload = {
            id: usuario.id,
            email: usuario.email,
            nome: usuario.nome
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "8h"
        });

        return res.status(200).json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    } catch (erro) {
        console.error("Erro no login:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao processar o login."
        });
    }
}

module.exports = {
    registrar,
    login
};
