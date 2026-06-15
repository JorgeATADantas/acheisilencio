//Arquivo para consultar os locais (src/routes/localRoutes.js) - GET /locais e GET /locais/:id

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const {
  listarLocais,
  obterLocalPorId,
  criarAvaliacaoParaLocal
} = require('../controllers/localController');

// Lista todos os locais avaliados
router.get('/', listarLocais);

// Busca os detalhes de um local específico
router.get('/:id', obterLocalPorId);

// Cria uma nova avaliação para um local já existente
// Precisa estar logado
router.post('/:id/avaliacoes', auth, criarAvaliacaoParaLocal);

module.exports = router;