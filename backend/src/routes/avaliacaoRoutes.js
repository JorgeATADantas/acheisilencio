//Arquivo para criar e excluir avaliações (src/routes/avaliacaoRoutes.js) - POST /avaliacoes e DELETE /avaliacoes/:id

// src/routes/avaliacaoRoutes.js

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const {
  criarAvaliacao,
  editarAvaliacao,
  deletarAvaliacao
} = require('../controllers/avaliacaoController');

// Criar avaliação (precisa estar logado)
router.post('/', auth, criarAvaliacao);

// Editar a própria avaliação
// Precisa estar logado
router.put('/:id', auth, editarAvaliacao);

// Deletar a própria avaliação (precisa estar logado)
router.delete('/:id', auth, deletarAvaliacao);

module.exports = router;