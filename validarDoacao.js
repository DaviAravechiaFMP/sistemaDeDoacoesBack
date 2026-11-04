const Joi = require("joi");

const doacaoSchema = Joi.object({
  aluno_id: Joi.number().integer().required(),
  campanha_id: Joi.number().integer().required(),
  data: Joi.string().required(),
  local_entrega: Joi.string().min(3).max(100).required()
});

function validarDoacao(req, res, next) {
  const { error } = doacaoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      mensagem: "Dados inválidos", 
      detalhe: error.details[0].message 
    });
  }
  next();
}

module.exports = { validarDoacao };
