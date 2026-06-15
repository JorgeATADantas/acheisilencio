// src/controllers/perfilController.js

const bcrypt = require('bcrypt');
const db = require('../database/db');

// Busca os dados do usuário logado
exports.obterPerfil = async (req, res) => {
  try {
    const usuarioId = req.userId;

    const result = await db.query(
      `
      SELECT id, nome, email, criado_em
      FROM usuarios
      WHERE id = $1
      `,
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: 'Usuário não encontrado'
      });
    }

    return res.json({
      usuario: result.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// Atualiza nome, email e opcionalmente senha
exports.atualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.userId;

    const {
      nome,
      email,
      senha_atual,
      nova_senha
    } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        erro: 'Nome e email são obrigatórios'
      });
    }

    // Busca usuário atual
    const usuarioResult = await db.query(
      `
      SELECT *
      FROM usuarios
      WHERE id = $1
      `,
      [usuarioId]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({
        erro: 'Usuário não encontrado'
      });
    }

    const usuario = usuarioResult.rows[0];

    // Verifica se o novo email já pertence a outro usuário
    const emailResult = await db.query(
      `
      SELECT id
      FROM usuarios
      WHERE email = $1
        AND id <> $2
      `,
      [email, usuarioId]
    );

    if (emailResult.rows.length > 0) {
      return res.status(400).json({
        erro: 'Este email já está sendo usado por outro usuário'
      });
    }

    let senhaHash = usuario.senha_hash;

    // Se o usuário quiser trocar a senha
    if (nova_senha) {
      if (!senha_atual) {
        return res.status(400).json({
          erro: 'Informe a senha atual para alterar a senha'
        });
      }

      const senhaAtualValida = await bcrypt.compare(
        senha_atual,
        usuario.senha_hash
      );

      if (!senhaAtualValida) {
        return res.status(401).json({
          erro: 'Senha atual incorreta'
        });
      }

      senhaHash = await bcrypt.hash(nova_senha, 10);
    }

    const updateResult = await db.query(
      `
      UPDATE usuarios
      SET
        nome = $1,
        email = $2,
        senha_hash = $3
      WHERE id = $4
      RETURNING id, nome, email, criado_em
      `,
      [nome, email, senhaHash, usuarioId]
    );

    return res.json({
      mensagem: 'Perfil atualizado com sucesso',
      usuario: updateResult.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// Estatísticas do usuário logado
exports.obterEstatisticas = async (req, res) => {
  try {
    const usuarioId = req.userId;

    const result = await db.query(
      `
      SELECT
        COUNT(DISTINCT a.id) AS total_avaliacoes,
        COUNT(DISTINCT f.id) AS total_favoritos,
        ROUND(AVG(a.nota_final), 2) AS media_avaliacoes
      FROM usuarios u
      LEFT JOIN avaliacoes a
        ON a.usuario_id = u.id
      LEFT JOIN favoritos f
        ON f.usuario_id = u.id
      WHERE u.id = $1
      `,
      [usuarioId]
    );

    return res.json({
      estatisticas: result.rows[0]
    });

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// Lista avaliações feitas pelo usuário logado
exports.listarMinhasAvaliacoes = async (req, res) => {
  try {
    const usuarioId = req.userId;

    const result = await db.query(
      `
      SELECT
        a.id AS avaliacao_id,
        a.local_id,
        l.nome AS local_nome,
        l.endereco,
        c.nome AS categoria_nome,
        TO_CHAR(a.horario_funcionamento_inicio, 'HH24:MI') AS horario_abertura,
        TO_CHAR(a.horario_funcionamento_final, 'HH24:MI') AS horario_fechamento,
        a.descricao,
        a.nota_final,
        a.criado_em
      FROM avaliacoes a
      INNER JOIN locais l
        ON l.id = a.local_id
      INNER JOIN categorias c
        ON c.id = l.categoria_id
      WHERE a.usuario_id = $1
      ORDER BY a.criado_em DESC
      `,
      [usuarioId]
    );

    return res.json(result.rows);

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// Lista locais favoritos do usuário logado
exports.listarFavoritos = async (req, res) => {
  try {
    const usuarioId = req.userId;

    const result = await db.query(
      `
      SELECT
        f.id AS favorito_id,
        l.id AS local_id,
        l.nome,
        l.endereco,
        c.nome AS categoria_nome,
        ROUND(AVG(a.nota_final), 2) AS media_geral,
        COUNT(a.id) AS total_avaliacoes
      FROM favoritos f
      INNER JOIN locais l
        ON l.id = f.local_id
      INNER JOIN categorias c
        ON c.id = l.categoria_id
      LEFT JOIN avaliacoes a
        ON a.local_id = l.id
      WHERE f.usuario_id = $1
      GROUP BY
        f.id,
        l.id,
        l.nome,
        l.endereco,
        c.nome
      ORDER BY f.criado_em DESC
      `,
      [usuarioId]
    );

    return res.json(result.rows);

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// Adiciona local aos favoritos
exports.adicionarFavorito = async (req, res) => {
  try {
    const usuarioId = req.userId;
    const { localId } = req.params;

    const localResult = await db.query(
      `
      SELECT id
      FROM locais
      WHERE id = $1
      `,
      [localId]
    );

    if (localResult.rows.length === 0) {
      return res.status(404).json({
        erro: 'Local não encontrado'
      });
    }

    await db.query(
      `
      INSERT INTO favoritos (usuario_id, local_id)
      VALUES ($1, $2)
      ON CONFLICT (usuario_id, local_id)
      DO NOTHING
      `,
      [usuarioId, localId]
    );

    return res.json({
      mensagem: 'Local adicionado aos favoritos'
    });

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// Remove local dos favoritos
exports.removerFavorito = async (req, res) => {
  try {
    const usuarioId = req.userId;
    const { localId } = req.params;

    await db.query(
      `
      DELETE FROM favoritos
      WHERE usuario_id = $1
        AND local_id = $2
      `,
      [usuarioId, localId]
    );

    return res.json({
      mensagem: 'Local removido dos favoritos'
    });

  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};