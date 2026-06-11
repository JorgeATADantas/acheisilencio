document.addEventListener('DOMContentLoaded', () => {
    const btnFiltrar = document.getElementById('btn-filtrar');
    const menuFiltros = document.getElementById('menu-filtros');
    const checkboxes = document.querySelectorAll('.check-filtro');
    const areaTags = document.getElementById('tags-selecionadas');
    const btnLimpar = document.getElementById('btn-limpar-filtros');
    const mostruario = document.getElementById('mostruario');
    const locaisCadastrados = JSON.parse(localStorage.getItem('locaisCadastrados')) || [];

    locaisCadastrados.forEach(local => {
        const cartaoHTML = `
            <a href="#" class="cartao-local">
                <div class="info-texto">
                    <h3>${local.nome}</h3>
                    <p>${local.endereco}</p>
                </div>
                <div class="controles-local">
                    <span class="btn-favorito">♡</span>
                    <div class="info-nota">
                        <span class="icone-estrela">⭐</span>
                        <strong>${local.nota}</strong>
                    </div>
                </div>
            </a>
        `;
        mostruario.insertAdjacentHTML('afterbegin', cartaoHTML);
    });

    const botoesFavorito = document.querySelectorAll('.btn-favorito');

    btnFiltrar.addEventListener('click', (evento) => {
        evento.stopPropagation(); 
        menuFiltros.classList.toggle('oculto');
    });

    document.addEventListener('click', (evento) => {
        if (!menuFiltros.contains(evento.target) && evento.target !== btnFiltrar) {
            menuFiltros.classList.add('oculto');
        }
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', atualizarTags);
    });

    function atualizarTags() {
        areaTags.innerHTML = '';
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const tag = document.createElement('span');
                const corDaTag = checkbox.getAttribute('data-cor'); 
                tag.className = `tag ${corDaTag}`;
                tag.textContent = checkbox.value;
                areaTags.appendChild(tag);
            }
        });
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', (evento) => {
            evento.stopPropagation(); 
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            atualizarTags();
        });
    }

    let listaFavoritos = JSON.parse(localStorage.getItem('meusFavoritos')) || [];

    botoesFavorito.forEach(botao => {
        const cartao = botao.closest('.cartao-local');
        const nomeLocal = cartao.querySelector('h3').textContent.trim();
        const jaFavoritado = listaFavoritos.some(local => local.nome === nomeLocal);
        if (jaFavoritado) {
            botao.classList.add('ativo');
            botao.textContent = '♥';
        }

        botao.addEventListener('click', (evento) => {
            evento.preventDefault();
            evento.stopPropagation();

            botao.classList.toggle('ativo');

            const enderecoLocal = cartao.querySelector('p').textContent.trim();
            const notaLocal = cartao.querySelector('strong').textContent.trim();

            listaFavoritos = JSON.parse(localStorage.getItem('meusFavoritos')) || [];

            if (botao.classList.contains('ativo')) {
                botao.textContent = '♥';
                listaFavoritos.push({
                    nome: nomeLocal,
                    endereco: enderecoLocal,
                    nota: notaLocal
                });
            } else {
                botao.textContent = '♡';
                listaFavoritos = listaFavoritos.filter(local => local.nome !== nomeLocal);
            }
            
            localStorage.setItem('meusFavoritos', JSON.stringify(listaFavoritos));
        });
    });
});