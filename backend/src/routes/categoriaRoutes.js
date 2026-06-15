//Arquivo para listar categorias (src/routes/categoriaRoutes.js) - GET /categorias

const express = require('express');
const router = express.Router();

const {
  listarCategorias
} = require('../controllers/categoriaController');

// Lista todas as categorias ativas
router.get('/', listarCategorias);

module.exports = router;