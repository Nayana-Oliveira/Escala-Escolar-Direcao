const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

async function tratarResposta(response) {
  const resultado = await response.json();

  if (!response.ok || !resultado.sucesso) {
    throw new Error(
      resultado.mensagem ||
        resultado.message ||
        "Erro na comunicação com o servidor.",
    );
  }

  return resultado;
}

export async function getFuncionarios() {
  const response = await fetch(`${API_URL}?acao=listarFuncionarios`);
  const resultado = await tratarResposta(response);

  return resultado.dados;
}

export async function cadastrarFuncionario(funcionario) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "cadastrarFuncionario",
      ...funcionario,
    }),
  });

  return await tratarResposta(response);
}

export async function atualizarFuncionario(id, funcionario) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "atualizarFuncionario",
      id,
      ...funcionario,
    }),
  });

  return await tratarResposta(response);
}

export async function excluirFuncionario(id) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "excluirFuncionario",
      id,
    }),
  });

  const resultado = await response.json();

  if (!response.ok || !resultado.sucesso) {
    throw new Error(resultado.mensagem || "Erro ao excluir funcionário.");
  }

  return resultado;
}

export async function cadastrarEscala(escala) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "cadastrarEscala",
      escala,
    }),
  });

  return await tratarResposta(response);
}

export async function cadastrarAtividades(atividades) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "cadastrarAtividades",
      atividades,
    }),
  });

  return await tratarResposta(response);
}

export async function atualizarEscala(escalaId, escala, atividades) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "atualizarEscala",
      escalaId,
      escala,
      atividades,
    }),
  });

  return await tratarResposta(response);
}

export async function excluirEscala(escalaId) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "excluirEscala",
      escalaId,
    }),
  });

  return await tratarResposta(response);
}

export async function listarOcorrencias() {
  const resposta = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      acao: "listarOcorrencias",
    }),
  });

  const resultado = await resposta.json();

  if (!resultado.sucesso) {
    throw new Error(resultado.mensagem || "Erro ao listar ocorrências.");
  }

  return resultado.dados;
}

export async function excluirOcorrencia(id) {
  const resposta = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      acao: "excluirOcorrencia",
      id,
    }),
  });

  const resultado = await resposta.json();

  if (!resultado.sucesso) {
    throw new Error(resultado.mensagem || "Erro ao excluir ocorrência.");
  }

  return resultado.dados;
}

export async function fazerLogin(email) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      acao: "login",
      email,
    }),
  });

  return await tratarResposta(response);
}
