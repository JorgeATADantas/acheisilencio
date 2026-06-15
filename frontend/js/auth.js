//Arquivo para controlar login e logout (js/auth.js)

// Retorna o token salvo no navegador
function getToken() {
  return localStorage.getItem('token');
}

// Retorna o usuário salvo no navegador
function getUsuario() {
  const usuario = localStorage.getItem('usuario');

  if (!usuario) {
    return null;
  }

  return JSON.parse(usuario);
}

// Verifica se o usuário está logado
function estaLogado() {
  return !!getToken();
}

// Faz logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');

  window.location.href = 'index.html';
}