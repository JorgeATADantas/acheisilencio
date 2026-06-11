document.addEventListener('DOMContentLoaded', () => {
    const mostruario = document.getElementById('mostruario');

    function renderizarFavoritos() {
        let listaFavoritos = JSON.parse(localStorage.getItem('meusFavoritos')) || [];

        if (listaFavoritos.length === 0) {
            mostruario.innerHTML = '<p style="color: #6B7280; text-align: center; padding: 40px 0; font-size: 16px;">Você ainda não tem lugares salvos nos seus favoritos.</p>';
            return;
        }

        mostruario.innerHTML = '';

        listaFavoritos.forEach(local => {
            const cartaoHTML = `
                <a href="#" class="cartao-local" data-nome="${local.nome}">
                    <div class="info-texto">
                        <h3>${local.nome}</h3>
                        <p>${local.endereco}</p>
                    </div>
                    <div class="controles-local">
                        <span class="btn-favorito ativo">♥</span>
                        <div class="info-nota">
                            <span class="icone-estrela">⭐</span>
                            <strong>${local.nota}</strong>
                        </div>
                    </div>
                </a>
            `;
            mostruario.innerHTML += cartaoHTML;
        });

        configurarBotoesFavorito();
    }

    function configurarBotoesFavorito() {
        const botoesFavorito = document.querySelectorAll('.btn-favorito');

        botoesFavorito.forEach(botao => {
            botao.addEventListener('click', (evento) => {
                evento.preventDefault();
                evento.stopPropagation();

                const cartao = botao.closest('.cartao-local');
                const nomeLocal = cartao.getAttribute('data-nome');

                let listaFavoritos = JSON.parse(localStorage.getItem('meusFavoritos')) || [];
                listaFavoritos = listaFavoritos.filter(local => local.nome !== nomeLocal);
                localStorage.setItem('meusFavoritos', JSON.stringify(listaFavoritos));

                renderizarFavoritos();
            });
        });
    }

    renderizarFavoritos();
});