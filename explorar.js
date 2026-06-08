document.addEventListener('DOMContentLoaded', () => {
    const btnFiltrar = document.getElementById('btn-filtrar');
    const menuFiltros = document.getElementById('menu-filtros');
    const checkboxes = document.querySelectorAll('.check-filtro');
    const areaTags = document.getElementById('tags-selecionadas');
    const btnLimpar = document.getElementById('btn-limpar-filtros');
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

    botoesFavorito.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            evento.preventDefault();
            evento.stopPropagation();
            botao.classList.toggle('ativo');
            if (botao.classList.contains('ativo')) {
                botao.textContent = '♥'; 
            } else {
                botao.textContent = '♡'; 
            }
        });
    });
});