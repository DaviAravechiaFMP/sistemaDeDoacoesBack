const Joi = require("joi");

// ─── Mensagens de erro em português ──────────────────────────────────────────
const mensagens = {
    "any.required":        "{{#label}} é obrigatório.",
    "string.base":         "{{#label}} deve ser um texto.",
    "string.empty":        "{{#label}} não pode ser vazio.",
    "string.min":          "{{#label}} deve ter no mínimo {{#limit}} caractere(s).",
    "string.max":          "{{#label}} deve ter no máximo {{#limit}} caracteres.",
    "string.email":        "{{#label}} deve ser um e-mail válido.",
    "string.pattern.base": "{{#label}} está em formato inválido.",
    "number.base":         "{{#label}} deve ser um número.",
    "number.integer":      "{{#label}} deve ser um número inteiro.",
    "number.positive":     "{{#label}} deve ser maior que zero.",
    "number.min":          "{{#label}} deve ser no mínimo {{#limit}}.",
    "object.unknown":      "O campo {{#label}} não é permitido.",
    "object.min":          "Informe ao menos um campo para atualizar.",
    "data.invalida":       "{{#label}} deve ser uma data válida (YYYY-MM-DD)."
};

// ─── Schema: Cadastro de usuário (POST /api/auth/registrar) ──────────────────
const registroSchema = Joi.object({
    nome:  Joi.string().trim().min(2).max(100).required().label("Nome"),
    cpf:   Joi.string()
                .trim()
                .pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
                .allow(null, "")
                .label("CPF"),
    email: Joi.string().trim().email({ tlds: { allow: false } }).max(100)
                .required().label("E-mail"),
    senha: Joi.string().min(6).max(100).required().label("Senha")
});

// ─── Schema: Login (POST /api/auth/login) ────────────────────────────────────
const loginSchema = Joi.object({
    email: Joi.string().trim().email({ tlds: { allow: false } })
                .required().label("E-mail"),
    senha: Joi.string().required().label("Senha")
});

// ─── Schema: Doação — criação (POST /api/doacoes) ────────────────────────────
function validarDataReal(valor, helpers) {
    const d = new Date(valor);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== valor) {
        return helpers.error("data.invalida");
    }
    return valor;
}

const doacaoSchema = Joi.object({
    aluno_id:    Joi.number().integer().positive().required().label("aluno_id"),
    campanha_id: Joi.number().integer().positive().allow(null, "").label("campanha_id"),
    data:        Joi.string()
                    .pattern(/^\d{4}-\d{2}-\d{2}$/)
                    .custom(validarDataReal)
                    .required()
                    .label("data"),
    status:      Joi.string().trim().min(1).max(30).label("status"),
    local_entrega: Joi.string().trim().max(150).label("local_entrega")
});

// ─── Schema: Doação — atualização (PUT /api/doacoes/:id) ─────────────────────
const doacaoUpdateSchema = Joi.object({
    status:          Joi.string().trim().min(1).max(30).label("status"),
    local_entrega:   Joi.string().trim().max(150).label("local_entrega"),
    horas_concedidas: Joi.number().min(0).allow(null).label("horas_concedidas")
}).min(1);

module.exports = {
    registroSchema,
    loginSchema,
    doacaoSchema,
    doacaoUpdateSchema,
    mensagens
};

