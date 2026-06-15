//Arquivo para configurar a aplicação Express (src/app.js)

// Importa o Express (framework usado para criar a API)
const express = require('express');

// Importa o CORS (permite que o frontend acesse o backend)
const cors = require('cors');

// Importa as rotas da aplicação
const authRoutes        = require('./routes/authRoutes');
const categoriaRoutes   = require('./routes/categoriaRoutes');
const criterioRoutes    = require('./routes/criterioRoutes');
const localRoutes       = require('./routes/localRoutes');
const avaliacaoRoutes   = require('./routes/avaliacaoRoutes');
const perfilRoutes      = require('./routes/perfilRoutes');

// Cria uma instância da aplicação Express
const app = express();

// Habilita o CORS (permite que outras aplicações acessem esta API)
app.use(cors());

// Permite que o backend receba JSON no corpo das requisições (exemplo: req.body com dados de login, cadastro e avaliação)
app.use(express.json());

// Rota inicial de teste (quando acessar http://localhost:3000, deve aparecer a mensagem abaixo)
app.get('/', (req, res) => {
  res.json({
    mensagem: 'API AcheiSilêncio rodando'
  });
});

// Registra as rotas de autenticação (exemplo: POST /auth/register e POST /auth/login)
app.use('/auth', authRoutes);

// Registra as rotas de categorias (exemplo: GET /categorias)
app.use('/categorias', categoriaRoutes);

// Registra as rotas de critérios (exemplo: GET /criterios
app.use('/criterios', criterioRoutes);

// Registra as rotas de locais (exemplo: GET /locais e GET /locais/1)
app.use('/locais', localRoutes);

// Registra as rotas de avaliações (exemplo: POST /avaliacoes e DELETE /avaliacoes/1)
app.use('/avaliacoes', avaliacaoRoutes);

//
app.use('/perfil', perfilRoutes);

// Exporta o app para ser usado pelo server.js
module.exports = app;