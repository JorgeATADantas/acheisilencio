document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formulario-local');
    const notaFinalElemento = document.getElementById('nota-final');

    const criterios = [
        'faixa-preco',
        'pontos-energia',
        'internet',
        'banheiro',
        'acessibilidade',
        'refeicao'
    ];

    function obterNotaSelect(id) {

        const select = document.getElementById(id);

        if (select.selectedIndex <= 0) {
            return null;
        }

        return Number(
            select.options[select.selectedIndex].dataset.nota
        );
    }
    
    function calcularNota() {

        let soma = 0;
        let quantidade = 0;

        criterios.forEach(id => {

            const nota = obterNotaSelect(id);

            if (nota !== null) {
                soma += nota;
                quantidade++;
            }
        });

        if (quantidade === 0) {
            notaFinalElemento.textContent = "0.0";
            return "0.0";
        }

        const notaFinal = (soma / quantidade).toFixed(1);

        notaFinalElemento.textContent = notaFinal;

        return notaFinal;
    }

    criterios.forEach(id => {
        document.getElementById(id).addEventListener('change', calcularNota);
    });

    calcularNota();

    form.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const nota = calcularNota();


        const nomeLocal = document.getElementById('nome-local').value.trim();
        const enderecoLocal = document.getElementById('endereco').value.trim();
        const horarioAbertura = document.getElementById('horario-abertura').value;
        const horarioFechamento = document.getElementById('horario-fechamento').value;
        
        const novoCantinho = {
            nome: nomeLocal,
            endereco: enderecoLocal,
            horario: `${horarioAbertura} às ${horarioFechamento}`,
            nota: nota
        };

        let locaisCadastrados = JSON.parse(localStorage.getItem('locaisCadastrados')) || [];
        locaisCadastrados.push(novoCantinho);
        localStorage.setItem('locaisCadastrados', JSON.stringify(locaisCadastrados));

        window.location.href = 'explorar.html';
    });
});