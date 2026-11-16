const doacaoModel = require("../models/doacaoModel");

function validarId(id) {
    return /^\d+$/.test(String(id)) && Number(id) > 0;
}

/**
 * Listar todas as doações
 */
async function listar(_req, res) {
    try {
        const doacoes = await doacaoModel.listarTodas();
        return res.status(200).json(doacoes);
    } catch (erro) {
        console.error("Erro ao listar doações:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao consultar as doações."
        });
    }
}

/**
 * Buscar doação por ID
 */
async function buscarPorId(req, res) {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({
            mensagem: "O ID deve ser um número inteiro positivo."
        });
    }

    try {
        const doacao = await doacaoModel.buscarPorId(id);
        if (!doacao) {
            return res.status(404).json({
                mensagem: "Doação não encontrada."
            });
        }

        return res.status(200).json(doacao);
    } catch (erro) {
        console.error("Erro ao buscar doação:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao consultar a doação."
        });
    }
}

/**
 * Cadastrar uma nova doação
 */
async function criar(req, res) {
    const { aluno_id, campanha_id, data, status, local_entrega } = req.body;

    try {
        const doacao = await doacaoModel.criar({
            aluno_id,
            campanha_id,
            data,
            status,
            local_entrega
        });

        return res.status(201).json({
            mensagem: "Doação cadastrada com sucesso.",
            doacao
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
}

/**
 * Atualizar doação existente
 */
async function atualizar(req, res) {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({
            mensagem: "O ID deve ser um número inteiro positivo."
        });
    }

    const { status, local_entrega, horas_concedidas } = req.body;

    try {
        const doacao = await doacaoModel.atualizar(id, {
            status,
            local_entrega,
            horas_concedidas
        });

        if (!doacao) {
            return res.status(404).json({
                mensagem: "Doação não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Doação atualizada com sucesso.",
            doacao
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
}

/**
 * Excluir doação por ID
 */
async function excluir(req, res) {
    const { id } = req.params;

    if (!validarId(id)) {
        return res.status(400).json({
            mensagem: "O ID deve ser um número inteiro positivo."
        });
    }

    try {
        const doacao = await doacaoModel.excluir(id);
        if (!doacao) {
            return res.status(404).json({
                mensagem: "Doação não encontrada."
            });
        }

        return res.status(200).json({
            mensagem: "Doação excluída com sucesso.",
            doacao
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
}

module.exports = {
    listar,
    buscarPorId,
    criar,
    atualizar,
    excluir
};
