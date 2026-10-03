import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./index.css";

export default function Locais() {
  const [locais, setLocais] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editando, setEditando] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarLocais();
  }, []);

  async function carregarLocais() {
    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("locais")
        .select("*")
        .order("nome");

      console.log("Dados recebidos de locais:", data);
      console.log("Erro na consulta de locais:", error);
      console.log("Quantidade de locais:", data?.length);

      if (error) {
        setErro(error.message);
        return;
      }

      setLocais(data || []);
    } catch (error) {
      console.error("Erro inesperado ao carregar locais:", error);
      setErro("Não foi possível carregar os locais.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirCadastro() {
    setNome("");
    setDescricao("");
    setEditando(null);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(local) {
    setNome(local.nome);
    setDescricao(local.descricao || "");
    setEditando(local);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setNome("");
    setDescricao("");
    setEditando(null);
    setErro("");
  }

  async function salvarLocal(event) {
    event.preventDefault();

    if (!nome.trim()) {
      setErro("Informe o nome do local.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    const dados = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
    };

    let resultado;

    if (editando) {
      resultado = await supabase
        .from("locais")
        .update(dados)
        .eq("id", editando.id);
    } else {
      resultado = await supabase.from("locais").insert({
        ...dados,
        ativo: true,
      });
    }

    if (resultado.error) {
      setErro(resultado.error.message);
      setSalvando(false);
      return;
    }

    await carregarLocais();
    fecharModal();
    setSucesso(
      editando
        ? "Local atualizado com sucesso."
        : "Local cadastrado com sucesso.",
    );
    setSalvando(false);
  }

  async function alternarStatus(local) {
    setErro("");
    setSucesso("");

    const { error } = await supabase
      .from("locais")
      .update({ ativo: !local.ativo })
      .eq("id", local.id);

    if (error) {
      setErro(error.message);
      return;
    }

    setLocais((anterior) =>
      anterior.map((item) =>
        item.id === local.id ? { ...item, ativo: !local.ativo } : item,
      ),
    );

    setSucesso(local.ativo ? "Local desativado." : "Local ativado.");
  }

  async function excluirLocal() {
    if (!confirmacao) return;

    setErro("");
    setSucesso("");

    const { count, error: consultaError } = await supabase
      .from("atividades")
      .select("id", { count: "exact", head: true })
      .eq("local_id", confirmacao.id);

    if (consultaError) {
      setErro(consultaError.message);
      setConfirmacao(null);
      return;
    }

    if (count > 0) {
      setErro(
        "Este local possui atividades vinculadas. Desative-o ou altere as atividades antes de excluir.",
      );
      setConfirmacao(null);
      return;
    }

    const { error } = await supabase
      .from("locais")
      .delete()
      .eq("id", confirmacao.id);

    if (error) {
      setErro(error.message);
      setConfirmacao(null);
      return;
    }

    setLocais((anterior) =>
      anterior.filter((item) => item.id !== confirmacao.id),
    );

    setConfirmacao(null);
    setSucesso("Local excluído com sucesso.");
  }

  const locaisFiltrados = locais.filter((local) => {
    const termo = busca.toLowerCase();

    const correspondeBusca =
      local.nome.toLowerCase().includes(termo) ||
      (local.descricao || "").toLowerCase().includes(termo);

    const correspondeStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && local.ativo) ||
      (filtroStatus === "inativos" && !local.ativo);

    return correspondeBusca && correspondeStatus;
  });

  const totalAtivos = locais.filter((local) => local.ativo).length;
  const totalInativos = locais.length - totalAtivos;

  return (
    <main className="locais-page">
      <header className="locais-header">
        <div>
          <span className="locais-eyebrow">Gerenciamento</span>
          <h1>Locais</h1>
          <p>Cadastre e organize os espaços de atuação dos funcionários.</p>
        </div>

        <button className="locais-primary-button" onClick={abrirCadastro}>
          <span>+</span>
          Novo local
        </button>
      </header>

      {erro && (
        <div className="locais-alert locais-alert-error" role="alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="locais-alert locais-alert-success" role="status">
          {sucesso}
        </div>
      )}

      <section className="locais-summary">
        <div className="locais-summary-card">
          <div className="locais-summary-icon">▦</div>
          <div>
            <span>Total de locais</span>
            <strong>{locais.length}</strong>
          </div>
        </div>

        <div className="locais-summary-card">
          <div className="locais-summary-icon locais-icon-active">✓</div>
          <div>
            <span>Locais ativos</span>
            <strong>{totalAtivos}</strong>
          </div>
        </div>

        <div className="locais-summary-card">
          <div className="locais-summary-icon locais-icon-inactive">—</div>
          <div>
            <span>Locais inativos</span>
            <strong>{totalInativos}</strong>
          </div>
        </div>
      </section>

      <section className="locais-list-section">
        <div className="locais-list-header">
          <div>
            <h2>Locais cadastrados</h2>
            <p>Consulte e gerencie os locais da escola.</p>
          </div>
        </div>

        <div className="locais-filters">
          <div className="locais-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Buscar por nome ou descrição..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>

        <div className="locais-grid">
          {carregando ? (
            <div className="locais-empty">Carregando locais...</div>
          ) : locaisFiltrados.length === 0 ? (
            <div className="locais-empty">
              <strong>Nenhum local encontrado</strong>
              <span>Cadastre um local ou altere os filtros.</span>
            </div>
          ) : (
            locaisFiltrados.map((local) => (
              <article className="local-card" key={local.id}>
                <div className="local-card-header">
                  <div className="local-card-symbol">⌖</div>
                  <span
                    className={`local-status ${
                      local.ativo ? "status-active" : "status-inactive"
                    }`}
                  >
                    {local.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="local-card-content">
                  <h3>{local.nome}</h3>
                  <p>{local.descricao || "Nenhuma descrição informada."}</p>
                </div>

                <div className="local-card-actions">
                  <button
                    className="local-action-button"
                    onClick={() => abrirEdicao(local)}
                  >
                    Editar
                  </button>

                  <button
                    className="local-action-button"
                    onClick={() => alternarStatus(local)}
                  >
                    {local.ativo ? "Desativar" : "Ativar"}
                  </button>

                  <button
                    className="local-action-button local-action-delete"
                    onClick={() => setConfirmacao(local)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {modalAberto && (
        <div
          className="locais-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModal();
          }}
        >
          <section className="locais-modal">
            <div className="locais-modal-header">
              <div>
                <span className="locais-eyebrow">
                  {editando ? "Edição" : "Novo registro"}
                </span>
                <h2>{editando ? "Editar local" : "Cadastrar local"}</h2>
              </div>

              <button
                className="locais-modal-close"
                onClick={fecharModal}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarLocal}>
              <div className="locais-form">
                <label>
                  Nome do local
                  <input
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Ex.: Pátio"
                    maxLength="100"
                    required
                    autoFocus
                  />
                </label>

                <label>
                  Descrição
                  <textarea
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder="Descreva o local (opcional)"
                    rows="4"
                    maxLength="500"
                  />
                  <small>{descricao.length}/500 caracteres</small>
                </label>
              </div>

              {erro && (
                <div className="locais-alert locais-alert-error" role="alert">
                  {erro}
                </div>
              )}

              <div className="locais-modal-footer">
                <button
                  type="button"
                  className="locais-secondary-button"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="locais-primary-button"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : editando
                      ? "Salvar alterações"
                      : "Cadastrar local"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {confirmacao && (
        <div
          className="locais-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setConfirmacao(null);
            }
          }}
        >
          <section className="locais-modal locais-confirm-modal">
            <div className="locais-confirm-symbol">!</div>
            <h2>Excluir local?</h2>
            <p>
              Você está prestes a excluir o local{" "}
              <strong>{confirmacao.nome}</strong>. Deseja continuar?
            </p>

            <div className="locais-modal-footer">
              <button
                className="locais-secondary-button"
                onClick={() => setConfirmacao(null)}
              >
                Cancelar
              </button>
              <button className="locais-danger-button" onClick={excluirLocal}>
                Confirmar exclusão
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
