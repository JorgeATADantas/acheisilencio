//Arquivo para conectar o backend ao PostgreSQL (src/database/db.js)

// Importa o Pool do pacote pg (o pooll gerencia conexões com o PostgreSQL.)
const { Pool } = require('pg');

// Cria a conexão com o banco usando a DATABASE_URL do .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Necessário para conexões com bancos online como Neon
  ssl: {
    rejectUnauthorized: false
  }
});

// Exporta a conexão para ser usada nos controllers
module.exports = pool;