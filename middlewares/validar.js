const { mensagens } = require("../schemas");

/**
 * Middleware de validação com Joi.
 *
 * Uso:  router.post("/rota", validar(meuSchema), handler)
 *
 * - Valida req.body contra o schema recebido.
 * - Em caso de erro retorna 400 com a lista de mensagens em português.
 * - Se passar, substitui req.body pelos dados já normalizados pelo Joi.
 */
function validar(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body ?? {}, {
            abortEarly: false,
            messages:   mensagens
        });

        if (error) {
            const erros = error.details.map((d) => d.message);
            return res.status(400).json({
                mensagem: erros[0],
                erros
            });
        }

        req.body = value; // dados validados e normalizados
        next();
    };
}

module.exports = validar;

