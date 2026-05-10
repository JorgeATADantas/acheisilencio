//usuarios
let usuarios =  [
    {
        nome:               'Andre Giovani Jorge',
        locais_visitados:   38,
        favoritos:          12,
        media_avaliacoes:   4.8
    }
];

function lerDadosUsuario(usuario) {

    document.querySelector('#nome-usuario').innerHTML =`Bem-vindo,  <span>${usuario.nome}</span>`;

    document.querySelector('#locais-visitados').innerHTML = `Locais visitados <span>${usuario.locais_visitados}</span>`;

    document.querySelector('#favoritos').innerHTML = `Favoritos <span>${usuario.favoritos}</span>`;

    document.querySelector('#media-avaliacoes').innerHTML =`Média das avaliações <span>${usuario.media_avaliacoes}</span>`;
}

lerDadosUsuario(usuarios[0])