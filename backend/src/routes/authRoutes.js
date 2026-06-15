//Arquivo para rotas de autenticação (src/routes/authRoutes.js)

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const {
  register,
  login,
  me
} = require('../controllers/authController');

// Cadastro de usuário
router.post('/register', register);

// Login de usuário
router.post('/login', login);

// Retorna dados do usuário logado (precisa de token)
router.get('/me', auth, me);

module.exports = router;