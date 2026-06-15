// js/favoritos.js

// Guarda os IDs dos locais favoritos do usuário logado
let favoritosUsuario = new Set();

// Carrega os favoritos do usuário logado
async function carregarFavoritosUsuario() {
  favoritosUsuario = new Set();

  if (!estaLogado()) {
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/perfil/favoritos`, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const favoritos = await resposta.json();

    if (!resposta.ok) {
      console.error('Erro ao carregar favoritos:', favoritos);
      return;
    }

    favoritos.forEach((favorito) => {
      favoritosUsuario.add(Number(favorito.local_id));
    });

  } catch (error) {
    console.error('Erro ao carregar favoritos:', error);
  }
}

// Verifica se um local está favoritado
function localFavoritado(localId) {
  return favoritosUsuario.has(Number(localId));
}

// Gera o HTML do coração
// posicao pode ser: 'direita' ou 'esquerda'
function botaoFavoritoHtml(localId, posicao = 'direita') {
  if (!estaLogado()) {
    return '';
  }

  const favoritado = localFavoritado(localId);

  const classePosicao =
    posicao === 'esquerda'
      ? 'favorito-esquerda'
      : 'favorito-direita';

  return `
    <button
      type="button"
      class="botao-favorito-card ${classePosicao} ${favoritado ? 'favoritado' : ''}"
      data-local-id="${localId}"
      onclick="alternarFavoritoCard(${localId})"
      title="${favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
    >
      ${favoritado ? '♥' : '♡'}
    </button>
  `;
}

// Alterna favorito ao clicar no coração
async function alternarFavoritoCard(localId) {
  if (!estaLogado()) {
    alert('Você precisa estar logado para favoritar locais.');
    return;
  }

  const jaFavoritado = localFavoritado(localId);
  const metodo = jaFavoritado ? 'DELETE' : 'POST';

  try {
    const resposta = await fetch(`${API_URL}/perfil/favoritos/${localId}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao atualizar favorito.');
      return;
    }

    if (jaFavoritado) {
      favoritosUsuario.delete(Number(localId));
    } else {
      favoritosUsuario.add(Number(localId));
    }

    atualizarBotoesFavoritoDoLocal(localId);

    window.dispatchEvent(new CustomEvent('favoritosAtualizados', {
      detail: {
        localId,
        favoritado: !jaFavoritado
      }
    }));

  } catch (error) {
    alert('Erro ao conectar com o servidor.');
  }
}

// Atualiza todos os corações daquele local na tela atual
function atualizarBotoesFavoritoDoLocal(localId) {
  const botoes = document.querySelectorAll(
    `.botao-favorito-card[data-local-id="${localId}"]`
  );

  const favoritado = localFavoritado(localId);

  botoes.forEach((botao) => {
    botao.textContent = favoritado ? '♥' : '♡';

    botao.title = favoritado
      ? 'Remover dos favoritos'
      : 'Adicionar aos favoritos';

    if (favoritado) {
      botao.classList.add('favoritado');
    } else {
      botao.classList.remove('favoritado');
    }
  });
}