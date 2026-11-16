const campanhaModel = require("../models/campanhaModel");

/**
 * Listar todas as campanhas
 */
async function listar(_req, res) {
    try {
        const campanhas = await campanhaModel.listarTodas();
        return res.status(200).json(campanhas);
    } catch (erro) {
        console.error("Erro ao listar campanhas:", erro.message);
        return res.status(500).json({
            mensagem: "Erro interno ao consultar as campanhas."
        });
    }
}

module.exports = {
    listar
};
