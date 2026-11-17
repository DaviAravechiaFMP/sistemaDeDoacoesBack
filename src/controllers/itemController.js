const itemModel = require('../models/itemModel.js');

const itemController = {
  async listar(req, res) {
    try {
      const itens = await itemModel.listarTodos();
      return res.status(200).json(itens);
    } catch (error) {
      console.error('Erro ao listar itens:', error);
      return res.status(500).json({ erro: 'Erro interno ao buscar itens.' });
    }
  }
};

module.exports = itemController;
