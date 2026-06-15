//Arquivo para iniciar o servidor (src/server.js)

// Carrega as variáveis de ambiente do arquivo .env (Exemplo: PORT, DATABASE_URL, JWT_SECRET)
require('dotenv').config({ path: __dirname + '/../.env' });

// Importa o app configurado no arquivo app.js (Rotas, middlewares e configurações do Express,...)
const app = require('./app');

// Define a porta onde o servidor vai rodar (Primeiro tenta usar a porta definida no .env, se não existir, usa a porta 3000)
const PORT = process.env.PORT || 3000;

// Inicia o servidor (Enquanto esse comando estiver ativo, o backend fica "ouvindo" requisições)
app.listen(PORT, () => {
  console.log(`Servidor AcheiSilêncio rodando na porta ${PORT}`);
});