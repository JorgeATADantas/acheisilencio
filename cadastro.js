const formCadastro = document.getElementById('form-cadastro');

// Intercepta o evento de "submit" (quando o usuário clica em Cadastrar)
formCadastro.addEventListener('submit', function(evento) {
    // Essa linha é essencial: ela impede que a página recarregue imediatamente
    evento.preventDefault(); 

    //Implementar o código para o banco de dados no futuro

    // Redireciona o usuário para a página de login
    window.location.href = 'login.html';
});