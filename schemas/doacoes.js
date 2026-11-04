const Joi = require("joi");

// Valida se a data existe de verdade (rejeita 2026-13-45, por exemplo)
function validarDataReal(valor, helpers) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== valor) {
        return helpers.error("data.invalida");
    }
    return valor;
}

// Schema do POST /api/doacoes
const doacaoSchema = Joi.object({
    aluno_id: Joi.number().integer().positive().required(),
    campanha_id: Joi.number().integer().positive().allow(null, ""),
    data: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .custom(validarDataReal)
        .required(),
    status: Joi.string().trim().min(1).max(30),
    local_entrega: Joi.string().trim().max(150)
});

// Schema do PUT /api/doacoes/:id
const doacaoUpdateSchema = Joi.object({
    status: Joi.string().trim().min(1).max(30),
    local_entrega: Joi.string().trim().max(150),
    horas_concedidas: Joi.number().min(0).allow(null)
}).min(1);

module.exports = { doacaoSchema, doacaoUpdateSchema };