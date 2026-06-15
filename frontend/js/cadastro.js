// js/cadastro.js

// Busca o formulário pelo ID
const formCadastro = document.getElementById('form-cadastro');

// Busca o elemento onde vamos mostrar mensagens
const mensagem = document.getElementById('mensagem');

// Escuta o envio do formulário
formCadastro.addEventListener('submit', async (event) => {
  // Impede o recarregamento padrão da página
  event.preventDefault();

  // Pega os valores digitados pelo usuário
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    // Envia uma requisição POST para o backend cadastrar o usuário
    const resposta = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome,
        email,
        senha
      })
    });

    // Converte a resposta para JSON
    const dados = await resposta.json();

    // Se a resposta não for OK, mostra erro
    if (!resposta.ok) {
      mensagem.textContent = dados.erro || 'Erro ao cadastrar usuário';
      mensagem.className = 'erro';
      return;
    }

    // Mostra mensagem de sucesso
    mensagem.textContent = 'Cadastro realizado com sucesso. Redirecionando para login...';
    mensagem.className = 'sucesso';

    // Aguarda 1 segundo e manda para a tela de login
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);

  } catch (error) {
    mensagem.textContent = 'Erro ao conectar com o servidor';
    mensagem.className = 'erro';
  }
});