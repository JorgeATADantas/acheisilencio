// js/local.js

const detalhesLocal = document.getElementById('detalhes-local');
const areaAvaliarLocal = document.getElementById('area-avaliar-local');
const formAvaliarLocal = document.getElementById('form-avaliar-local');
const mensagemAvaliacao = document.getElementById('mensagem-avaliacao');
const notaPreview = document.getElementById('nota-preview');

const inputAvaliacaoEditandoId = document.getElementById('avaliacao-editando-id');
const btnSalvarAvaliacao = document.getElementById('btn-salvar-avaliacao');
const btnCancelarEdicao = document.getElementById('btn-cancelar-edicao');

const params = new URLSearchParams(window.location.search);
const localId = params.get('id');

const menuUsuario = document.getElementById('menu-usuario');

const criteriosAvaliacao = [
  'faixa-preco',
  'pontos-energia',
  'internet',
  'banheiro',
  'acessibilidade',
  'refeicao'
];

function carregarMenuLocal() {
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

function controlarAreaAvaliacao() {
  if (estaLogado()) {
    areaAvaliarLocal.style.display = 'block';
  } else {
    areaAvaliarLocal.style.display = 'none';
  }

  btnCancelarEdicao.style.display = 'none';
}

async function carregarDetalhesLocal() {
  if (!localId) {
    detalhesLocal.innerHTML = '<p class="erro">Local não informado.</p>';
    return;
  }

  try {
    const resposta = await fetch(`${API_URL}/locais/${localId}?t=${Date.now()}`);
    const dados = await resposta.json();

    if (!resposta.ok) {
      detalhesLocal.innerHTML = `<p class="erro">${dados.erro || 'Erro ao carregar local.'}</p>`;
      areaAvaliarLocal.style.display = 'none';
      return;
    }

    const local = dados.local;
    const medias = dados.medias_criterios || [];
    const avaliacoes = dados.avaliacoes || [];

    detalhesLocal.innerHTML = `
      ${botaoFavoritoHtml(local.id, 'direita')}

      <h2>${local.nome}</h2>
      <p><strong>Categoria:</strong> ${local.categoria_nome}</p>
      <p><strong>Endereço:</strong> ${local.endereco}</p>
      <p><strong>Média geral:</strong> ${local.media_geral || 'Sem nota'}</p>
      <p><strong>Total de avaliações:</strong> ${local.total_avaliacoes}</p>

      <hr>

      <h3>Média por critério</h3>
      <div id="medias-criterios"></div>

      <hr>

      <h3>Avaliações dos usuários</h3>
      <div id="lista-avaliacoes"></div>
    `;

    renderizarMedias(medias);
    renderizarAvaliacoes(avaliacoes);

  } catch (error) {
    console.error('Erro em carregarDetalhesLocal:', error);

    detalhesLocal.innerHTML = `
      <p class="erro">Erro ao carregar detalhes do local.</p>
      <p>Abra o console do navegador para ver o erro técnico.</p>
    `;
  }
}

function renderizarMedias(medias) {
  const divMedias = document.getElementById('medias-criterios');

  if (medias.length === 0) {
    divMedias.innerHTML = '<p>Nenhuma média por critério disponível.</p>';
    return;
  }

  divMedias.innerHTML = '';

  medias.forEach((item) => {
    const p = document.createElement('p');

    p.innerHTML = `
      <strong>${item.nome}:</strong> ${item.media}
    `;

    divMedias.appendChild(p);
  });
}

function renderizarAvaliacoes(avaliacoes) {
  const divAvaliacoes = document.getElementById('lista-avaliacoes');
  const usuario = getUsuario();

  if (avaliacoes.length === 0) {
    divAvaliacoes.innerHTML = '<p>Nenhuma avaliação cadastrada.</p>';
    return;
  }

  divAvaliacoes.innerHTML = '';

  avaliacoes.forEach((avaliacao) => {
    const card = document.createElement('div');
    card.className = 'avaliacao-card';

    const podeAlterar =
      usuario && Number(usuario.id) === Number(avaliacao.usuario_id);

    card.innerHTML = `
      <p><strong>Usuário:</strong> ${avaliacao.usuario_nome}</p>
      <p><strong>Nota:</strong> ${avaliacao.nota_final}</p>
      <p><strong>Horário:</strong> ${avaliacao.horario_abertura || '--'} até ${avaliacao.horario_fechamento || '--'}</p>
      <p><strong>Comentário:</strong> ${avaliacao.descricao || 'Sem descrição'}</p>

      ${
        podeAlterar
          ? `
            <button type="button" onclick='prepararEdicaoAvaliacao(${JSON.stringify(avaliacao)})'>
              Editar minha avaliação
            </button>

            <button type="button" onclick="excluirAvaliacao(${avaliacao.id})" class="botao-perigo">
              Excluir minha avaliação
            </button>
          `
          : ''
      }
    `;

    divAvaliacoes.appendChild(card);
  });
}

async function carregarCriterios() {
  try {
    const resposta = await fetch(`${API_URL}/criterios`);
    const criterios = await resposta.json();

    criterios.forEach((criterio) => {
      const select = document.getElementById(criterio.codigo);

      if (!select) {
        return;
      }

      select.innerHTML = `
        <option value="" selected disabled hidden>Selecione uma opção</option>
      `;

      criterio.opcoes.forEach((opcao) => {
        const option = document.createElement('option');

        option.value = opcao.valor;
        option.textContent = opcao.descricao;
        option.dataset.nota = opcao.nota;

        select.appendChild(option);
      });
    });

  } catch (error) {
    console.error('Erro ao carregar critérios:', error);
  }
}

function calcularNotaPreview() {
  let soma = 0;
  let quantidadeSelecionada = 0;

  criteriosAvaliacao.forEach((criterioId) => {
    const select = document.getElementById(criterioId);

    if (!select) {
      return;
    }

    const optionSelecionada = select.options[select.selectedIndex];

    if (!optionSelecionada || optionSelecionada.value === '') {
      return;
    }

    const nota = Number(optionSelecionada.dataset.nota);

    if (!Number.isNaN(nota)) {
      soma += nota;
      quantidadeSelecionada++;
    }
  });

  if (quantidadeSelecionada === 0) {
    notaPreview.textContent = '--';
    return;
  }

  const media = soma / quantidadeSelecionada;

  notaPreview.textContent = media.toFixed(2);

  if (quantidadeSelecionada < criteriosAvaliacao.length) {
    notaPreview.textContent += ' parcial';
  }
}

function ativarCalculoAutomatico() {
  criteriosAvaliacao.forEach((criterioId) => {
    const select = document.getElementById(criterioId);

    if (select) {
      select.addEventListener('change', calcularNotaPreview);
    }
  });
}

// Preenche o formulário com os dados da avaliação existente
function prepararEdicaoAvaliacao(avaliacao) {
  inputAvaliacaoEditandoId.value = avaliacao.id;

  document.getElementById('horario-abertura').value = avaliacao.horario_abertura || '';
  document.getElementById('horario-fechamento').value = avaliacao.horario_fechamento || '';
  document.getElementById('descricao').value = avaliacao.descricao || '';

  criteriosAvaliacao.forEach((criterioId) => {
    const select = document.getElementById(criterioId);

    if (select && avaliacao.criterios && avaliacao.criterios[criterioId]) {
      select.value = avaliacao.criterios[criterioId];
    }
  });

  btnSalvarAvaliacao.textContent = 'Salvar alterações';
  btnCancelarEdicao.style.display = 'inline-block';

  mensagemAvaliacao.textContent = 'Editando avaliação selecionada.';
  mensagemAvaliacao.className = 'sucesso';

  calcularNotaPreview();

  areaAvaliarLocal.scrollIntoView({
    behavior: 'smooth'
  });
}

function cancelarEdicao() {
  inputAvaliacaoEditandoId.value = '';

  formAvaliarLocal.reset();

  btnSalvarAvaliacao.textContent = 'Salvar avaliação';
  btnCancelarEdicao.style.display = 'none';

  mensagemAvaliacao.textContent = '';
  mensagemAvaliacao.className = '';

  calcularNotaPreview();
}

btnCancelarEdicao.addEventListener('click', cancelarEdicao);

formAvaliarLocal.addEventListener('submit', async (event) => {
  event.preventDefault();

  const token = getToken();

  if (!token) {
    mensagemAvaliacao.textContent = 'Você precisa estar logado para avaliar.';
    mensagemAvaliacao.className = 'erro';
    return;
  }

  const avaliacaoEditandoId = inputAvaliacaoEditandoId.value;

  const dados = {
    avaliacao: {
      horario_funcionamento_inicio: document.getElementById('horario-abertura').value,
      horario_funcionamento_final: document.getElementById('horario-fechamento').value,
      descricao: document.getElementById('descricao').value
    },
    criterios: {
      'faixa-preco': document.getElementById('faixa-preco').value,
      'pontos-energia': document.getElementById('pontos-energia').value,
      internet: document.getElementById('internet').value,
      banheiro: document.getElementById('banheiro').value,
      acessibilidade: document.getElementById('acessibilidade').value,
      refeicao: document.getElementById('refeicao').value
    }
  };

  try {
    let url = `${API_URL}/locais/${localId}/avaliacoes`;
    let metodo = 'POST';

    // Se existir ID no campo oculto, estamos editando
    if (avaliacaoEditandoId) {
      url = `${API_URL}/avaliacoes/${avaliacaoEditandoId}`;
      metodo = 'PUT';
    }

    const resposta = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
    mensagemAvaliacao.textContent = resultado.erro || 'Erro ao salvar avaliação.';
    mensagemAvaliacao.className = 'erro';
    return;
    }

    // Guarda a mensagem antes de limpar o formulário
    const mensagemSucesso = avaliacaoEditandoId
    ? `Avaliação editada com sucesso. Nova nota: ${resultado.nota_final}`
    : `Avaliação salva com sucesso. Nota final: ${resultado.nota_final}`;

    // Limpa o modo de edição e o formulário
    inputAvaliacaoEditandoId.value = '';
    formAvaliarLocal.reset();

    btnSalvarAvaliacao.textContent = 'Salvar avaliação';
    btnCancelarEdicao.style.display = 'none';

    calcularNotaPreview();

    // Recarrega os detalhes imediatamente para atualizar:
    // - nota da avaliação
    // - média geral
    // - média por critério
    // - lista de avaliações
    await carregarDetalhesLocal();

    // Mostra a mensagem depois do recarregamento
    mensagemAvaliacao.textContent = mensagemSucesso;
    mensagemAvaliacao.className = 'sucesso';

  } catch (error) {
    mensagemAvaliacao.textContent = 'Erro ao conectar com o servidor.';
    mensagemAvaliacao.className = 'erro';
  }
});

async function excluirAvaliacao(avaliacaoId) {
  const confirmar = confirm('Deseja excluir esta avaliação?');

  if (!confirmar) {
    return;
  }

  const token = getToken();

  try {
    const resposta = await fetch(`${API_URL}/avaliacoes/${avaliacaoId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || 'Erro ao excluir avaliação.');
      return;
    }

    alert('Avaliação excluída com sucesso.');

    if (dados.local_removido) {
      window.location.href = 'index.html';
      return;
    }

  } catch (error) {
    alert('Erro ao conectar com o servidor.');
  }
}

async function iniciarPaginaLocal() {
  carregarMenuLocal();

  controlarAreaAvaliacao();

  await carregarFavoritosUsuario();

  await carregarDetalhesLocal();

  carregarCriterios().then(() => {
    ativarCalculoAutomatico();
    calcularNotaPreview();
  });
}

iniciarPaginaLocal();