document.addEventListener('DOMContentLoaded', function() {
    const botaoSair = document.getElementById('botao-sair');
    if (botaoSair) {
        botaoSair.addEventListener('click', function(evento) {
            evento.preventDefault();
            localStorage.removeItem('statusLogin');
            window.location.href = 'index.html';
        });
    }
});