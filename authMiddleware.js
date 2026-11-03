const Joi = require("joi"); // ou require("@hapi/joi") conforme a versão instalada

// 1. CRIANDO O SCHEMA (A "receita" dos dados)
const doacaoSchema = Joi.object({
  aluno_id: Joi.number().integer().required(),
  campanha_id: Joi.number().integer().required(),
  data: Joi.string().required(),
  local_entrega: Joi.string().min(3).max(100).required()
});

module.exports = doacaoSchema;

function validarDoacao(req, res, next) {
  // O Joi valida o corpo da requisição contra o schema criado
  const { error } = doacaoSchema.validate(req.body);

  if (error) {
    // Se houver qualquer incoerência, barra a requisição e retorna 400
    return res.status(400).json({ 
      mensagem: "Dados inválidos", 
      detalhe: error.details[0].message 
    });
  }

  // Se estiver tudo certo, o código prossegue para a rota real
  next();
}
