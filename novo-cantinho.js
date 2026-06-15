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


    function normalizarTexto(texto) {
        return String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function obterUsuarioLogado() {
        const chavesPossiveis = [
            'usuarioLogado',
            'usuarioAtual',
            'emailUsuarioLogado',
            'nomeUsuarioModificado'
        ];


        for (const chave of chavesPossiveis) {
            const valor = localStorage.getItem(chave);

            if (!valor) {
                continue;
            }

            try {
                const objeto = JSON.parse(valor);
                const identificador = objeto.email || objeto.nome || objeto.usuario || objeto.login;

                if (identificador) {
                    return normalizarTexto(identificador);
                }
            } catch (erro) {
                return normalizarTexto(valor);
            }
        }

        const statusLogin = localStorage.getItem('statusLogin');

        if (statusLogin && statusLogin !== 'false') {
            return 'usuario-logado';
        }

        return null;
    }

    function obterNotaSelect(id) {
        const select = document.getElementById(id);

        if (!select || select.selectedIndex <= 0) {
            return null;
        }

        return Number(select.options[select.selectedIndex].dataset.nota);
    }

    function obterValorSelect(id) {
        const select = document.getElementById(id);

        if (!select) {
            return '';
        }

        return select.value;
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
        const descricao = document.getElementById('descricao').value.trim();

        const novoCantinho = {
            id: `local-${Date.now()}`,
            nome: nomeLocal,
            endereco: enderecoLocal,
            horario: `${horarioAbertura} às ${horarioFechamento}`,
            descricao: descricao,
            nota: nota,
            categoria: obterValorSelect('categoria'),
            faixaPreco: obterValorSelect('faixa-preco'),
            pontosEnergia: obterValorSelect('pontos-energia'),
            internet: obterValorSelect('internet'),
            banheiro: obterValorSelect('banheiro'),
            acessibilidade: obterValorSelect('acessibilidade'),
            refeicao: obterValorSelect('refeicao'),

            usuarioCriador: obterUsuarioLogado()
        };

        let locaisCadastrados = JSON.parse(localStorage.getItem('locaisCadastrados')) || [];
        locaisCadastrados.push(novoCantinho);
        localStorage.setItem('locaisCadastrados', JSON.stringify(locaisCadastrados));

        window.location.href = 'explorar.html';
    });
});