import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./index.css";
import {
  cadastrarEscala,
  cadastrarAtividades,
  atualizarEscala,
  excluirEscala as excluirEscalaAPI,
} from "../../services/api";
import toast from "react-hot-toast";

const diasSemana = [
  { id: 1, nome: "Segunda-feira", curto: "Segunda" },
  { id: 2, nome: "Terça-feira", curto: "Terça" },
  { id: 3, nome: "Quarta-feira", curto: "Quarta" },
  { id: 4, nome: "Quinta-feira", curto: "Quinta" },
  { id: 5, nome: "Sexta-feira", curto: "Sexta" },
];

const periodos = [
  { valor: "manha", nome: "Manhã" },
  { valor: "tarde", nome: "Tarde" },
  { valor: "noite", nome: "Noite" },
];

const formularioInicial = {
  funcionario_id: "",
  dia_semana: 1,
  periodo: "manha",
  entrada: "",
  saida: "",
  retorno: "",
  saida2: "",
  observacoes: "",
};

function formatarHora(hora) {
  return hora ? hora.slice(0, 5) : "";
}

function Escalas() {
  const [escalas, setEscalas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);
  const [locais, setLocais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [diaSelecionado, setDiaSelecionado] = useState(1);
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [filtroFuncionario, setFiltroFuncionario] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [escalaDetalhada, setEscalaDetalhada] = useState(null);

  const [form, setForm] = useState(formularioInicial);
  const [atividades, setAtividades] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    const [
      { data: funcionariosData, error: funcionariosError },
      { data: locaisData, error: locaisError },
      { data: escalasData, error: escalasError },
      { data: atividadesData, error: atividadesError },
    ] = await Promise.all([
      supabase.from("funcionarios").select("id, nome, ativo").order("nome"),
      supabase
        .from("locais")
        .select("id, nome, descricao, ativo")
        .order("nome"),
      supabase.from("escalas").select("*").order("dia_semana").order("entrada"),
      supabase.from("atividades").select("*").order("inicio"),
    ]);

    const erroConsulta =
      funcionariosError || locaisError || escalasError || atividadesError;

    if (erroConsulta) {
      setErro(erroConsulta.message);
      setCarregando(false);
      return;
    }

    const atividadesPorEscala = (atividadesData || []).reduce(
      (grupos, atividade) => {
        if (!grupos[atividade.escala_id]) {
          grupos[atividade.escala_id] = [];
        }

        grupos[atividade.escala_id].push(atividade);
        return grupos;
      },
      {},
    );

    setFuncionarios(funcionariosData || []);
    setLocais(locaisData || []);
    setEscalas(
      (escalasData || []).map((escala) => ({
        ...escala,
        atividades: atividadesPorEscala[escala.id] || [],
      })),
    );

    setCarregando(false);
  }

  const escalasFiltradas = useMemo(() => {
    return escalas.filter((escala) => {
      const correspondeDia = escala.dia_semana === diaSelecionado;
      const correspondePeriodo =
        !filtroPeriodo || escala.periodo === filtroPeriodo;
      const correspondeFuncionario =
        !filtroFuncionario || escala.funcionario_id === filtroFuncionario;

      return correspondeDia && correspondePeriodo && correspondeFuncionario;
    });
  }, [escalas, diaSelecionado, filtroPeriodo, filtroFuncionario]);

  function nomeFuncionario(id) {
    return (
      funcionarios.find((funcionario) => funcionario.id === id)?.nome ||
      "Funcionário"
    );
  }

  function nomeLocal(id) {
    return locais.find((local) => local.id === id)?.nome || "Local";
  }

  function nomePeriodo(valor) {
    return periodos.find((periodo) => periodo.valor === valor)?.nome || valor;
  }

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function limparFormulario() {
    setForm({
      ...formularioInicial,
      dia_semana: diaSelecionado,
    });
    setAtividades([]);
    setEditando(null);
  }

  function abrirCadastro() {
    limparFormulario();
    setModalAberto(true);
  }

  function abrirEdicao(escala) {
    setEditando(escala);
    setForm({
      funcionario_id: escala.funcionario_id,
      dia_semana: escala.dia_semana,
      periodo: escala.periodo,
      entrada: formatarHora(escala.entrada),
      saida: formatarHora(escala.saida),
      retorno: formatarHora(escala.retorno),
      saida2: formatarHora(escala.saida2),
      observacoes: escala.observacoes || "",
    });

    setAtividades(
      escala.atividades.map((atividade) => ({
        ...atividade,
        inicio: formatarHora(atividade.inicio),
        fim: formatarHora(atividade.fim),
      })),
    );

    setModalAberto(true);
  }

  function adicionarAtividade() {
    setAtividades((atual) => [
      ...atual,
      {
        id: crypto.randomUUID(),
        local_id: "",
        inicio: "",
        fim: "",
        descricao: "",
        nova: true,
      },
    ]);
  }

  function atualizarAtividade(id, campo, valor) {
    setAtividades((atual) =>
      atual.map((atividade) =>
        atividade.id === id ? { ...atividade, [campo]: valor } : atividade,
      ),
    );
  }

  function removerAtividade(id) {
    setAtividades((atual) => atual.filter((atividade) => atividade.id !== id));
  }

  async function salvarEscala(event) {
    event.preventDefault();

    if (!form.funcionario_id) {
      toast.error("Selecione um funcionário.");
      return;
    }

    if (!form.entrada || !form.saida2) {
      toast.error("Preencha os horários obrigatórios.");
      return;
    }

    if (
      atividades.some(
        (atividade) =>
          !atividade.local_id || !atividade.inicio || !atividade.fim,
      )
    ) {
      toast.error("Preencha o local e os horários de todas as atividades.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const dadosEscala = {
        funcionario_id: form.funcionario_id,
        dia_semana: Number(form.dia_semana),
        periodo: form.periodo,
        entrada: form.entrada,
        saida: form.saida || null,
        retorno: form.retorno || null,
        saida2: form.saida2,
        observacoes: form.observacoes.trim(),
      };

      const atividadesParaSalvar = atividades.map((atividade) => ({
        local_id: atividade.local_id,
        inicio: atividade.inicio,
        fim: atividade.fim,
        descricao: (atividade.descricao || "").trim(),
      }));

      if (editando) {
        await atualizarEscala(editando.id, dadosEscala, atividadesParaSalvar);

        toast.success("Escala atualizada com sucesso!");
      } else {
        const resultado = await cadastrarEscala(dadosEscala);
        const escalaId = resultado.dados.id;

        if (atividadesParaSalvar.length > 0) {
          const atividadesComEscala = atividadesParaSalvar.map((atividade) => ({
            ...atividade,
            escala_id: escalaId,
          }));

          await cadastrarAtividades(atividadesComEscala);
        }

        toast.success("Escala cadastrada com sucesso!");
      }

      await carregarDados();

      setModalAberto(false);
      limparFormulario();
    } catch (erro) {
      console.error("Erro ao salvar escala:", erro);

      setErro(erro.message || "Não foi possível salvar a escala.");
      toast.error(erro.message || "Não foi possível salvar a escala.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirDetalhes(escala) {
    setEscalaDetalhada(escala);
    setDetalhesAberto(true);
  }

  async function excluirEscala(id) {
    const confirmar = window.confirm("Deseja realmente excluir esta escala?");

    if (!confirmar) return;

    setSalvando(true);
    setErro("");

    try {
      await excluirEscalaAPI(id);

      setDetalhesAberto(false);
      setEscalaDetalhada(null);

      await carregarDados();

      toast.success("Escala excluída com sucesso!");
    } catch (erro) {
      console.error("Erro ao excluir escala:", erro);

      setErro(erro.message || "Não foi possível excluir a escala.");
      toast.error(erro.message || "Não foi possível excluir a escala.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="escalas-page">
      <header className="escalas-header">
        <div>
          <h1>Escalas</h1>
          <p>Organize os horários e as atividades dos funcionários.</p>
        </div>

        <button className="escala-btn-primary" onClick={abrirCadastro}>
          + Nova escala
        </button>
      </header>

      {erro && <div className="escalas-error">{erro}</div>}

      <section className="escala-filters">
        <div className="dias-semana">
          {diasSemana.map((dia) => (
            <button
              key={dia.id}
              className={`dia-button ${
                diaSelecionado === dia.id ? "dia-selecionado" : ""
              }`}
              onClick={() => setDiaSelecionado(dia.id)}
            >
              {dia.curto}
            </button>
          ))}
        </div>

        <div className="filtros-secundarios">
          <select
            value={filtroPeriodo}
            onChange={(event) => setFiltroPeriodo(event.target.value)}
            aria-label="Filtrar por período"
          >
            <option value="">Todos os períodos</option>
            {periodos.map((periodo) => (
              <option key={periodo.valor} value={periodo.valor}>
                {periodo.nome}
              </option>
            ))}
          </select>

          <select
            value={filtroFuncionario}
            onChange={(event) => setFiltroFuncionario(event.target.value)}
            aria-label="Filtrar por funcionário"
          >
            <option value="">Todos os funcionários</option>
            {funcionarios.map((funcionario) => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.nome}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="escalas-lista">
        <div className="escalas-lista-header">
          <div>
            <h2>{diasSemana.find((dia) => dia.id === diaSelecionado)?.nome}</h2>
            <p>{escalasFiltradas.length} escala(s) encontrada(s)</p>
          </div>
        </div>

        {carregando ? (
          <div className="escalas-empty">
            <p>Carregando escalas...</p>
          </div>
        ) : escalasFiltradas.length > 0 ? (
          <div className="escalas-grid">
            {escalasFiltradas.map((escala) => (
              <article className="escala-card" key={escala.id}>
                <div className="escala-card-top">
                  <div className="escala-funcionario">
                    <div className="escala-avatar">
                      {nomeFuncionario(escala.funcionario_id)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <h3>{nomeFuncionario(escala.funcionario_id)}</h3>
                      <span className="periodo-badge">
                        {nomePeriodo(escala.periodo)}
                      </span>
                    </div>
                  </div>

                  <button
                    className="escala-menu-button"
                    onClick={() => abrirEdicao(escala)}
                    aria-label="Editar escala"
                    title="Editar escala"
                  >
                    Editar
                  </button>
                </div>

                <div className="escala-horarios">
                  <div>
                    <span>Entrada</span>
                    <strong>{formatarHora(escala.entrada)}</strong>
                  </div>
                  <div>
                    <span>Almoço</span>
                    <strong>
                      {formatarHora(escala.saida) || "—"} –{" "}
                      {formatarHora(escala.retorno) || "—"}
                    </strong>
                  </div>
                  <div>
                    <span>Saída</span>
                    <strong>{formatarHora(escala.saida2)}</strong>
                  </div>
                </div>

                <div className="escala-card-footer">
                  <span>{escala.atividades.length} atividade(s)</span>
                  <button
                    className="escala-link-button"
                    onClick={() => abrirDetalhes(escala)}
                  >
                    Ver atividades →
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="escalas-empty">
            <div className="empty-icon">▤</div>
            <h3>Nenhuma escala encontrada</h3>
            <p>Não há escalas para os filtros selecionados.</p>
            <button className="escala-btn-primary" onClick={abrirCadastro}>
              Criar escala
            </button>
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="escala-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setModalAberto(false);
            }
          }}
        >
          <div
            className="escala-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="escala-modal-header">
              <div>
                <h2>{editando ? "Editar escala" : "Nova escala"}</h2>
                <p>Configure os horários e as atividades.</p>
              </div>

              <button
                type="button"
                className="escala-close"
                onClick={() => setModalAberto(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <form onSubmit={salvarEscala}>
              <div className="escala-form-grid">
                <div className="escala-field full">
                  <label htmlFor="funcionario">Funcionário</label>
                  <select
                    id="funcionario"
                    value={form.funcionario_id}
                    onChange={(event) =>
                      atualizarCampo("funcionario_id", event.target.value)
                    }
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
                </div>

                <div className="escala-field">
                  <label htmlFor="dia">Dia da semana</label>
                  <select
                    id="dia"
                    value={form.dia_semana}
                    onChange={(event) =>
                      atualizarCampo("dia_semana", event.target.value)
                    }
                  >
                    {diasSemana.map((dia) => (
                      <option key={dia.id} value={dia.id}>
                        {dia.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="escala-field">
                  <label htmlFor="periodo">Período</label>
                  <select
                    id="periodo"
                    value={form.periodo}
                    onChange={(event) =>
                      atualizarCampo("periodo", event.target.value)
                    }
                  >
                    {periodos.map((periodo) => (
                      <option key={periodo.valor} value={periodo.valor}>
                        {periodo.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="escala-field">
                  <label htmlFor="entrada">Entrada</label>
                  <input
                    id="entrada"
                    type="time"
                    value={form.entrada}
                    onChange={(event) =>
                      atualizarCampo("entrada", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="escala-field">
                  <label htmlFor="saida">Saída para almoço</label>
                  <input
                    id="saida"
                    type="time"
                    value={form.saida}
                    onChange={(event) =>
                      atualizarCampo("saida", event.target.value)
                    }
                  />
                </div>

                <div className="escala-field">
                  <label htmlFor="retorno">Retorno do almoço</label>
                  <input
                    id="retorno"
                    type="time"
                    value={form.retorno}
                    onChange={(event) =>
                      atualizarCampo("retorno", event.target.value)
                    }
                  />
                </div>

                <div className="escala-field">
                  <label htmlFor="saida2">Saída</label>
                  <input
                    id="saida2"
                    type="time"
                    value={form.saida2}
                    onChange={(event) =>
                      atualizarCampo("saida2", event.target.value)
                    }
                    required
                  />
                </div>

                <div className="escala-field full">
                  <label htmlFor="observacoes">Observações</label>
                  <textarea
                    id="observacoes"
                    rows="3"
                    value={form.observacoes}
                    onChange={(event) =>
                      atualizarCampo("observacoes", event.target.value)
                    }
                    placeholder="Observações sobre esta escala..."
                  />
                </div>
              </div>

              <div className="atividades-form-section">
                <div className="atividades-form-header">
                  <div>
                    <h3>Atividades</h3>
                    <p>Defina os locais e horários de atuação.</p>
                  </div>

                  <button
                    type="button"
                    className="atividade-add-button"
                    onClick={adicionarAtividade}
                  >
                    + Adicionar
                  </button>
                </div>

                {atividades.length === 0 && (
                  <div className="atividades-empty">
                    Nenhuma atividade adicionada.
                  </div>
                )}

                <div className="atividades-form-list">
                  {atividades.map((atividade, index) => (
                    <div className="atividade-form-card" key={atividade.id}>
                      <div className="atividade-form-top">
                        <strong>Atividade {index + 1}</strong>
                        <button
                          type="button"
                          className="atividade-remove"
                          onClick={() => removerAtividade(atividade.id)}
                        >
                          Remover
                        </button>
                      </div>

                      <div className="escala-form-grid">
                        <div className="escala-field full">
                          <label>Local</label>
                          <select
                            value={atividade.local_id}
                            onChange={(event) =>
                              atualizarAtividade(
                                atividade.id,
                                "local_id",
                                event.target.value,
                              )
                            }
                            required
                          >
                            <option value="">Selecione um local</option>
                            {locais
                              .filter((local) => local.ativo)
                              .map((local) => (
                                <option key={local.id} value={local.id}>
                                  {local.nome}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="escala-field">
                          <label>Início</label>
                          <input
                            type="time"
                            value={atividade.inicio}
                            onChange={(event) =>
                              atualizarAtividade(
                                atividade.id,
                                "inicio",
                                event.target.value,
                              )
                            }
                            required
                          />
                        </div>

                        <div className="escala-field">
                          <label>Fim</label>
                          <input
                            type="time"
                            value={atividade.fim}
                            onChange={(event) =>
                              atualizarAtividade(
                                atividade.id,
                                "fim",
                                event.target.value,
                              )
                            }
                            required
                          />
                        </div>

                        <div className="escala-field full">
                          <label>Descrição</label>
                          <input
                            type="text"
                            value={atividade.descricao || ""}
                            onChange={(event) =>
                              atualizarAtividade(
                                atividade.id,
                                "descricao",
                                event.target.value,
                              )
                            }
                            placeholder="Descreva a atividade"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {erro && <div className="escalas-error">{erro}</div>}

              <div className="escala-modal-actions">
                <button
                  type="button"
                  className="escala-btn-cancel"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="escala-btn-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : editando
                      ? "Salvar alterações"
                      : "Cadastrar escala"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalhesAberto && escalaDetalhada && (
        <div
          className="escala-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setDetalhesAberto(false);
            }
          }}
        >
          <div
            className="escala-modal detalhes-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="escala-modal-header">
              <div>
                <h2>Atividades da escala</h2>
                <p>
                  {nomeFuncionario(escalaDetalhada.funcionario_id)} ·{" "}
                  {
                    diasSemana.find(
                      (dia) => dia.id === escalaDetalhada.dia_semana,
                    )?.nome
                  }
                </p>
              </div>

              <button
                type="button"
                className="escala-close"
                onClick={() => setDetalhesAberto(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="detalhes-horario">
              <span>Período: {nomePeriodo(escalaDetalhada.periodo)}</span>
              <span>
                {formatarHora(escalaDetalhada.entrada)} às{" "}
                {formatarHora(escalaDetalhada.saida2)}
              </span>
            </div>

            {escalaDetalhada.atividades.length > 0 ? (
              <div className="detalhes-atividades">
                {escalaDetalhada.atividades.map((atividade) => (
                  <div className="detalhe-atividade" key={atividade.id}>
                    <div className="atividade-timeline" />
                    <div className="detalhe-atividade-content">
                      <span className="detalhe-atividade-horario">
                        {formatarHora(atividade.inicio)} –{" "}
                        {formatarHora(atividade.fim)}
                      </span>
                      <h3>{nomeLocal(atividade.local_id)}</h3>
                      <p>{atividade.descricao || "Sem descrição"}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="atividades-empty">
                Nenhuma atividade cadastrada nesta escala.
              </div>
            )}

            {escalaDetalhada.observacoes && (
              <div className="detalhes-observacoes">
                <strong>Observações</strong>
                <p>{escalaDetalhada.observacoes}</p>
              </div>
            )}

            <div className="detalhes-actions">
              <button
                className="escala-btn-delete"
                onClick={() => excluirEscala(escalaDetalhada.id)}
              >
                Excluir escala
              </button>
              <button
                className="escala-btn-primary"
                onClick={() => {
                  setDetalhesAberto(false);
                  abrirEdicao(escalaDetalhada);
                }}
              >
                Editar escala
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Escalas;
