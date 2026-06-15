/*Arquivo para executar a seguinte lógica:
    - recebem os dados da rota
    - validam informações
    - consultam o banco
    - retornam resposta para o frontend
Ele fará:
    - listar locais
    - buscar detalhes de um local
    - calcular média geral
    - calcular média por critério
    - listar avaliações do local
 
src/controllers/localController.js

*/

const db = require('../database/db');

exports.listarLocais = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        l.id,
        l.osm_id,
        l.nome,
        l.endereco,
        l.latitude,
        l.longitude,
        c.codigo AS categoria_codigo,
        c.nome AS categoria_nome,
        ROUND(AVG(a.nota_final), 2) AS media_geral,
        COUNT(a.id) AS total_avaliacoes
      FROM locais l
      INNER JOIN categorias c
        ON c.id = l.categoria_id
      LEFT JOIN avaliacoes a
        ON a.local_id = l.id
      GROUP BY
        l.id,
        c.codigo,
        c.nome
      ORDER BY media_geral DESC NULLS LAST, l.nome
      `
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

exports.obterLocalPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const localResult = await db.query(
      `
      SELECT
        l.id,
        l.osm_id,
        l.nome,
        l.endereco,
        l.latitude,
        l.longitude,
        c.codigo AS categoria_codigo,
        c.nome AS categoria_nome,
        ROUND(AVG(a.nota_final), 2) AS media_geral,
        COUNT(a.id) AS total_avaliacoes
      FROM locais l
      INNER JOIN categorias c
        ON c.id = l.categoria_id
      LEFT JOIN avaliacoes a
        ON a.local_id = l.id
      WHERE l.id = $1
      GROUP BY
        l.id,
        c.codigo,
        c.nome
      `,
      [id]
    );

    if (localResult.rows.length === 0) {
      return res.status(404).json({
        erro: 'Local não encontrado'
      });
    }

    const mediasCriterios = await db.query(
      `
      SELECT
        c.codigo,
        c.nome,
        ROUND(AVG(ac.nota), 2) AS media
      FROM avaliacoes a
      INNER JOIN avaliacao_criterios ac
        ON ac.avaliacao_id = a.id
      INNER JOIN criterios c
        ON c.id = ac.criterio_id
      WHERE a.local_id = $1
      GROUP BY c.codigo, c.nome
      ORDER BY c.nome
      `,
      [id]
    );

    const avaliacoes = await db.query(
      `
      SELECT
        a.id,
        a.usuario_id,
        u.nome AS usuario_nome,
        TO_CHAR(a.horario_funcionamento_inicio, 'HH24:MI') AS horario_abertura,
        TO_CHAR(a.horario_funcionamento_final, 'HH24:MI') AS horario_fechamento,
        a.descricao,
        a.nota_final,
        a.criado_em,

        COALESCE(
          json_object_agg(
            c.codigo,
            co.valor
          ) FILTER (WHERE c.codigo IS NOT NULL),
          '{}'::json
        ) AS criterios

      FROM avaliacoes a
      INNER JOIN usuarios u
        ON u.id = a.usuario_id

      LEFT JOIN avaliacao_criterios ac
        ON ac.avaliacao_id = a.id

      LEFT JOIN criterios c
        ON c.id = ac.criterio_id

      LEFT JOIN criterio_opcoes co
        ON co.id = ac.criterio_opcao_id

      WHERE a.local_id = $1

      GROUP BY
        a.id,
        a.usuario_id,
        u.nome,
        a.horario_funcionamento_inicio,
        a.horario_funcionamento_final,
        a.descricao,
        a.nota_final,
        a.criado_em

      ORDER BY a.criado_em DESC
      `,
      [id]
    );

    return res.json({
      local: localResult.rows[0],
      medias_criterios: mediasCriterios.rows,
      avaliacoes: avaliacoes.rows
    });
  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

exports.criarAvaliacaoParaLocal = async (req, res) => {
  const client = await db.connect();

  try {
    const usuarioId = req.userId;
    const localId = req.params.id;

    const {
      avaliacao,
      criterios
    } = req.body;

    if (!avaliacao || !criterios) {
      return res.status(400).json({
        erro: 'Dados da avaliação e critérios são obrigatórios'
      });
    }

    const {
      horario_funcionamento_inicio,
      horario_funcionamento_final,
      descricao
    } = avaliacao;

    await client.query('BEGIN');

    // Verifica se o local existe
    const localResult = await client.query(
      `
      SELECT id
      FROM locais
      WHERE id = $1
      `,
      [localId]
    );

    if (localResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        erro: 'Local não encontrado'
      });
    }

    // Cria a avaliação principal
    const avaliacaoResult = await client.query(
      `
      INSERT INTO avaliacoes (
        usuario_id,
        local_id,
        horario_funcionamento_inicio,
        horario_funcionamento_final,
        descricao
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        usuarioId,
        localId,
        horario_funcionamento_inicio || null,
        horario_funcionamento_final || null,
        descricao || null
      ]
    );

    const avaliacaoId = avaliacaoResult.rows[0].id;

    const criteriosObrigatorios = [
      'faixa-preco',
      'pontos-energia',
      'internet',
      'banheiro',
      'acessibilidade',
      'refeicao'
    ];

    for (const codigoCriterio of criteriosObrigatorios) {
      const valorOpcao = criterios[codigoCriterio];

      if (!valorOpcao) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          erro: `Critério obrigatório não informado: ${codigoCriterio}`
        });
      }

      const opcaoResult = await client.query(
        `
        SELECT
          c.id AS criterio_id,
          co.id AS criterio_opcao_id,
          co.nota
        FROM criterios c
        INNER JOIN criterio_opcoes co
          ON co.criterio_id = c.id
        WHERE c.codigo = $1
          AND co.valor = $2
          AND c.ativo = TRUE
          AND co.ativo = TRUE
        `,
        [codigoCriterio, valorOpcao]
      );

      if (opcaoResult.rows.length === 0) {
        await client.query('ROLLBACK');

        return res.status(400).json({
          erro: `Opção inválida para o critério: ${codigoCriterio}`
        });
      }

      const opcao = opcaoResult.rows[0];

      await client.query(
        `
        INSERT INTO avaliacao_criterios (
          avaliacao_id,
          criterio_id,
          criterio_opcao_id,
          nota
        )
        VALUES ($1, $2, $3, $4)
        `,
        [
          avaliacaoId,
          opcao.criterio_id,
          opcao.criterio_opcao_id,
          opcao.nota
        ]
      );
    }

    // Calcula a nota final da avaliação
    const mediaResult = await client.query(
      `
      SELECT ROUND(AVG(nota), 2) AS nota_final
      FROM avaliacao_criterios
      WHERE avaliacao_id = $1
      `,
      [avaliacaoId]
    );

    const notaFinal = mediaResult.rows[0].nota_final;

    await client.query(
      `
      UPDATE avaliacoes
      SET nota_final = $1,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [notaFinal, avaliacaoId]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      mensagem: 'Avaliação cadastrada com sucesso',
      avaliacao_id: avaliacaoId,
      local_id: localId,
      nota_final: notaFinal
    });

  } catch (error) {
    await client.query('ROLLBACK');

    return res.status(500).json({
      erro: error.message
    });

  } finally {
    client.release();
  }
};
