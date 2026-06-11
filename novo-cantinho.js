document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulario-local');

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const nomeLocal = document.getElementById('nome-local').value.trim();
        const enderecoLocal = document.getElementById('endereco').value.trim();
        const horarioAbertura = document.getElementById('horario-abertura').value;
        const horarioFechamento = document.getElementById('horario-fechamento').value;
        
        const novoCantinho = {
            nome: nomeLocal,
            endereco: enderecoLocal,
            horario: `${horarioAbertura} às ${horarioFechamento}`,
            nota: "5.0"
        };

        let locaisCadastrados = JSON.parse(localStorage.getItem('locaisCadastrados')) || [];
        locaisCadastrados.push(novoCantinho);
        localStorage.setItem('locaisCadastrados', JSON.stringify(locaisCadastrados));

        alert('Cantinho publicado com sucesso!');
        window.location.href = 'explorar.html';
    });
});