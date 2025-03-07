const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

async function authMiddleware(req, res, next) {
  try {
    // Verificar se o token existe
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Formato: Bearer <token>
    const [, token] = authHeader.split(' ');

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    // Adicionar usuário à requisição
    req.user = user;

    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = authMiddleware; 