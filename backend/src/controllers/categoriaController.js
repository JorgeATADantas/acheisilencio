/*Arquivo para executar a seguinte lógica:
    - recebem os dados da rota
    - validam informações
    - consultam o banco
    - retornam resposta para o frontend
Ele fará:
    - busca das categorias no banco
 
src/controllers/categoriaController.js

*/

const db = require('../database/db');

exports.listarCategorias = async (req, res) => {
  try {
    // Busca categorias ativas no banco
    const result = await db.query(
      `
      SELECT id, codigo, nome
      FROM categorias
      WHERE ativo = TRUE
      ORDER BY nome
      `
    );

    // Retorna as categorias para o frontend
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};