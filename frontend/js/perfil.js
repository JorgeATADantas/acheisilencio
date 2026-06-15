// js/perfil.js

const formPerfil = document.getElementById('form-perfil');
const mensagemPerfil = document.getElementById('mensagem-perfil');
const menuUsuario = document.getElementById('menu-usuario');

function carregarMenu() {
  if (estaLogado()) {
    const usuario = getUsuario();
    menuUsuario.innerHTML = `
      <span>Olá, ${usuario.nome}</span>
      <a href="./index.html">Início</a>
      <a href="./favoritos.html">Favoritos</a>
      <a href="./perfil.html">Meu Perfil</a>
      <button type="button" onclick="logout()">Sair</button>
    `;
  }
}

const inputNome = document.getElementById('nome');
const inputEmail = document.getElementById('email');
const inputSenhaAtual = document.getElementById('senha-atual');
const inputNovaSenha = document.getElementById('nova-senha');

const totalAvaliacoes = document.getElementById('total-avaliacoes');
const totalFavoritos = document.getElementById('total-favoritos');
const mediaAvaliacoes = document.getElementById('media-avaliacoes');

const divMinhasAvaliacoes = document.getElementById('minhas-avaliacoes');

function protegerPagina() {
  if (!estaLogado()) {
    window.location.href = 'login.html';
  }
}

async function carregarPerfil() {
  try {
    const resposta = await fetch(`${API_URL}/perfil`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao carregar perfil');
      logout();
      return;
    }

    inputNome.value = dados.usuario.nome;
    inputEmail.value = dados.usuario.email;

  } catch (error) {
    alert('Erro ao conectar com o servidor');
  }
}

async function atualizarPerfil(event) {
  event.preventDefault();

  const nome = inputNome.value.trim();
  const email = inputEmail.value.trim();
  const senhaAtual = inputSenhaAtual.value;
  const novaSenha = inputNovaSenha.value;

  try {
    const resposta = await fetch(`${API_URL}/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        nome,
        email,
        senha_atual: senhaAtual || null,
        nova_senha: novaSenha || null
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      mensagemPerfil.textContent = dados.erro || 'Erro ao atualizar perfil';
      mensagemPerfil.className = 'erro';
      return;
    }

    // Atualiza o usuário salvo no localStorage
    localStorage.setItem('usuario', JSON.stringify(dados.usuario));

    inputSenhaAtual.value = '';
    inputNovaSenha.value = '';

    mensagemPerfil.textContent = 'Perfil atualizado com sucesso';
    mensagemPerfil.className = 'sucesso';

  } catch (error) {
    mensagemPerfil.textContent = 'Erro ao conectar com o servidor';
    mensagemPerfil.className = 'erro';
  }
}

async function carregarEstatisticas() {
  try {
    const resposta = await fetch(`${API_URL}/perfil/estatisticas`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      return;
    }

    totalAvaliacoes.textContent = dados.estatisticas.total_avaliacoes || 0;
    totalFavoritos.textContent = dados.estatisticas.total_favoritos || 0;
    mediaAvaliacoes.textContent = dados.estatisticas.media_avaliacoes || '--';

  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

async function carregarMinhasAvaliacoes() {
  try {
    const resposta = await fetch(`${API_URL}/perfil/avaliacoes`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const avaliacoes = await resposta.json();

    if (!resposta.ok) {
      divMinhasAvaliacoes.innerHTML = '<p class="erro">Erro ao carregar avaliações.</p>';
      return;
    }

    if (avaliacoes.length === 0) {
      divMinhasAvaliacoes.innerHTML = '<p>Você ainda não fez avaliações.</p>';
      return;
    }

    divMinhasAvaliacoes.innerHTML = '';

    avaliacoes.forEach((avaliacao) => {
      const card = document.createElement('div');
      card.className = 'avaliacao-card';

card.innerHTML = `
  ${botaoFavoritoHtml(avaliacao.local_id, 'direita')}

  <h3>${avaliacao.local_nome}</h3>
  <p><strong>Categoria:</strong> ${avaliacao.categoria_nome}</p>
  <p><strong>Endereço:</strong> ${avaliacao.endereco}</p>
  <p><strong>Nota:</strong> ${avaliacao.nota_final}</p>
  <p><strong>Horário:</strong> ${avaliacao.horario_abertura || '--'} até ${avaliacao.horario_fechamento || '--'}</p>
  <p><strong>Comentário:</strong> ${avaliacao.descricao || 'Sem descrição'}</p>

  <div class="acoes-avaliacao">
    <a href="local.html?id=${avaliacao.local_id}" class="link-ver-local">Ver local</a>
    <a href="#" class="link-excluir" onclick="excluirAvaliacaoPerfil(${avaliacao.avaliacao_id}); return false;">Excluir avaliação</a>
  </div>
`;

      divMinhasAvaliacoes.appendChild(card);
    });

  } catch (error) {
    divMinhasAvaliacoes.innerHTML = '<p class="erro">Erro ao conectar com o servidor.</p>';
  }
}


async function excluirAvaliacaoPerfil(avaliacaoId) {
  const confirmar = confirm('Deseja excluir esta avaliação?');

  if (!confirmar) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/avaliacoes/${avaliacaoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao excluir avaliação');
      return;
    }

    alert('Avaliação excluída com sucesso');

    carregarEstatisticas();
    carregarMinhasAvaliacoes();
    carregarFavoritos();

  } catch (error) {
    alert('Erro ao conectar com o servidor');
  }
}


formPerfil.addEventListener('submit', atualizarPerfil);

window.addEventListener('favoritosAtualizados', () => {
  carregarEstatisticas();
  carregarMinhasAvaliacoes();
});

async function iniciarPaginaPerfil() {
  protegerPagina();
  carregarMenu();

  await carregarFavoritosUsuario();

  carregarPerfil();
  carregarEstatisticas();
  carregarMinhasAvaliacoes();
}

iniciarPaginaPerfil();