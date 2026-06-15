/*Arquivo para executar a seguinte lógica:
    - recebem os dados da rota
    - validam informações
    - consultam o banco
    - retornam resposta para o frontend
Ele fará:
    - criar avaliação
    - cadastrar local se ainda não existir
    - salvar critérios escolhidos
    - calcular nota final
    - excluir avaliação própria
 
src/controllers/avaliacaoController.js

*/

const db = require('../database/db');

exports.criarAvaliacao = async (req, res) => {
  const client = await db.connect();

  try {
    const usuarioId = req.userId;

    const {
      local,
      avaliacao,
      criterios
    } = req.body;

    if (!local || !avaliacao || !criterios) {
      return res.status(400).json({
        erro: 'Dados do local, avaliação e critérios são obrigatórios'
      });
    }

    const {
      osm_id,
      nome,
      categoria_codigo,
      endereco,
      latitude,
      longitude
    } = local;

    const {
      horario_funcionamento_inicio,
      horario_funcionamento_final,
      descricao
    } = avaliacao;

    if (!nome || !categoria_codigo || !endereco) {
      return res.status(400).json({
        erro: 'Nome, categoria e endereço do local são obrigatórios'
      });
    }

    await client.query('BEGIN');

    const categoriaResult = await client.query(
      `
      SELECT id
      FROM categorias
      WHERE codigo = $1
        AND ativo = TRUE
      `,
      [categoria_codigo]
    );

    if (categoriaResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        erro: 'Categoria inválida'
      });
    }

    const categoriaId = categoriaResult.rows[0].id;

    let localId;

    if (osm_id) {
      const localResult = await client.query(
        `
        INSERT INTO locais (
          osm_id,
          nome,
          categoria_id,
          endereco,
          latitude,
          longitude
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (osm_id)
        DO UPDATE SET
          nome = EXCLUDED.nome,
          categoria_id = EXCLUDED.categoria_id,
          endereco = EXCLUDED.endereco,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude
        RETURNING id
        `,
        [
          osm_id,
          nome,
          categoriaId,
          endereco,
          latitude || null,
          longitude || null
        ]
      );

      localId = localResult.rows[0].id;
    } else {
      const localExistente = await client.query(
        `
        SELECT id
        FROM locais
        WHERE LOWER(nome) = LOWER($1)
          AND LOWER(endereco) = LOWER($2)
        LIMIT 1
        `,
        [nome, endereco]
      );

      if (localExistente.rows.length > 0) {
        localId = localExistente.rows[0].id;
      } else {
        const localResult = await client.query(
          `
          INSERT INTO locais (
            nome,
            categoria_id,
            endereco,
            latitude,
            longitude
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
          `,
          [
            nome,
            categoriaId,
            endereco,
            latitude || null,
            longitude || null
          ]
        );

        localId = localResult.rows[0].id;
      }
    }

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

exports.editarAvaliacao = async (req, res) => {
  const client = await db.connect();

  try {
    const usuarioId = req.userId;
    const avaliacaoId = req.params.id;

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

    // Verifica se a avaliação existe e pertence ao usuário logado
    const avaliacaoExistente = await client.query(
      `
      SELECT id
      FROM avaliacoes
      WHERE id = $1
        AND usuario_id = $2
      `,
      [avaliacaoId, usuarioId]
    );

    if (avaliacaoExistente.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        erro: 'Avaliação não encontrada ou você não tem permissão para editá-la'
      });
    }

    // Atualiza os dados principais da avaliação
    await client.query(
      `
      UPDATE avaliacoes
      SET
        horario_funcionamento_inicio = $1,
        horario_funcionamento_final = $2,
        descricao = $3,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $4
        AND usuario_id = $5
      `,
      [
        horario_funcionamento_inicio || null,
        horario_funcionamento_final || null,
        descricao || null,
        avaliacaoId,
        usuarioId
      ]
    );

    // Remove as respostas antigas dos critérios
    await client.query(
      `
      DELETE FROM avaliacao_criterios
      WHERE avaliacao_id = $1
      `,
      [avaliacaoId]
    );

    const criteriosObrigatorios = [
      'faixa-preco',
      'pontos-energia',
      'internet',
      'banheiro',
      'acessibilidade',
      'refeicao'
    ];

    // Insere novamente os critérios atualizados
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

    // Recalcula a nota final
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

    return res.json({
      mensagem: 'Avaliação editada com sucesso',
      avaliacao_id: avaliacaoId,
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

exports.deletarAvaliacao = async (req, res) => {
  const client = await db.connect();

  try {
    const usuarioId = req.userId;
    const { id } = req.params;

    await client.query('BEGIN');

    // Exclui apenas se a avaliação pertencer ao usuário logado
    // Também retorna o local_id para verificarmos se o local ficou sem avaliações
    const deleteResult = await client.query(
      `
      DELETE FROM avaliacoes
      WHERE id = $1
        AND usuario_id = $2
      RETURNING id, local_id
      `,
      [id, usuarioId]
    );

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        erro: 'Avaliação não encontrada ou você não tem permissão para excluí-la'
      });
    }

    const localId = deleteResult.rows[0].local_id;

    // Verifica se ainda existem avaliações para esse local
    const countResult = await client.query(
      `
      SELECT COUNT(*) AS total
      FROM avaliacoes
      WHERE local_id = $1
      `,
      [localId]
    );

    const totalAvaliacoes = Number(countResult.rows[0].total);

    let localRemovido = false;

    // Se não existir mais nenhuma avaliação, remove o local também
    if (totalAvaliacoes === 0) {
      await client.query(
        `
        DELETE FROM locais
        WHERE id = $1
        `,
        [localId]
      );

      localRemovido = true;
    }

    await client.query('COMMIT');

    return res.json({
      mensagem: 'Avaliação excluída com sucesso',
      local_removido: localRemovido
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