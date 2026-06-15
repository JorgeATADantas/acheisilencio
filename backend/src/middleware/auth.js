// Arquivo para proteger rotas que exigem login (src/middleware/auth.js)

// Importa a biblioteca JWT
const jwt = require('jsonwebtoken');

// Middleware de autenticação
module.exports = function auth(req, res, next) {
  // Pega o header Authorization da requisição
  const authHeader = req.headers.authorization;

  // Se não tiver token, bloqueia
  if (!authHeader) {
    return res.status(401).json({
      erro: 'Token não informado'
    });
  }

  // Espera-se: Authorization: Bearer TOKEN...
  const parts = authHeader.split(' ');

  // Se não vier em duas partes, está errado
  if (parts.length !== 2) {
    return res.status(401).json({
      erro: 'Token mal formatado'
    });
  }

  const [scheme, token] = parts;

  // Verifica se começa com Bearer
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({
      erro: 'Token mal formatado'
    });
  }

  try {
    // Verifica se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guarda o id do usuário na requisição
    req.userId = decoded.id;

    // Libera a requisição para continuar
    next();
  } catch (error) {
    return res.status(401).json({
      erro: 'Token inválido'
    });
  }
};