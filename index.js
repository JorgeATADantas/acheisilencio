document.addEventListener('DOMContentLoaded', function() {
    // Pega os dois menus do HTML
    const menuUsuario = document.getElementById('menu-usuario');
    const menuVisitante = document.getElementById('menu-visitante');

    // Verifica se a chave do seu login existe
    const estaLogado = localStorage.getItem('statusLogin');

    if (estaLogado) {
        // Se tem login: mostra o menu do usuário, esconde o visitante
        if (menuUsuario) menuUsuario.style.display = 'flex'; // ou 'block', de acordo com seu CSS
        if (menuVisitante) menuVisitante.style.display = 'none';
    } else {
        // Se NÃO tem login: esconde o menu do usuário, mostra o visitante
        if (menuUsuario) menuUsuario.style.display = 'none';
        if (menuVisitante) menuVisitante.style.display = 'flex';
    }
});

