document.addEventListener('DOMContentLoaded', function() {
    const botaoEntrar = document.getElementById('entrar');

    if (botaoEntrar) {
        botaoEntrar.addEventListener('click', function(evento) {
            evento.preventDefault();
            localStorage.setItem('statusLogin', 'ativo');
            window.location.href = 'index.html';
        });
    }
});