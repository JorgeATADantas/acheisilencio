// js/favoritos-page.js

const listaFavoritos = document.getElementById('lista-favoritos');
const menuUsuario = document.getElementById('menu-usuario');

function protegerPagina() {
  if (!estaLogado()) {
    window.location.href = 'login.html';
  }
}

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
  } else {
    menuUsuario.innerHTML = `
      <a href="./index.html">Início</a>
      <a href="./login.html">Entrar</a>
      <a href="./cadastro.html">Cadastrar</a>
    `;
  }
}

async function carregarPaginaFavoritos() {
  try {
    const resposta = await fetch(`${API_URL}/perfil/favoritos`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const favoritos = await resposta.json();

    if (!resposta.ok) {
      listaFavoritos.innerHTML = '<p class="erro">Erro ao carregar favoritos.</p>';
      return;
    }

    if (favoritos.length === 0) {
      listaFavoritos.innerHTML = '<p>Você ainda não tem locais favoritos.</p>';
      return;
    }

    listaFavoritos.innerHTML = '';

    favoritos.forEach((fav) => {
      const card = document.createElement('div');
      card.className = 'local-card';
      card.id = `favorito-card-${fav.local_id}`;

      card.innerHTML = `
        ${botaoFavoritoHtml(fav.local_id, 'direita')}
        <h3>${fav.nome}</h3>
        <p><strong>Categoria:</strong> ${fav.categoria_nome}</p>
        <p><strong>Endereço:</strong> ${fav.endereco}</p>
        <p><strong>Nota média:</strong> ${fav.media_geral || '--'}</p>
        <p><strong>Avaliações:</strong> ${fav.total_avaliacoes}</p>
        <div class="acoes-avaliacao">
          <a href="local.html?id=${fav.local_id}" class="link-ver-local">Ver local</a>
        </div>
      `;

      listaFavoritos.appendChild(card);
    });

  } catch (error) {
    listaFavoritos.innerHTML = '<p class="erro">Erro ao conectar com o servidor.</p>';
  }
}

// Quando o usuário desfavorita, remove o card da página
window.addEventListener('favoritosAtualizados', (event) => {
  const { localId, favoritado } = event.detail;

  if (!favoritado) {
    const card = document.getElementById(`favorito-card-${localId}`);
    if (card) {
      card.remove();
    }

    // Verifica se ficou vazio
    if (listaFavoritos.children.length === 0) {
      listaFavoritos.innerHTML = '<p>Você ainda não tem locais favoritos.</p>';
    }
  }
});

async function iniciarPaginaFavoritos() {
  protegerPagina();
  carregarMenu();
  await carregarFavoritosUsuario();
  carregarPaginaFavoritos();
}

iniciarPaginaFavoritos();
