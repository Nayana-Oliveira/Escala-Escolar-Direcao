import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  Search,
  Plus,
  X,
  Clock,
  MapPin,
  CalendarDays,
  Filter,
  ClipboardList,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import "./index.css";

const DIAS_SEMANA = {
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
};

function obterDiaSemana() {
  const dia = new Date().getDay();
  return dia === 0 ? 7 : dia;
}

function obterHorarioAtual() {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, "0")}:${String(
    agora.getMinutes(),
  ).padStart(2, "0")}:00`;
}

function converterMinutos(horario) {
  if (!horario) return null;

  const [horas, minutos] = horario.split(":").map(Number);
  return horas * 60 + minutos;
}

function formatarHorario(horario) {
  return horario ? horario.slice(0, 5) : "—";
}

function verificarIntervalo(inicio, fim, atual) {
  const inicioMinutos = converterMinutos(inicio);
  const fimMinutos = converterMinutos(fim);
  const atualMinutos = converterMinutos(atual);

  if (inicioMinutos === null || fimMinutos === null || atualMinutos === null) {
    return false;
  }

  return atualMinutos >= inicioMinutos && atualMinutos < fimMinutos;
}

function Dashboard() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  const [descricao, setDescricao] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [horarioOcorrencia, setHorarioOcorrencia] = useState("");

  const [ocorrenciasHoje, setOcorrenciasHoje] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [agora, setAgora] = useState(new Date());

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAgora(new Date());
    }, 60000);

    return () => clearInterval(intervalo);
  }, []);

  const diaAtual = agora.getDay();
  const diaBanco = diaAtual === 0 ? 7 : diaAtual;
  const horarioAtual = `${String(agora.getHours()).padStart(2, "0")}:${String(
    agora.getMinutes(),
  ).padStart(2, "0")}:00`;

  useEffect(() => {
    async function carregarDados() {
      setLoading(true);
      setErro("");

      try {
        const dataHoje = new Date().toLocaleDateString("en-CA");

        const [
          { data: listaFuncionarios, error: erroFuncionarios },
          { data: escalas, error: erroEscalas },
          { data: atividades, error: erroAtividades },
          { data: locais, error: erroLocais },
          { count, error: erroOcorrencias },
        ] = await Promise.all([
          supabase
            .from("funcionarios")
            .select("id, nome, ativo, created_at")
            .eq("ativo", true)
            .order("nome"),

          supabase
            .from("escalas")
            .select(
              "id, funcionario_id, dia_semana, periodo, entrada, saida, retorno, saida2, observacoes",
            )
            .eq("dia_semana", diaBanco),

          supabase
            .from("atividades")
            .select("id, escala_id, local_id, inicio, fim, descricao"),

          supabase
            .from("locais")
            .select("id, nome, descricao, ativo")
            .eq("ativo", true),

          supabase
            .from("ocorrencias")
            .select("id", { count: "exact", head: true })
            .eq("data", dataHoje),
        ]);

        if (erroFuncionarios) throw erroFuncionarios;
        if (erroEscalas) throw erroEscalas;
        if (erroAtividades) throw erroAtividades;
        if (erroLocais) throw erroLocais;
        if (erroOcorrencias) throw erroOcorrencias;

        const atividadesPorEscala = {};

        atividades.forEach((atividade) => {
          if (!atividadesPorEscala[atividade.escala_id]) {
            atividadesPorEscala[atividade.escala_id] = [];
          }

          atividadesPorEscala[atividade.escala_id].push(atividade);
        });

        const locaisPorId = Object.fromEntries(
          locais.map((local) => [local.id, local]),
        );

        const escalasPorFuncionario = {};

        escalas.forEach((escala) => {
          if (!escalasPorFuncionario[escala.funcionario_id]) {
            escalasPorFuncionario[escala.funcionario_id] = [];
          }

          escalasPorFuncionario[escala.funcionario_id].push({
            ...escala,
            atividades: atividadesPorEscala[escala.id] || [],
          });
        });

        const lista = listaFuncionarios.map((funcionario) => {
          const escalasFuncionario =
            escalasPorFuncionario[funcionario.id] || [];

          let status = "Sem escala no dia";
          let posto = "—";
          let atividadeAtual = null;
          let escalaAtual = null;
          let horario = "—";

          for (const escala of escalasFuncionario) {
            const dentroExpediente =
              verificarIntervalo(escala.entrada, escala.saida, horarioAtual) ||
              verificarIntervalo(escala.retorno, escala.saida2, horarioAtual);

            const noAlmoco = verificarIntervalo(
              escala.saida,
              escala.retorno,
              horarioAtual,
            );

            if (dentroExpediente) {
              escalaAtual = escala;
              status = "Em expediente";

              horario = `${formatarHorario(
                escala.entrada,
              )} – ${formatarHorario(escala.saida)} / ${formatarHorario(
                escala.retorno,
              )} – ${formatarHorario(escala.saida2)}`;

              atividadeAtual =
                escala.atividades.find((atividade) =>
                  verificarIntervalo(
                    atividade.inicio,
                    atividade.fim,
                    horarioAtual,
                  ),
                ) || null;

              if (atividadeAtual) {
                const local = locaisPorId[atividadeAtual.local_id];
                posto = local?.nome || "Local não disponível";
              } else {
                posto = "Sem atividade neste horário";
              }

              break;
            }

            if (noAlmoco) {
              escalaAtual = escala;
              status = "Intervalo";
              horario = `${formatarHorario(
                escala.entrada,
              )} – ${formatarHorario(escala.saida)} / ${formatarHorario(
                escala.retorno,
              )} – ${formatarHorario(escala.saida2)}`;
              posto = "Intervalo para almoço";
            }

            if (
              !escalaAtual &&
              (verificarIntervalo(escala.entrada, escala.saida, horarioAtual) ||
                verificarIntervalo(escala.retorno, escala.saida2, horarioAtual))
            ) {
              escalaAtual = escala;
            }
          }

          if (escalasFuncionario.length > 0 && !escalaAtual) {
            status = "Fora do expediente";
            const escala = escalasFuncionario[0];
            horario = `${formatarHorario(
              escala.entrada,
            )} – ${formatarHorario(escala.saida)} / ${formatarHorario(
              escala.retorno,
            )} – ${formatarHorario(escala.saida2)}`;
          }

          return {
            ...funcionario,
            cargo: "Funcionário",
            posto,
            horario,
            status,
            atividadeAtual,
            escalaAtual,
          };
        });

        setFuncionarios(lista);
        setOcorrenciasHoje(count || 0);
      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
        setErro("Não foi possível carregar os dados do Dashboard.");
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, [diaBanco, horarioAtual]);

  const emExpediente = funcionarios.filter(
    (funcionario) => funcionario.status === "Em expediente",
  ).length;

  const funcionariosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase("pt-BR");

    return funcionarios.filter((funcionario) => {
      const correspondePesquisa =
        funcionario.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        funcionario.posto.toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeStatus =
        filtroStatus === "Todos" || funcionario.status === filtroStatus;

      return correspondePesquisa && correspondeStatus;
    });
  }, [funcionarios, pesquisa, filtroStatus]);

  function abrirOcorrencia(funcionario = null) {
    setFuncionarioSelecionado(funcionario);
    setDescricao("");
    setHorarioOcorrencia("");
    setDataOcorrencia(new Date().toLocaleDateString("en-CA"));
    setMensagem("");
    setModalAberto(true);
  }

  function fecharOcorrencia() {
    if (salvando) return;

    setModalAberto(false);
    setFuncionarioSelecionado(null);
    setDescricao("");
    setHorarioOcorrencia("");
    setMensagem("");
  }

  async function registrarOcorrencia(event) {
    event.preventDefault();

    if (!funcionarioSelecionado) {
      setMensagem("Selecione um funcionário.");
      return;
    }

    if (!descricao.trim() || !dataOcorrencia || !horarioOcorrencia) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    setSalvando(true);
    setMensagem("");

    const { error } = await supabase.from("ocorrencias").insert({
      funcionario_id: funcionarioSelecionado.id,
      atividade_id: funcionarioSelecionado.atividadeAtual?.id || null,
      data: dataOcorrencia,
      horario: horarioOcorrencia,
      descricao: descricao.trim(),
    });

    setSalvando(false);

    if (error) {
      console.error("Erro ao registrar ocorrência:", error);
      setMensagem("Não foi possível registrar a ocorrência.");
      return;
    }

    setOcorrenciasHoje((atual) =>
      dataOcorrencia === new Date().toLocaleDateString("en-CA")
        ? atual + 1
        : atual,
    );

    setMensagem("Ocorrência registrada com sucesso.");
  }

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="section-eyebrow">ACOMPANHAMENTO DIÁRIO</span>
          <h1>Monitoramento de escalas</h1>
          <p>Acompanhe os funcionários e suas atividades previstas.</p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={16} />
          <span>
            {agora.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <section className="dashboard-cards">
        <article className="summary-card">
          <div className="summary-icon neutral">
            <Users size={20} />
          </div>
          <div>
            <span>Total de funcionários</span>
            <strong>{funcionarios.length}</strong>
            <small>Funcionários ativos cadastrados</small>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon success">
            <UserCheck size={20} />
          </div>
          <div>
            <span>Em expediente</span>
            <strong>{emExpediente}</strong>
            <small>Funcionários dentro do horário previsto</small>
          </div>
        </article>

        <article className="summary-card">
          <div className="summary-icon danger">
            <ClipboardList size={20} />
          </div>
          <div>
            <span>Ocorrências hoje</span>
            <strong>{ocorrenciasHoje}</strong>
            <small>Registros no banco de dados</small>
          </div>
        </article>
      </section>

      <section className="monitoring-section">
        <div className="monitoring-header">
          <div>
            <h2>Funcionários e postos</h2>
            <p>Situação calculada com base nas escalas cadastradas.</p>
          </div>

          <button className="primary-button" onClick={() => abrirOcorrencia()}>
            <Plus size={17} />
            Registrar ocorrência
          </button>
        </div>

        <div className="monitoring-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              type="search"
              placeholder="Buscar funcionário ou posto..."
              value={pesquisa}
              onChange={(event) => setPesquisa(event.target.value)}
            />
          </div>

          <div className="filter-box">
            <Filter size={16} />
            <select
              value={filtroStatus}
              onChange={(event) => setFiltroStatus(event.target.value)}
              aria-label="Filtrar por situação"
            >
              <option value="Todos">Todos os status</option>
              <option value="Em expediente">Em expediente</option>
              <option value="Intervalo">Intervalo</option>
              <option value="Fora do expediente">Fora do expediente</option>
              <option value="Sem escala no dia">Sem escala no dia</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="monitoring-table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Posto / Local</th>
                <th>Horário</th>
                <th>Status</th>
                <th className="actions-column">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Carregando escalas...
                  </td>
                </tr>
              ) : erro ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {erro}
                  </td>
                </tr>
              ) : funcionariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              ) : (
                funcionariosFiltrados.map((funcionario) => (
                  <tr key={funcionario.id}>
                    <td>
                      <div className="employee-cell">
                        <div className="employee-avatar">
                          {funcionario.nome.charAt(0)}
                        </div>
                        <div>
                          <strong>{funcionario.nome}</strong>
                          <span>{funcionario.cargo}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="location-cell">
                        <MapPin size={14} />
                        {funcionario.posto}
                      </div>
                    </td>

                    <td>
                      <div className="time-cell">
                        <Clock size={14} />
                        {funcionario.horario}
                      </div>
                    </td>

                    <td>
                      <span className="status-badge">
                        <span className="status-dot" />
                        {funcionario.status}
                      </span>
                    </td>

                    <td className="actions-column">
                      <button
                        className="occurrence-button"
                        onClick={() => abrirOcorrencia(funcionario)}
                      >
                        <ClipboardList size={14} />
                        Registrar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          Exibindo {funcionariosFiltrados.length} de {funcionarios.length}{" "}
          funcionários
        </div>
      </section>

      {modalAberto && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharOcorrencia();
            }
          }}
        >
          <section
            className="occurrence-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="occurrence-title"
          >
            <div className="modal-header">
              <div>
                <span className="section-eyebrow">MONITORAMENTO</span>
                <h2 id="occurrence-title">Registrar ocorrência</h2>
              </div>

              <button
                className="modal-close"
                onClick={fecharOcorrencia}
                aria-label="Fechar"
                type="button"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={registrarOcorrencia}>
              <label>
                Funcionário
                <select
                  value={funcionarioSelecionado?.id ?? ""}
                  onChange={(event) => {
                    const selecionado = funcionarios.find(
                      (item) => item.id === event.target.value,
                    );
                    setFuncionarioSelecionado(selecionado || null);
                  }}
                  required
                >
                  <option value="" disabled>
                    Selecione o funcionário
                  </option>

                  {funcionarios.map((funcionario) => (
                    <option key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome}
                    </option>
                  ))}
                </select>
              </label>

              <div className="modal-fields">
                <label>
                  Data
                  <input
                    type="date"
                    value={dataOcorrencia}
                    onChange={(event) => setDataOcorrencia(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Horário
                  <input
                    type="time"
                    value={horarioOcorrencia}
                    onChange={(event) =>
                      setHorarioOcorrencia(event.target.value)
                    }
                    required
                  />
                </label>
              </div>

              <label>
                Descrição da ocorrência
                <textarea
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva o que foi observado..."
                  rows={4}
                  required
                />
              </label>

              {mensagem && (
                <p className="form-message" role="status">
                  {mensagem}
                </p>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={fecharOcorrencia}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={salvando}
                >
                  {salvando ? "Salvando..." : "Registrar ocorrência"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
