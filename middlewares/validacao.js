const mensagens = {
    "any.required": "{{#label}} é obrigatório.",
    "string.base": "{{#label}} deve ser um texto.",
    "string.empty": "{{#label}} não pode ser vazio.",
    "string.min": "{{#label}} deve ter no mínimo {{#limit}} caractere(s).",
    "string.max": "{{#label}} deve ter no máximo {{#limit}} caracteres.",
    "string.pattern.base": "{{#label}} está em formato inválido (use YYYY-MM-DD).",
    "number.base": "{{#label}} deve ser um número.",
    "number.integer": "{{#label}} deve ser um número inteiro.",
    "number.positive": "{{#label}} deve ser maior que zero.",
    "number.min": "{{#label}} deve ser no mínimo {{#limit}}.",
    "object.unknown": "O campo {{#label}} não é permitido.",
    "object.min": "Informe ao menos um campo para atualizar.",
    "data.invalida": "{{#label}} deve ser uma data válida (YYYY-MM-DD)."
};

// Recebe um schema do Joi e devolve o middleware de validação
function validar(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body ?? {}, {
            abortEarly: false,
            messages: mensagens
        });

        if (error) {
            const erros = error.details.map((d) => d.message);
            return res.status(400).json({
                mensagem: erros[0],
                erros
            });
        }

        req.body = value; // dados já validados e normalizados
        next();
    };
}

module.exports = validar;