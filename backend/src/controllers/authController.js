/*Arquivo para executar a seguinte lógica:
    - recebem os dados da rota
    - validam informações
    - consultam o banco
    - retornam resposta para o frontend
Ele fará:
    - cadastrar usuário
    - fazer login
    - retornar dados do usuário logado
 
    src/controllers/authController.js
 
*/

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const db = require('../database/db');

// Cria usuário novo
exports.register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: 'Nome, email e senha são obrigatórios'
      });
    }

    const usuarioExistente = await db.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(400).json({
        erro: 'Este email já está cadastrado'
      });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await db.query(
      `
      INSERT INTO usuarios (nome, email, senha_hash)
      VALUES ($1, $2, $3)
      RETURNING id, nome, email, criado_em
      `,
      [nome, email, senhaHash]
    );

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso',
      usuario: result.rows[0]
    });
  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

//Verifica e-mail e senha e gera token JWT
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: 'Email e senha são obrigatórios'
      });
    }

    const result = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      });
    }

    const usuario = result.rows[0];

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({
        erro: 'Email ou senha inválidos'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    return res.json({
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email
      }
    });
  } catch (error) {
    return res.status(500).json({
      erro: error.message
    });
  }
};

// retorna os dados do usuário logado
exports.me = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT id, nome, email, criado_em
      FROM usuarios
      WHERE id = $1
      `,
      [req.userId]
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