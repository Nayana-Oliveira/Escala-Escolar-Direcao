import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  listarOcorrencias as listarOcorrenciasAPI,
  excluirOcorrencia as excluirOcorrenciaAPI,
} from "../../services/api";
import toast from "react-hot-toast";
import "./index.css";

function formatarData(data) {
  if (!data) return "";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "";
  return new Date(dataHora).toLocaleString("pt-BR");
}

function formatarHora(horario) {
  return horario ? horario.slice(0, 5) : "";
}

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [atividadeSelecionada, setAtividadeSelecionada] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [descricao, setDescricao] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroFuncionario, setFiltroFuncionario] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const [modalCadastro, setModalCadastro] = useState(false);
  const [ocorrenciaDetalhe, setOcorrenciaDetalhe] = useState(null);
  const [ocorrenciaExcluir, setOcorrenciaExcluir] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        funcionariosRes,
        escalasRes,
        atividadesRes,
        locaisRes,
        ocorrenciasRes,
      ] = await Promise.all([
        supabase.from("funcionarios").select("id, nome, ativo").order("nome"),

        supabase.from("escalas").select("id, funcionario_id"),

        supabase
          .from("atividades")
          .select("id, escala_id, local_id, inicio, fim, descricao")
          .order("inicio"),

        supabase.from("locais").select("id, nome"),

        listarOcorrenciasAPI(),
      ]);

      if (funcionariosRes.error) throw funcionariosRes.error;
      if (escalasRes.error) throw escalasRes.error;
      if (atividadesRes.error) throw atividadesRes.error;
      if (locaisRes.error) throw locaisRes.error;

      const funcionariosDados = funcionariosRes.data || [];
      const escalas = escalasRes.data || [];
      const atividadesDados = atividadesRes.data || [];
      const locaisDados = locaisRes.data || [];
      const ocorrenciasDados = Array.isArray(ocorrenciasRes)
        ? ocorrenciasRes
        : [];

      const atividadesComFuncionario = atividadesDados.map((atividade) => {
        const escala = escalas.find(
          (item) => String(item.id) === String(atividade.escala_id),
        );

        const local = locaisDados.find(
          (item) => String(item.id) === String(atividade.local_id),
        );

        return {
          ...atividade,
          funcionario_id: escala?.funcionario_id ?? null,
          local_nome: local?.nome || "Local não informado",
        };
      });

      const ocorrenciasComDados = ocorrenciasDados.map((ocorrencia) => {
        const funcionario = funcionariosDados.find(
          (item) => String(item.id) === String(ocorrencia.funcionario_id),
        );

        const atividade = atividadesComFuncionario.find(
          (item) => String(item.id) === String(ocorrencia.atividade_id),
        );

        return {
          ...ocorrencia,
          funcionario_nome: funcionario?.nome || "Funcionário não encontrado",
          atividade: atividade || null,
          atividade_descricao:
            atividade?.descricao || "Atividade não informada",
          local_nome: atividade?.local_nome || "Local não informado",
        };
      });

      setFuncionarios(funcionariosDados);
      setAtividades(atividadesComFuncionario);
      setLocais(locaisDados);
      setOcorrencias(ocorrenciasComDados);

      console.log("Atividades carregadas:", atividadesComFuncionario);
      console.log("Locais carregados:", locaisDados);
    } catch (erro) {
      console.error("Erro ao carregar dados:", erro);
      setErro("Não foi possível carregar os dados das ocorrências.");
      toast.error("Não foi possível carregar os dados das ocorrências.");
    } finally {
      setCarregando(false);
    }
  }

  const atividadesDisponiveis = useMemo(() => {
    if (!funcionarioSelecionado) return [];

    return atividades.filter(
      (atividade) =>
        String(atividade.funcionario_id) === String(funcionarioSelecionado),
    );
  }, [atividades, funcionarioSelecionado]);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ocorrencias.filter((ocorrencia) => {
      const funcionario = funcionarios.find(
        (item) => String(item.id) === String(ocorrencia.funcionario_id),
      );

      const atividade = atividades.find(
        (item) => String(item.id) === String(ocorrencia.atividade_id),
      );

      const local = locais.find(
        (item) => String(item.id) === String(atividade?.local_id),
      );

      const textoAtividade = [local?.nome, atividade?.descricao]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const correspondeBusca =
        !termo ||
        funcionario?.nome?.toLowerCase().includes(termo) ||
        textoAtividade.includes(termo) ||
        (ocorrencia.descricao || "").toLowerCase().includes(termo);

      const correspondeFuncionario =
        !filtroFuncionario ||
        String(ocorrencia.funcionario_id) === String(filtroFuncionario);

      const correspondeData = !filtroData || ocorrencia.data === filtroData;

      return correspondeBusca && correspondeFuncionario && correspondeData;
    });
  }, [
    ocorrencias,
    funcionarios,
    atividades,
    locais,
    busca,
    filtroFuncionario,
    filtroData,
  ]);

  function limparFormulario() {
    setFuncionarioSelecionado("");
    setAtividadeSelecionada("");
    setData("");
    setHorario("");
    setDescricao("");
  }

  function abrirCadastro() {
    setErro("");
    limparFormulario();
    setModalCadastro(true);
  }

  async function cadastrarOcorrencia(event) {
    event.preventDefault();

    if (
      !funcionarioSelecionado ||
      !atividadeSelecionada ||
      !data ||
      !horario ||
      !descricao.trim()
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const novaOcorrencia = {
        funcionario_id: funcionarioSelecionado,
        atividade_id: atividadeSelecionada,
        data,
        horario,
        descricao: descricao.trim(),
      };

      const { error } = await supabase
        .from("ocorrencias")
        .insert(novaOcorrencia);

      if (error) throw error;

      await carregarDados();

      setModalCadastro(false);
      limparFormulario();

      toast.success("Ocorrência registrada com sucesso!");
    } catch (erro) {
      console.error("Erro ao cadastrar ocorrência:", erro);
      setErro(erro.message);
      toast.error("Não foi possível registrar a ocorrência.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirOcorrencia() {
    if (!ocorrenciaExcluir) return;

    try {
      await excluirOcorrenciaAPI(ocorrenciaExcluir.id);

      setOcorrencias((anterior) =>
        anterior.filter((item) => item.id !== ocorrenciaExcluir.id),
      );

      setOcorrenciaExcluir(null);
      setOcorrenciaDetalhe(null);

      toast.success("Ocorrência excluída com sucesso!");
    } catch (erro) {
      console.error("Erro ao excluir ocorrência:", erro);
      toast.error(erro.message || "Não foi possível excluir a ocorrência.");
    }
  }

  function obterFuncionario(id) {
    return (
      funcionarios.find((item) => String(item.id) === String(id))?.nome ||
      "Funcionário"
    );
  }

  function obterAtividade(id) {
    const atividade = atividades.find((item) => String(item.id) === String(id));

    if (!atividade) return "Atividade não identificada";

    const local = locais.find(
      (item) => String(item.id) === String(atividade.local_id),
    );

    return (
      [local?.nome, atividade.descricao].filter(Boolean).join(" — ") ||
      "Atividade"
    );
  }

  return (
    <main className="ocorrencias-page">
      <header className="ocorrencias-header">
        <div>
          <span className="ocorrencias-eyebrow">Gerenciamento</span>
          <h1>Ocorrências</h1>
          <p>
            Registre e acompanhe as ocorrências relacionadas às atividades dos
            funcionários.
          </p>
        </div>

        <button className="ocorrencias-primary-button" onClick={abrirCadastro}>
          <span>+</span>
          Nova ocorrência
        </button>
      </header>

      {erro && (
        <div className="ocorrencias-error" role="alert">
          {erro}
        </div>
      )}

      <section className="ocorrencias-summary">
        <div className="ocorrencias-summary-card">
          <div className="summary-icon">!</div>
          <div>
            <span>Total de ocorrências</span>
            <strong>{ocorrencias.length}</strong>
          </div>
        </div>

        <div className="ocorrencias-summary-card">
          <div className="summary-icon summary-icon-light">▤</div>
          <div>
            <span>Exibidas na lista</span>
            <strong>{ocorrenciasFiltradas.length}</strong>
          </div>
        </div>
      </section>

      <section className="ocorrencias-list-section">
        <div className="ocorrencias-list-header">
          <div>
            <h2>Registros</h2>
            <p>Consulte os registros realizados.</p>
          </div>
        </div>

        <div className="ocorrencias-filters">
          <div className="ocorrencias-search">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Buscar por funcionário, atividade ou descrição..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <select
            value={filtroFuncionario}
            onChange={(event) => setFiltroFuncionario(event.target.value)}
          >
            <option value="">Todos os funcionários</option>
            {funcionarios.map((funcionario) => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.nome}
              </option>
            ))}
          </select>

          <input
            type="date"
            aria-label="Filtrar por data"
            value={filtroData}
            onChange={(event) => setFiltroData(event.target.value)}
          />

          {(busca || filtroFuncionario || filtroData) && (
            <button
              className="ocorrencias-clear-button"
              onClick={() => {
                setBusca("");
                setFiltroFuncionario("");
                setFiltroData("");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>

        <div className="ocorrencias-table-wrapper">
          <table className="ocorrencias-table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Atividade</th>
                <th>Data</th>
                <th>Horário</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan="6">
                    <div className="ocorrencias-empty">
                      <strong>Carregando ocorrências...</strong>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {ocorrenciasFiltradas.map((ocorrencia) => (
                    <tr key={ocorrencia.id}>
                      <td>
                        <div className="ocorrencias-person">
                          <span className="person-avatar">
                            {obterFuncionario(ocorrencia.funcionario_id)
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                          <span>
                            {obterFuncionario(ocorrencia.funcionario_id)}
                          </span>
                        </div>
                      </td>

                      <td>{obterAtividade(ocorrencia.atividade_id)}</td>

                      <td>{formatarData(ocorrencia.data)}</td>
                      <td>{formatarHora(ocorrencia.horario)}</td>

                      <td>
                        <span className="ocorrencias-description">
                          {ocorrencia.descricao}
                        </span>
                      </td>

                      <td>
                        <div className="ocorrencias-actions">
                          <button
                            className="action-button"
                            title="Ver detalhes"
                            aria-label="Ver detalhes"
                            onClick={() => setOcorrenciaDetalhe(ocorrencia)}
                          >
                            Ver
                          </button>

                          <button
                            className="action-button action-delete"
                            title="Excluir ocorrência"
                            aria-label="Excluir ocorrência"
                            onClick={() => setOcorrenciaExcluir(ocorrencia)}
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {ocorrenciasFiltradas.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        <div className="ocorrencias-empty">
                          <strong>Nenhuma ocorrência encontrada</strong>
                          <span>
                            Experimente alterar os filtros ou registrar uma nova
                            ocorrência.
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalCadastro && (
        <div
          className="ocorrencias-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalCadastro(false);
            }
          }}
        >
          <section className="ocorrencias-modal">
            <div className="ocorrencias-modal-header">
              <div>
                <span className="ocorrencias-eyebrow">Novo registro</span>
                <h2>Registrar ocorrência</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setModalCadastro(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={cadastrarOcorrencia}>
              <div className="ocorrencias-form-grid">
                <label>
                  Funcionário
                  <select
                    value={funcionarioSelecionado}
                    onChange={(event) => {
                      setFuncionarioSelecionado(event.target.value);
                      setAtividadeSelecionada("");
                    }}
                    required
                  >
                    <option value="">Selecione um funcionário</option>

                    {funcionarios
                      .filter((funcionario) => funcionario.ativo)
                      .map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </option>
                      ))}
                  </select>
                </label>

                <label>
                  Atividade
                  <select
                    value={atividadeSelecionada}
                    onChange={(event) =>
                      setAtividadeSelecionada(event.target.value)
                    }
                    disabled={!funcionarioSelecionado}
                    required
                  >
                    <option value="">Selecione uma atividade</option>

                    {atividadesDisponiveis.map((atividade) => (
                      <option key={atividade.id} value={atividade.id}>
                        {obterAtividade(atividade.id)}
                      </option>
                    ))}
                  </select>
                  {funcionarioSelecionado &&
                    atividadesDisponiveis.length === 0 && (
                      <small>
                        Nenhuma atividade encontrada para este funcionário.
                      </small>
                    )}
                </label>

                <label>
                  Data
                  <input
                    type="date"
                    value={data}
                    onChange={(event) => setData(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Horário
                  <input
                    type="time"
                    value={horario}
                    onChange={(event) => setHorario(event.target.value)}
                    required
                  />
                </label>

                <label className="form-full">
                  Descrição
                  <textarea
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder="Descreva o que aconteceu..."
                    rows="5"
                    maxLength="1000"
                    required
                  />
                  <small>{descricao.length}/1000 caracteres</small>
                </label>
              </div>

              {erro && (
                <div className="ocorrencias-error" role="alert">
                  {erro}
                </div>
              )}

              <div className="ocorrencias-modal-footer">
                <button
                  type="button"
                  className="ocorrencias-secondary-button"
                  onClick={() => setModalCadastro(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="ocorrencias-primary-button"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Salvar ocorrência"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {ocorrenciaDetalhe && (
        <div
          className="ocorrencias-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOcorrenciaDetalhe(null);
            }
          }}
        >
          <section className="ocorrencias-modal ocorrencias-detail-modal">
            <div className="ocorrencias-modal-header">
              <div>
                <span className="ocorrencias-eyebrow">Consulta</span>
                <h2>Detalhes da ocorrência</h2>
              </div>

              <button
                className="modal-close"
                onClick={() => setOcorrenciaDetalhe(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="ocorrencias-detail-grid">
              <div>
                <span>Funcionário</span>
                <strong>
                  {obterFuncionario(ocorrenciaDetalhe.funcionario_id)}
                </strong>
              </div>

              <div>
                <span>Atividade</span>
                <strong>
                  {obterAtividade(ocorrenciaDetalhe.atividade_id)}
                </strong>
              </div>

              <div>
                <span>Data</span>
                <strong>{formatarData(ocorrenciaDetalhe.data)}</strong>
              </div>

              <div>
                <span>Horário</span>
                <strong>{formatarHora(ocorrenciaDetalhe.horario)}</strong>
              </div>

              <div className="detail-full">
                <span>Descrição</span>
                <p>{ocorrenciaDetalhe.descricao}</p>
              </div>

              <div className="detail-full">
                <span>Registrado em</span>
                <strong>
                  {formatarDataHora(ocorrenciaDetalhe.registrado_em)}
                </strong>
              </div>
            </div>

            <div className="ocorrencias-modal-footer">
              <button
                className="ocorrencias-secondary-button"
                onClick={() => setOcorrenciaDetalhe(null)}
              >
                Fechar
              </button>

              <button
                className="ocorrencias-danger-button"
                onClick={() => setOcorrenciaExcluir(ocorrenciaDetalhe)}
              >
                Excluir ocorrência
              </button>
            </div>
          </section>
        </div>
      )}

      {ocorrenciaExcluir && (
        <div
          className="ocorrencias-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOcorrenciaExcluir(null);
            }
          }}
        >
          <section className="ocorrencias-modal ocorrencias-confirm-modal">
            <div className="confirm-symbol">!</div>
            <h2>Excluir ocorrência?</h2>
            <p>Esta ação removerá o registro da lista. Deseja continuar?</p>

            {erro && (
              <div className="ocorrencias-error" role="alert">
                {erro}
              </div>
            )}

            <div className="ocorrencias-modal-footer">
              <button
                className="ocorrencias-secondary-button"
                onClick={() => setOcorrenciaExcluir(null)}
              >
                Cancelar
              </button>

              <button
                className="ocorrencias-danger-button"
                onClick={excluirOcorrencia}
              >
                Confirmar exclusão
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
