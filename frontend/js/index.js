// js/index.js

const menuUsuario = document.getElementById('menu-usuario');
const areaAvaliacao = document.getElementById('area-avaliacao');
const formAvaliacao = document.getElementById('form-avaliacao');
const mensagemAvaliacao = document.getElementById('mensagem-avaliacao');
const notaPreview = document.getElementById('nota-preview');
const imagemLogo = document.getElementById('imagem-logo');


// Elementos da busca com mapa
const inputBuscaLocal = document.getElementById('busca-local');
const btnBuscarLocal = document.getElementById('btn-buscar-local');
const resultadosBusca = document.getElementById('resultados-busca');
const inputOsmId = document.getElementById('osm-id');
const inputLatitude = document.getElementById('latitude');
const inputLongitude = document.getElementById('longitude');
const btnMinhaLocalizacao = document.getElementById('btn-minha-localizacao');


// Monta o menu conforme o usuário esteja logado ou não
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

    // Usuário logado pode cadastrar avaliação
    areaAvaliacao.style.display = 'block';
    // Esconde a logo para usuário logado
    if (imagemLogo) imagemLogo.style.display = 'none';

  } else {
    menuUsuario.innerHTML = `
      <a href="./login.html">Entrar</a>
      <a href="./cadastro.html">Cadastrar</a>
    `;

    // Usuário não logado não pode cadastrar avaliação
    areaAvaliacao.style.display = 'none';
    // Mostra a logo para visitante
    if (imagemLogo) imagemLogo.style.display = 'block';
  }
}

// Carrega os locais avaliados
async function carregarLocais() {
  try {
    const resposta = await fetch(`${API_URL}/locais`);
    const locais = await resposta.json();

    if (locais.length === 0) {
      renderizarMarcadoresLocais([]);
      return;
    }

    // Desenha os locais avaliados no mapa
    renderizarMarcadoresLocais(locais);

  } catch (error) {
    console.error('Erro ao carregar locais:', error);
  }
}

// Carrega categorias vindas do backend
async function carregarCategorias() {
  const selectCategoria = document.getElementById('categoria');

  try {
    const resposta = await fetch(`${API_URL}/categorias`);
    const categorias = await resposta.json();

    categorias.forEach((categoria) => {
      const option = document.createElement('option');
      option.value = categoria.codigo;
      option.textContent = categoria.nome;
      selectCategoria.appendChild(option);
    });

  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  }
}

// Carrega critérios e opções vindos do backend
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

        // Valor enviado para o backend
        // Exemplo: boa-internet, gratuito, sem-banheiro
        option.value = opcao.valor;

        // Texto exibido no select
        option.textContent = opcao.descricao;

        // Guarda a nota da opção no próprio HTML
        // Isso permite calcular a nota antes de enviar ao backend
        option.dataset.nota = opcao.nota;

        select.appendChild(option);
        });
    });

  } catch (error) {
    console.error('Erro ao carregar critérios:', error);
  }
}

// Lista dos critérios que entram no cálculo da nota
const criteriosAvaliacao = [
  'faixa-preco',
  'pontos-energia',
  'internet',
  'banheiro',
  'acessibilidade',
  'refeicao'
];

// Calcula a nota da avaliação conforme o usuário seleciona as opções
function calcularNotaPreview() {
  let soma = 0;
  let quantidadeSelecionada = 0;

  criteriosAvaliacao.forEach((criterioId) => {
    const select = document.getElementById(criterioId);

    // Se o select não existir, ignora
    if (!select) {
      return;
    }

    // Pega a option selecionada
    const optionSelecionada = select.options[select.selectedIndex];

    // Se ainda não selecionou uma opção válida, ignora
    if (!optionSelecionada || optionSelecionada.value === '') {
      return;
    }

    // Pega a nota salva no data-nota
    const nota = Number(optionSelecionada.dataset.nota);

    // Se for uma nota válida, soma
    if (!Number.isNaN(nota)) {
      soma += nota;
      quantidadeSelecionada++;
    }
  });

  // Se nenhum critério foi selecionado ainda
  if (quantidadeSelecionada === 0) {
    notaPreview.textContent = '--';
    return;
  }

  // Calcula a média parcial ou final
  const media = soma / quantidadeSelecionada;

  // Mostra a nota com 2 casas decimais
  notaPreview.textContent = media.toFixed(2);

  // Enquanto nem todos os critérios foram preenchidos,
  // mostra que a nota ainda é parcial
  if (quantidadeSelecionada < criteriosAvaliacao.length) {
    notaPreview.textContent += ' parcial';
  }
}

// Ativa o cálculo automático sempre que algum critério mudar
function ativarCalculoAutomatico() {
  criteriosAvaliacao.forEach((criterioId) => {
    const select = document.getElementById(criterioId);

    if (select) {
      select.addEventListener('change', calcularNotaPreview);
    }
  });
}

// =======================================================
// MAPA COM LEAFLET E OPENSTREETMAP
// =======================================================

// Variável que guardará o mapa
let mapa;

// Marcador usado quando o usuário busca um local ou usa a localização atual
let marcadorAtual;

// Camada que guarda os marcadores dos locais já avaliados
let camadaMarcadoresLocais;

// Inicializa o mapa
function iniciarMapa() {
  // Coordenadas iniciais: Belo Horizonte
  const latitudeInicial = -19.9167;
  const longitudeInicial = -43.9345;

  // Cria o mapa dentro da div id="mapa"
  mapa = L.map('mapa').setView(
    [latitudeInicial, longitudeInicial],
    13
  );

  // Adiciona o mapa visual do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapa);

  // Cria uma camada separada para os marcadores dos locais avaliados
  camadaMarcadoresLocais = L.layerGroup().addTo(mapa);
}

function renderizarMarcadoresLocais(locais) {
  // Se o mapa ainda não existir, não faz nada
  if (!mapa || !camadaMarcadoresLocais) {
    return;
  }

  // Limpa os marcadores antigos antes de desenhar novamente
  camadaMarcadoresLocais.clearLayers();

  // Guarda coordenadas válidas para ajustar o zoom depois
  const coordenadasValidas = [];

  locais.forEach((local) => {
    // Alguns locais podem ter latitude/longitude nulos
    if (!local.latitude || !local.longitude) {
      return;
    }

    const latitude = Number(local.latitude);
    const longitude = Number(local.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    coordenadasValidas.push([latitude, longitude]);

    const media = local.media_geral || 'Sem nota';

    const popup = `
      <strong>${local.nome}</strong><br>
      <span>${local.categoria_nome}</span><br>
      <span>Nota média: ${media}</span><br>
      <span>${local.total_avaliacoes} avaliação(ões)</span><br>
      <a href="local.html?id=${local.id}">Ver detalhes</a>
    `;

    const marcador = L.marker([latitude, longitude])
      .bindPopup(popup);

    marcador.addTo(camadaMarcadoresLocais);
  });

  // Se existir pelo menos um local com coordenadas,
  // ajusta o mapa para mostrar todos eles
  if (coordenadasValidas.length > 0) {
    const bounds = L.latLngBounds(coordenadasValidas);

    mapa.fitBounds(bounds, {
      padding: [30, 30]
    });
  }
}

// Usa a localização atual do usuário no navegador
function usarMinhaLocalizacao() {
  // Verifica se o navegador suporta geolocalização
  if (!navigator.geolocation) {
    alert('Seu navegador não suporta geolocalização.');
    return;
  }

  btnMinhaLocalizacao.disabled = true;
  btnMinhaLocalizacao.textContent = '...';

  navigator.geolocation.getCurrentPosition(
    // Caso dê certo
    (posicao) => {
      const latitude = posicao.coords.latitude;
      const longitude = posicao.coords.longitude;

      // Move o mapa para a localização atual
      mapa.setView([latitude, longitude], 16);

      // Remove marcador antigo, caso exista
      if (marcadorAtual) {
        mapa.removeLayer(marcadorAtual);
      }

      // Adiciona marcador na localização atual
      marcadorAtual = L.marker([latitude, longitude])
        .addTo(mapa)
        .bindPopup('Você está aqui')
        .openPopup();

      // Preenche latitude e longitude nos campos ocultos
      inputLatitude.value = latitude;
      inputLongitude.value = longitude;

      // Como essa localização não veio do OpenStreetMap/Nominatim,
      // não temos osm_id.
      inputOsmId.value = '';

      resultadosBusca.innerHTML = `
        <p class="sucesso">
          Localização atual selecionada. Você pode preencher o nome e o endereço manualmente.
        </p>
      `;

      btnMinhaLocalizacao.disabled = false;
      btnMinhaLocalizacao.textContent = '🎯';
    },

    // Caso dê erro
    (erro) => {
      let mensagem = 'Não foi possível obter sua localização.';

      if (erro.code === 1) {
        mensagem = 'Permissão de localização negada pelo usuário.';
      }

      if (erro.code === 2) {
        mensagem = 'Localização indisponível no momento.';
      }

      if (erro.code === 3) {
        mensagem = 'Tempo esgotado ao tentar obter localização.';
      }

      alert(mensagem);

      btnMinhaLocalizacao.disabled = false;
      btnMinhaLocalizacao.textContent = '🎯';
    },

    // Configurações da localização
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// Busca locais usando a API pública Nominatim do OpenStreetMap
async function buscarLocalNoMapa() {
  const termoBusca = inputBuscaLocal.value.trim();

  if (!termoBusca) {
    resultadosBusca.innerHTML = '<p class="erro">Digite um local para buscar.</p>';
    return;
  }

  resultadosBusca.innerHTML = '<p>Buscando locais...</p>';

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(termoBusca)}`;

    const resposta = await fetch(url);
    const locais = await resposta.json();

    if (locais.length === 0) {
      resultadosBusca.innerHTML = '<p>Nenhum local encontrado.</p>';
      return;
    }

    mostrarResultadosBusca(locais);

  } catch (error) {
    resultadosBusca.innerHTML = '<p class="erro">Erro ao buscar local no mapa.</p>';
  }
}

// Mostra os resultados encontrados abaixo do campo de busca
function mostrarResultadosBusca(locais) {
  resultadosBusca.innerHTML = '';

  locais.forEach((local) => {
    const div = document.createElement('div');

    div.className = 'resultado-local';

    const nome = obterNomeLocal(local);

    div.innerHTML = `
      <strong>${nome}</strong>
      <span>${local.display_name}</span>
    `;

    // Quando o usuário clica em um resultado,
    // os campos do formulário são preenchidos automaticamente
    div.addEventListener('click', () => {
      selecionarLocalDoMapa(local);
    });

    resultadosBusca.appendChild(div);
  });
}

// Seleciona um local retornado pelo OpenStreetMap
function selecionarLocalDoMapa(local) {
  const latitude = Number(local.lat);
  const longitude = Number(local.lon);

  const nome = obterNomeLocal(local);
  const endereco = local.display_name;

  // Preenche os campos visíveis do formulário
  document.getElementById('nome-local').value = nome;
  document.getElementById('endereco').value = endereco;

  // Preenche os campos ocultos
  inputOsmId.value = local.osm_id;
  inputLatitude.value = latitude;
  inputLongitude.value = longitude;

  // Move o mapa para o local selecionado
  mapa.setView([latitude, longitude], 17);

  // Remove marcador antigo, caso exista
  if (marcadorAtual) {
    mapa.removeLayer(marcadorAtual);
  }

  // Adiciona marcador no local selecionado
  marcadorAtual = L.marker([latitude, longitude])
    .addTo(mapa)
    .bindPopup(nome)
    .openPopup();

  resultadosBusca.innerHTML = `
    <p class="sucesso">Local selecionado: ${nome}</p>
  `;
}

// Tenta descobrir um bom nome para o local
function obterNomeLocal(local) {
  if (local.name) {
    return local.name;
  }

  if (local.display_name) {
    return local.display_name.split(',')[0];
  }

  return 'Local sem nome';
}


// Envia a avaliação para o backend
formAvaliacao.addEventListener('submit', async (event) => {
  event.preventDefault();

  const token = getToken();

  if (!token) {
    mensagemAvaliacao.textContent = 'Você precisa estar logado para avaliar.';
    mensagemAvaliacao.className = 'erro';
    return;
  }

  const dados = {
    local: {
        osm_id: inputOsmId.value || null,
        nome: document.getElementById('nome-local').value,
        categoria_codigo: document.getElementById('categoria').value,
        endereco: document.getElementById('endereco').value,
        latitude: inputLatitude.value || null,
        longitude: inputLongitude.value || null
    },
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
    const resposta = await fetch(`${API_URL}/avaliacoes`, {
      method: 'POST',
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

    mensagemAvaliacao.textContent = `Avaliação salva com sucesso. Nota final: ${resultado.nota_final}`;
    mensagemAvaliacao.className = 'sucesso';

    formAvaliacao.reset();

    // Limpa os campos ocultos do mapa
    inputOsmId.value = '';
    inputLatitude.value = '';
    inputLongitude.value = '';

    // Remove o marcador do mapa
    if (marcadorAtual) {
    mapa.removeLayer(marcadorAtual);
    marcadorAtual = null;
    }

    // Limpa resultados da busca
    resultadosBusca.innerHTML = '';

    calcularNotaPreview();
    carregarLocais();

  } catch (error) {
    mensagemAvaliacao.textContent = 'Erro ao conectar com o servidor.';
    mensagemAvaliacao.className = 'erro';
  }
});

// Quando clicar no botão Buscar, pesquisa no OpenStreetMap
btnBuscarLocal.addEventListener('click', buscarLocalNoMapa);

inputBuscaLocal.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    buscarLocalNoMapa();
  }
});

btnMinhaLocalizacao.addEventListener('click', usarMinhaLocalizacao);

async function iniciarPagina() {
    // Inicialização da página
    carregarMenu();

    // Primeiro inicia o mapa
    iniciarMapa();

    await carregarFavoritosUsuario();
    
    // Depois carrega os locais e cria os marcadores
    await carregarLocais();

    carregarCategorias();

    carregarCriterios().then(() => {
        ativarCalculoAutomatico();
        calcularNotaPreview();
    });
}

iniciarPagina();