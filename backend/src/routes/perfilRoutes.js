// src/routes/perfilRoutes.js

const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');

const {
  obterPerfil,
  atualizarPerfil,
  listarMinhasAvaliacoes,
  obterEstatisticas,
  listarFavoritos,
  adicionarFavorito,
  removerFavorito
} = require('../controllers/perfilController');

// Todas as rotas de perfil exigem login
router.get('/', auth, obterPerfil);

router.put('/', auth, atualizarPerfil);

router.get('/avaliacoes', auth, listarMinhasAvaliacoes);

router.get('/estatisticas', auth, obterEstatisticas);

router.get('/favoritos', auth, listarFavoritos);

router.post('/favoritos/:localId', auth, adicionarFavorito);

router.delete('/favoritos/:localId', auth, removerFavorito);

module.exports = router;