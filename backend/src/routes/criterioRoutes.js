//Arquivo para listar critérios e opções (src/routes/criterioRoutes.js) - GET /criterios

const express = require('express');
const router = express.Router();

const {
  listarCriteriosComOpcoes
} = require('../controllers/criterioController');

// Lista critérios com suas opções
router.get('/', listarCriteriosComOpcoes);

module.exports = router;