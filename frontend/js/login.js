// js/login.js

const formLogin = document.getElementById('form-login');
const mensagem = document.getElementById('mensagem');

formLogin.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const resposta = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        senha
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mensagem.textContent = dados.erro || 'Erro ao fazer login';
      mensagem.className = 'erro';
      return;
    }

    // Salva o token no navegador
    localStorage.setItem('token', dados.token);

    // Salva alguns dados do usuário logado
    localStorage.setItem('usuario', JSON.stringify(dados.usuario));

    mensagem.textContent = 'Login realizado com sucesso!';
    mensagem.className = 'sucesso';

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);

  } catch (error) {
    mensagem.textContent = 'Erro ao conectar com o servidor';
    mensagem.className = 'erro';
  }
});