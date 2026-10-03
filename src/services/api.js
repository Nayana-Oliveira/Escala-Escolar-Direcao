const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL?.trim();

function validarApi() {
  if (!API_URL) {
    throw new Error("VITE_APPS_SCRIPT_URL não foi configurada.");
  }

  try {
    const url = new URL(API_URL);

    if (url.protocol !== "https:") {
      throw new Error("A URL da API precisa utilizar HTTPS.");
    }
  } catch {
    throw new Error("A URL do Google Apps Script é inválida.");
  }
}

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

async function requisicao(dados) {
  validarApi();

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(dados),
  });

  return tratarResposta(response);
}

async function requisicaoGet(acao) {
  validarApi();

  const url = new URL(API_URL);
  url.searchParams.set("acao", acao);

  const response = await fetch(url.toString());

  return tratarResposta(response);
}

export async function getFuncionarios() {
  const resultado = await requisicaoGet("listarFuncionarios");
  return resultado.dados;
}

export async function cadastrarFuncionario(funcionario) {
  return requisicao({
    acao: "cadastrarFuncionario",
    ...funcionario,
  });
}

export async function atualizarFuncionario(id, funcionario) {
  return requisicao({
    acao: "atualizarFuncionario",
    id,
    ...funcionario,
  });
}

export async function excluirFuncionario(id) {
  return requisicao({
    acao: "excluirFuncionario",
    id,
  });
}

export async function cadastrarEscala(escala) {
  return requisicao({
    acao: "cadastrarEscala",
    escala,
  });
}

export async function cadastrarAtividades(atividades) {
  return requisicao({
    acao: "cadastrarAtividades",
    atividades,
  });
}

export async function atualizarEscala(escalaId, escala, atividades) {
  return requisicao({
    acao: "atualizarEscala",
    escalaId,
    escala,
    atividades,
  });
}

export async function excluirEscala(escalaId) {
  return requisicao({
    acao: "excluirEscala",
    escalaId,
  });
}

export async function listarOcorrencias() {
  const resultado = await requisicao({
    acao: "listarOcorrencias",
  });

  return resultado.dados;
}

export async function excluirOcorrencia(id) {
  return requisicao({
    acao: "excluirOcorrencia",
    id,
  });
}

export async function listarLocais() {
  const resultado = await requisicao({
    acao: "listarLocais",
  });

  return resultado.dados;
}

export async function cadastrarLocal(local) {
  return requisicao({
    acao: "cadastrarLocal",
    ...local,
  });
}

export async function atualizarLocal(id, local) {
  return requisicao({
    acao: "atualizarLocal",
    id,
    ...local,
  });
}

export async function excluirLocal(id) {
  return requisicao({
    acao: "excluirLocal",
    id,
  });
}

export async function fazerLogin(email) {
  return requisicao({
    acao: "login",
    email,
  });
}
