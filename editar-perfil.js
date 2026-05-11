document.addEventListener('DOMContentLoaded', function() {
    const campoNome = document.getElementById('editar-nome');
    const formularioEdicao = document.getElementById('formulario-editar-perfil');
    // Verifica se já existe um nome modificado na memória do navegador
    const nomeModificado = localStorage.getItem('nomeUsuarioModificado');

    // Preenche o campo de nome ao carregar a página
    if (campoNome) {
        if (nomeModificado) {
            campoNome.value = nomeModificado; // Usa o nome novo se existir
        } else {
            campoNome.value = 'Andre Giovani Jorge'; // Usa o padrão se não existir
        }
    }

    // Ação ao clicar no botão "Salvar alterações"
    if (formularioEdicao) {
        formularioEdicao.addEventListener('submit', function(evento) {
            evento.preventDefault(); 

            // Salva o texto digitado na memória do navegador
            localStorage.setItem('nomeUsuarioModificado', campoNome.value);
            window.location.href = 'meu-perfil.html';
        });
    }
});