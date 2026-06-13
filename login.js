const formLogin = document.getElementById('form-login');

if (formLogin) {
    formLogin.addEventListener('submit', function(evento) {
        evento.preventDefault(); 

        // Usa a mesma chave "statusLogin" que você criou no seu meu-perfil.js!
        localStorage.setItem('statusLogin', 'true');
        
        // Redireciona para a index
        window.location.href = 'meu-perfil.html';
    });
}