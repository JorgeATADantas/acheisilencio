document.addEventListener('DOMContentLoaded', () => {
    const btnFiltrar = document.getElementById('btn-filtrar');
    const menuFiltros = document.getElementById('menu-filtros');
    const checkboxes = document.querySelectorAll('.check-filtro');
    const areaTags = document.getElementById('tags-selecionadas');
    const btnLimpar = document.getElementById('btn-limpar-filtros');
    const mostruario = document.getElementById('mostruario');
    const campoBusca = document.getElementById('campo-busca');

    const locaisPadrao = [
        {
            id: 'biblioteca-ufmg',
            nome: 'Biblioteca UFMG',
            endereco: 'Av. Antônio Carlos - campus',
            horario: '08:00 às 20:00',
            descricao: 'Biblioteca silenciosa dentro do campus.',
            nota: '4.9',
            categoria: 'biblioteca',
            faixaPreco: 'gratuito',
            pontosEnergia: 'muitas',
            internet: 'otima-internet',
            banheiro: 'boa-limpo-banheiro',
            acessibilidade: 'sim-acessibilidade',
            refeicao: 'sem-refeicao',
            padrao: true
        },
        {
            id: 'cafe-belo-horizonte',
            nome: 'Café Belo Horizonte',
            endereco: 'Rua da Paz, 144',
            horario: '09:00 às 18:00',
            descricao: 'Café calmo para leitura e estudos.',
            nota: '4.7',
            categoria: 'cafe',
            faixaPreco: '20-30',
            pontosEnergia: 'adequadas',
            internet: 'boa-internet',
            banheiro: 'pouco-limpo-banheiro',
            acessibilidade: 'baixa-acessibilidade',
            refeicao: 'com-boa-preco-caro',
            padrao: true
        },
        {
            id: 'cafe-com-letras',
            nome: 'Café com Letras',
            endereco: 'Centro - acesso livre',
            horario: '10:00 às 19:00',
            descricao: 'Ambiente tranquilo com livros e mesas para estudo.',
            nota: '4.6',
            categoria: 'cafe',
            faixaPreco: '10-20',
            pontosEnergia: 'adequadas',
            internet: 'boa-internet',
            banheiro: 'boa-limpo-banheiro',
            acessibilidade: 'sim-acessibilidade',
            refeicao: 'com-boa-preco-justo',
            padrao: true
        }
    ];

    function normalizarTexto(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function lerLista(chave) {
        try {
            const lista = JSON.parse(localStorage.getItem(chave));
            return Array.isArray(lista) ? lista : [];
        } catch (erro) {
            return [];
        }
    }

    function salvarLista(chave, lista) {
        localStorage.setItem(chave, JSON.stringify(lista));
    }

    function obterUsuarioLogado() {
        const chavesPossiveis = [
            'usuarioLogado',
            'usuarioAtual',
            'emailUsuarioLogado',
            'nomeUsuarioModificado'
        ];

        for (const chave of chavesPossiveis) {
            const valor = localStorage.getItem(chave);

            if (!valor) {
                continue;
            }

            try {
                const objeto = JSON.parse(valor);
                const identificador = objeto.email || objeto.nome || objeto.usuario || objeto.login;

                if (identificador) {
                    return normalizarTexto(identificador);
                }
            } catch (erro) {
                return normalizarTexto(valor);
            }
        }

        const statusLogin = localStorage.getItem('statusLogin');

        if (statusLogin && statusLogin !== 'false') {
            return 'usuario-logado';
        }

        return null;
    }

    function gerarIdLocal(local, indice) {
        const textoBase = `${local.nome || 'local'}-${local.endereco || ''}-${indice}`;

        return normalizarTexto(textoBase)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function corrigirLocaisAntigos() {
        const usuarioLogado = obterUsuarioLogado();
        const locais = lerLista('locaisCadastrados');

        let alterou = false;

        const locaisCorrigidos = locais.map((local, indice) => {
            const localCorrigido = { ...local };

            if (!localCorrigido.id) {
                localCorrigido.id = gerarIdLocal(localCorrigido, indice);
                alterou = true;
            }

            if (!localCorrigido.usuarioCriador && usuarioLogado) {
                localCorrigido.usuarioCriador = usuarioLogado;
                alterou = true;
            }

            return localCorrigido;
        });

        if (alterou) {
            salvarLista('locaisCadastrados', locaisCorrigidos);
        }
    }

    function obterLocaisCadastrados() {
        return lerLista('locaisCadastrados').map((local, indice) => {
            return {
                id: local.id || gerarIdLocal(local, indice),
                nome: local.nome || '',
                endereco: local.endereco || '',
                horario: local.horario || '',
                descricao: local.descricao || '',
                nota: local.nota || '0.0',
                categoria: local.categoria || '',
                faixaPreco: local.faixaPreco || '',
                pontosEnergia: local.pontosEnergia || '',
                internet: local.internet || '',
                banheiro: local.banheiro || '',
                acessibilidade: local.acessibilidade || '',
                refeicao: local.refeicao || '',
                usuarioCriador: local.usuarioCriador || null,
                padrao: false
            };
        });
    }

    function obterTodosLocais() {
        return [
            ...locaisPadrao,
            ...obterLocaisCadastrados()
        ];
    }

    function obterFiltrosSelecionados() {
        return Array.from(checkboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => {
                return {
                    campo: checkbox.dataset.campo,
                    valor: checkbox.value,
                    texto: checkbox.parentElement.textContent.trim(),
                    cor: checkbox.dataset.cor || ''
                };
            });
    }

    function obterNotaArredondada(local) {
        const nota = Number(local.nota);

        if (isNaN(nota)) {
            return '0';
        }

        return String(Math.round(nota));
    }

    function localPassaNosFiltros(local, filtros) {
        if (filtros.length === 0) {
            return true;
        }

        const filtrosPorCampo = {};

        filtros.forEach(filtro => {
            if (!filtrosPorCampo[filtro.campo]) {
                filtrosPorCampo[filtro.campo] = [];
            }

            filtrosPorCampo[filtro.campo].push(filtro.valor);
        });

        for (const campo in filtrosPorCampo) {
            const valoresSelecionados = filtrosPorCampo[campo];

            if (campo === 'nota') {
                const notaLocal = obterNotaArredondada(local);

                if (!valoresSelecionados.includes(notaLocal)) {
                    return false;
                }
            } else {
                const valorLocal = String(local[campo] || '');

                if (!valoresSelecionados.includes(valorLocal)) {
                    return false;
                }
            }
        }

        return true;
    }

    function localPassaNaBusca(local, busca) {
        if (!busca) {
            return true;
        }

        const textoLocal = [
            local.nome,
            local.endereco,
            local.horario,
            local.descricao,
            local.categoria,
            local.faixaPreco,
            local.pontosEnergia,
            local.internet,
            local.banheiro,
            local.acessibilidade,
            local.refeicao
        ].join(' ');

        return normalizarTexto(textoLocal).includes(busca);
    }

    function atualizarTagsDosFiltros() {
        areaTags.innerHTML = '';

        const filtros = obterFiltrosSelecionados();

        filtros.forEach(filtro => {
            const tag = document.createElement('span');

            tag.className = `tag ${filtro.cor}`;
            tag.textContent = filtro.texto;

            areaTags.appendChild(tag);
        });
    }

    function localEstaFavoritado(local) {
        const favoritos = lerLista('meusFavoritos');

        return favoritos.some(favorito => {
            if (favorito.id && local.id) {
                return favorito.id === local.id;
            }

            return favorito.nome === local.nome;
        });
    }

    function alternarFavorito(local) {
        let favoritos = lerLista('meusFavoritos');

        const jaFavoritado = favoritos.some(favorito => {
            if (favorito.id && local.id) {
                return favorito.id === local.id;
            }

            return favorito.nome === local.nome;
        });

        if (jaFavoritado) {
            favoritos = favoritos.filter(favorito => {
                if (favorito.id && local.id) {
                    return favorito.id !== local.id;
                }

                return favorito.nome !== local.nome;
            });
        } else {
            favoritos.push({
                id: local.id,
                nome: local.nome,
                endereco: local.endereco,
                nota: local.nota
            });
        }

        salvarLista('meusFavoritos', favoritos);
    }

    function usuarioPodeExcluir(local) {
        const usuarioLogado = obterUsuarioLogado();

        return Boolean(
            usuarioLogado &&
            local.usuarioCriador &&
            local.usuarioCriador === usuarioLogado
        );
    }

    function removerDosFavoritos(local) {
        let favoritos = lerLista('meusFavoritos');

        favoritos = favoritos.filter(favorito => {
            if (favorito.id && local.id) {
                return favorito.id !== local.id;
            }

            return favorito.nome !== local.nome;
        });

        salvarLista('meusFavoritos', favoritos);
    }

    function excluirLocal(local) {
        if (!usuarioPodeExcluir(local)) {
            alert('Você só pode excluir avaliações cadastradas pelo usuário logado.');
            return;
        }

        const confirmar = confirm(`Deseja excluir a avaliação de "${local.nome}"?`);

        if (!confirmar) {
            return;
        }

        let locais = lerLista('locaisCadastrados');

        locais = locais.filter(item => {
            if (item.id && local.id) {
                return item.id !== local.id;
            }

            return item.nome !== local.nome || item.endereco !== local.endereco;
        });

        salvarLista('locaisCadastrados', locais);
        removerDosFavoritos(local);
        renderizarLocais();
    }

    function criarCartaoLocal(local) {
        const cartao = document.createElement('a');
        cartao.href = '#';
        cartao.className = 'cartao-local';
        cartao.dataset.id = local.id;

        const infoTexto = document.createElement('div');
        infoTexto.className = 'info-texto';

        const nome = document.createElement('h3');
        nome.textContent = local.nome;

        const endereco = document.createElement('p');
        endereco.textContent = local.endereco;

        infoTexto.appendChild(nome);
        infoTexto.appendChild(endereco);

        if (local.horario) {
            const horario = document.createElement('p');
            horario.className = 'metadados-local';
            horario.textContent = `Horário: ${local.horario}`;
            infoTexto.appendChild(horario);
        }

        const controles = document.createElement('div');
        controles.className = 'controles-local';

        const botaoFavorito = document.createElement('span');
        botaoFavorito.className = 'btn-favorito';
        botaoFavorito.textContent = localEstaFavoritado(local) ? '♥' : '♡';

        if (localEstaFavoritado(local)) {
            botaoFavorito.classList.add('ativo');
        }

        botaoFavorito.addEventListener('click', evento => {
            evento.preventDefault();
            evento.stopPropagation();

            alternarFavorito(local);
            renderizarLocais();
        });

        controles.appendChild(botaoFavorito);

        if (usuarioPodeExcluir(local)) {
            const botaoExcluir = document.createElement('span');
            botaoExcluir.className = 'btn-excluir';
            botaoExcluir.textContent = '🗑';
            botaoExcluir.title = 'Excluir avaliação';

            botaoExcluir.addEventListener('click', evento => {
                evento.preventDefault();
                evento.stopPropagation();

                excluirLocal(local);
            });

            controles.appendChild(botaoExcluir);
        }

        const infoNota = document.createElement('div');
        infoNota.className = 'info-nota';

        const estrela = document.createElement('span');
        estrela.className = 'icone-estrela';
        estrela.textContent = '⭐';

        const nota = document.createElement('strong');
        nota.textContent = local.nota;

        infoNota.appendChild(estrela);
        infoNota.appendChild(nota);

        controles.appendChild(infoNota);

        cartao.appendChild(infoTexto);
        cartao.appendChild(controles);

        return cartao;
    }

    function renderizarMensagemVazia() {
        mostruario.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum ambiente encontrado com os filtros selecionados.
            </p>
        `;
    }

    function renderizarLocais() {
        const busca = normalizarTexto(campoBusca.value);
        const filtros = obterFiltrosSelecionados();

        const locaisFiltrados = obterTodosLocais().filter(local => {
            return localPassaNaBusca(local, busca) && localPassaNosFiltros(local, filtros);
        });

        mostruario.innerHTML = '';

        if (locaisFiltrados.length === 0) {
            renderizarMensagemVazia();
            return;
        }

        locaisFiltrados.forEach(local => {
            mostruario.appendChild(criarCartaoLocal(local));
        });
    }

    btnFiltrar.addEventListener('click', evento => {
        evento.stopPropagation();
        menuFiltros.classList.toggle('oculto');
    });

    document.addEventListener('click', evento => {
        if (!menuFiltros.contains(evento.target) && evento.target !== btnFiltrar) {
            menuFiltros.classList.add('oculto');
        }
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            atualizarTagsDosFiltros();
            renderizarLocais();
        });
    });

    campoBusca.addEventListener('input', renderizarLocais);

    btnLimpar.addEventListener('click', evento => {
        evento.stopPropagation();

        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        atualizarTagsDosFiltros();
        renderizarLocais();
    });

    corrigirLocaisAntigos();
    atualizarTagsDosFiltros();
    renderizarLocais();
});