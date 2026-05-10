document.addEventListener('DOMContentLoaded', function() {
    const usuarioLogado = localStorage.getItem('statusLogin') === 'ativo';
    const menuVisitante = document.getElementById('menu-visitante');
    const menuUsuario = document.getElementById('menu-usuario');
    if (usuarioLogado) {
        menuVisitante.style.display = 'none';
        menuUsuario.style.display = 'flex';
    } else {
        menuVisitante.style.display = 'flex';
        menuUsuario.style.display = 'none';
    }
});