document.addEventListener('DOMContentLoaded', function() {
    const botaoSair = document.getElementById('botao-sair');
    if (botaoSair) {
        botaoSair.addEventListener('click', function(evento) {
            evento.preventDefault();
            localStorage.removeItem('statusLogin'); 
            window.location.href = 'index.html';
        });
    }

    const nomeModificado = localStorage.getItem('nomeUsuarioModificado');
    // Procura o local onde o nome aparece na tela (a tag H2)
    const tituloBoasVindas = document.querySelector('#nome-usuario');
    if (nomeModificado && tituloBoasVindas) {
        // Escreve o nome modificado no lugar do antigo
        tituloBoasVindas.innerHTML = `Bem-vindo, <span>${nomeModificado}</span>`;
    }
});