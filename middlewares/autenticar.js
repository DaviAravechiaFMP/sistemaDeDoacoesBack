const jwt = require("jsonwebtoken");

/**
 * Middleware de autenticação JWT.
 *
 * Espera o cabeçalho:  Authorization: Bearer <token>
 *
 * - 401  →  token ausente ou mal-formatado
 * - 401  →  token expirado ou inválido
 * - Se válido, popula req.usuario com o payload decodificado e chama next().
 */
function autenticar(req, res, next) {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            mensagem: "Acesso negado. Token de autenticação não informado."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload; // { id, email, nome, iat, exp }
        next();
    } catch (erro) {
        if (erro.name === "TokenExpiredError") {
            return res.status(401).json({
                mensagem: "Token expirado. Faça login novamente."
            });
        }
        return res.status(401).json({
            mensagem: "Token inválido."
        });
    }
}

module.exports = autenticar;

