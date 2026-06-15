/*Arquivo para executar a seguinte lógica:
    - recebem os dados da rota
    - validam informações
    - consultam o banco
    - retornam resposta para o frontend
Ele fará:
    - busca os critérios e as opções.
 
src/controllers/criterioController.js

*/

const db = require('../database/db');

exports.listarCriteriosComOpcoes = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        c.id AS criterio_id,
        c.codigo AS criterio_codigo,
        c.nome AS criterio_nome,
        co.id AS opcao_id,
        co.valor AS opcao_valor,
        co.descricao AS opcao_descricao,
        co.nota AS opcao_nota
      FROM criterios c
      INNER JOIN criterio_opcoes co
        ON co.criterio_id = c.id
      WHERE c.ativo = TRUE
        AND co.ativo = TRUE
      ORDER BY c.id, co.nota DESC
      `
    );

    const criterios = {};

    result.rows.forEach((row) => {
      if (!criterios[row.criterio_codigo]) {
        criterios[row.criterio_codigo] = {
          id: row.criterio_id,
          codigo: row.criterio_codigo,
          nome: row.criterio_nome,
          opcoes: []
        };
      }

      criterios[row.criterio_codigo].opcoes.push({
        id: row.opcao_id,
        valor: row.opcao_valor,
        descricao: row.opcao_descricao,
        nota: row.opcao_nota
      });
    });

    return res.json(Object.values(criterios));
  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};