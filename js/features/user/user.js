const API = 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

// ── Login ───────────────────────────────────────────────

async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const msg   = document.getElementById('mensagem');

  try {
    const resposta = await fetch(`${API}/api/users/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('token',   dados.token);
      localStorage.setItem('usuario', JSON.stringify(dados.usuario));
      window.location.href = 'pages/home.html';
    } else {
      msg.textContent = dados.mensagem || 'Erro ao fazer login.';
      msg.className   = 'erro';
    }
  } catch (err) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.className   = 'erro';
  }
}

// ── Cadastro ────────────────────────────────────────────

async function handleCadastro(event) {
  event.preventDefault();

  const nome           = document.getElementById('nome').value.trim();
  const email          = document.getElementById('email').value.trim();
  const senha          = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const msg            = document.getElementById('mensagem');

  if (senha !== confirmarSenha) {
    msg.textContent = 'As senhas não coincidem.';
    msg.className   = 'erro';
    return;
  }

  if (senha.length < 6) {
    msg.textContent = 'A senha deve ter no mínimo 6 caracteres.';
    msg.className   = 'erro';
    return;
  }

  try {
    const resposta = await fetch(`${API}/api/users`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome, email, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      msg.textContent = 'Conta criada com sucesso! Redirecionando...';
      msg.className   = 'sucesso';
      setTimeout(() => { window.location.href = '../index.html'; }, 1500);
    } else {
      msg.textContent = dados.mensagem || 'Erro ao criar conta.';
      msg.className   = 'erro';
    }
  } catch (err) {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.className   = 'erro';
  }
}

// ── Editar usuário ──────────────────────────────────────

async function handleAtualizar(event) {
  event.preventDefault();

  const usuario        = JSON.parse(localStorage.getItem('usuario'));
  const nome           = document.getElementById('inputNome').value.trim();
  const email          = document.getElementById('inputEmail').value.trim();
  const senha          = document.getElementById('inputSenha').value;
  const confirmar      = document.getElementById('inputConfirmarSenha').value;
  const msg            = document.getElementById('mensagemForm');
  const btn            = document.getElementById('btnSalvar');

  msg.className = 'msg-form form-group-full';

  if (senha && senha !== confirmar) {
    msg.textContent = 'As senhas não coincidem.';
    msg.classList.add('msg-erro');
    return;
  }
  if (senha && senha.length < 6) {
    msg.textContent = 'A senha deve ter no mínimo 6 caracteres.';
    msg.classList.add('msg-erro');
    return;
  }

  const body = { nome, email };
  if (senha) body.senha = senha;

  btn.textContent = 'Salvando...';
  btn.disabled    = true;

  try {
    const resposta = await fetch(`${API}/api/users/${usuario.id}`, {
      method:  'PUT',
      headers: authHeaders(),
      body:    JSON.stringify(body)
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      const atualizado = { ...usuario, nome, email };
      localStorage.setItem('usuario', JSON.stringify(atualizado));
      msg.textContent = '✅ Dados atualizados com sucesso!';
      msg.classList.add('msg-sucesso');
      preencherTela(atualizado);
      document.getElementById('inputSenha').value          = '';
      document.getElementById('inputConfirmarSenha').value = '';
    } else {
      msg.textContent = dados.mensagem || 'Erro ao atualizar.';
      msg.classList.add('msg-erro');
    }
  } catch {
    msg.textContent = 'Erro de conexão com o servidor.';
    msg.classList.add('msg-erro');
  } finally {
    btn.textContent = 'Salvar alterações';
    btn.disabled    = false;
  }
}

// ── Excluir usuário ─────────────────────────────────────

async function handleExcluir() {
  const usuario  = JSON.parse(localStorage.getItem('usuario'));
  const senha    = document.getElementById('senhaConfirmacao').value;  // ← garante que está pegando
  const msgModal = document.getElementById('mensagemModal');
  const btn      = document.getElementById('btnConfirmarExcluir');

  if (!senha) {
    msgModal.textContent = 'Digite sua senha para confirmar.';
    return;
  }

  btn.textContent = 'Excluindo...';
  btn.disabled    = true;

  try {
    const resposta = await fetch(`${API}/api/users/${usuario.id}`, {
      method:  'DELETE',
      headers: authHeaders(),
      body:    JSON.stringify({ senha })  // ← envia a senha
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.clear();
      window.location.href = '../index.html';
    } else {
      msgModal.textContent = dados.mensagem || 'Erro ao excluir conta.';
      btn.textContent      = 'Confirmar exclusão';
      btn.disabled         = false;
    }
  } catch {
    msgModal.textContent = 'Erro de conexão com o servidor.';
    btn.textContent      = 'Confirmar exclusão';
    btn.disabled         = false;
  }
}


function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '../index.html';
}

// ── Setup ───────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const formLogin    = document.getElementById('formLogin');
  const formCadastro = document.getElementById('formCadastro');
  const formPerfil   = document.getElementById('formPerfil');
  const btnConfirmar = document.getElementById('btnConfirmarExcluir');
  const btnLogout    = document.getElementById('btnLogout');  

  if (formLogin)    formLogin.addEventListener('submit', handleLogin);
  if (formCadastro) formCadastro.addEventListener('submit', handleCadastro);
  if (formPerfil)   formPerfil.addEventListener('submit', handleAtualizar);
  if (btnConfirmar) btnConfirmar.addEventListener('click', handleExcluir);
  if (btnLogout)    btnLogout.addEventListener('click', handleLogout); 
});