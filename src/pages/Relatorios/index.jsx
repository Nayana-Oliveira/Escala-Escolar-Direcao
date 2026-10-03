import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { listarOcorrencias as listarOcorrenciasAPI } from "../../services/api";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import "./index.css";

const diasSemana = [
  { id: 0, nome: "Domingo" },
  { id: 1, nome: "Segunda-feira" },
  { id: 2, nome: "Terça-feira" },
  { id: 3, nome: "Quarta-feira" },
  { id: 4, nome: "Quinta-feira" },
  { id: 5, nome: "Sexta-feira" },
  { id: 6, nome: "Sábado" },
];

export default function Relatorios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [locais, setLocais] = useState([]);
  const [ocorrencias, setOcorrencias] = useState([]);

  const [funcionarioFiltro, setFuncionarioFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    try {
      const [
        funcionariosRes,
        escalasRes,
        atividadesRes,
        locaisRes,
        ocorrenciasRes,
      ] = await Promise.all([
        supabase.from("funcionarios").select("*"),
        supabase.from("escalas").select("*"),
        supabase.from("atividades").select("*"),
        supabase.from("locais").select("*"),
        listarOcorrenciasAPI(),
      ]);

      if (funcionariosRes.error) throw funcionariosRes.error;
      if (escalasRes.error) throw escalasRes.error;
      if (atividadesRes.error) throw atividadesRes.error;
      if (locaisRes.error) throw locaisRes.error;

      setFuncionarios(funcionariosRes.data || []);
      setEscalas(escalasRes.data || []);
      setAtividades(atividadesRes.data || []);
      setLocais(locaisRes.data || []);

      setOcorrencias(
        Array.isArray(ocorrenciasRes)
          ? ocorrenciasRes
          : ocorrenciasRes?.data || [],
      );
    } catch (erro) {
      console.error("Erro ao carregar relatórios:", erro);
      toast.error("Não foi possível carregar os relatórios.");
    } finally {
      setCarregando(false);
    }
  }

  const funcionarioPorId = useMemo(() => {
    return Object.fromEntries(
      funcionarios.map((funcionario) => [String(funcionario.id), funcionario]),
    );
  }, [funcionarios]);

  const localPorId = useMemo(() => {
    return Object.fromEntries(locais.map((local) => [String(local.id), local]));
  }, [locais]);

  const escalasFiltradas = useMemo(() => {
    if (!funcionarioFiltro) return escalas;

    return escalas.filter(
      (escala) => String(escala.funcionario_id) === String(funcionarioFiltro),
    );
  }, [escalas, funcionarioFiltro]);

  const atividadesFiltradas = useMemo(() => {
    const idsEscalas = new Set(
      escalasFiltradas.map((escala) => String(escala.id)),
    );

    return atividades.filter((atividade) =>
      idsEscalas.has(String(atividade.escala_id)),
    );
  }, [atividades, escalasFiltradas]);

  const ocorrenciasFiltradas = useMemo(() => {
    return ocorrencias.filter((ocorrencia) => {
      const correspondeFuncionario =
        !funcionarioFiltro ||
        String(ocorrencia.funcionario_id) === String(funcionarioFiltro);

      const correspondeInicio = !dataInicio || ocorrencia.data >= dataInicio;

      const correspondeFim = !dataFim || ocorrencia.data <= dataFim;

      return correspondeFuncionario && correspondeInicio && correspondeFim;
    });
  }, [ocorrencias, funcionarioFiltro, dataInicio, dataFim]);

  const escalasPorDia = useMemo(() => {
    return diasSemana.map((dia) => ({
      nome: dia.nome,
      total: escalasFiltradas.filter(
        (escala) => Number(escala.dia_semana) === dia.id,
      ).length,
    }));
  }, [escalasFiltradas]);

  const atividadesPorLocal = useMemo(() => {
    const contagem = {};

    atividadesFiltradas.forEach((atividade) => {
      const local = localPorId[String(atividade.local_id)];
      const nomeLocal = local?.nome || "Local não identificado";

      contagem[nomeLocal] = (contagem[nomeLocal] || 0) + 1;
    });

    return Object.entries(contagem).map(([nome, total]) => ({
      nome,
      total,
    }));
  }, [atividadesFiltradas, localPorId]);

  const ocorrenciasPorPeriodo = useMemo(() => {
    const contagem = {};

    ocorrenciasFiltradas.forEach((ocorrencia) => {
      const horario = ocorrencia.horario || "";
      const hora = Number(horario.split(":")[0]);

      let periodo = "Não identificado";

      if (!Number.isNaN(hora)) {
        if (hora >= 5 && hora < 12) {
          periodo = "Manhã";
        } else if (hora >= 12 && hora < 18) {
          periodo = "Tarde";
        } else if (hora >= 18 && hora < 24) {
          periodo = "Noite";
        } else {
          periodo = "Madrugada";
        }
      }

      contagem[periodo] = (contagem[periodo] || 0) + 1;
    });

    return Object.entries(contagem).map(([nome, total]) => ({
      nome,
      total,
    }));
  }, [ocorrenciasFiltradas]);

  const totalFuncionarios = useMemo(() => {
    if (!funcionarioFiltro) {
      return funcionarios.filter((funcionario) => funcionario.ativo !== false)
        .length;
    }

    return funcionarios.some(
      (funcionario) =>
        String(funcionario.id) === String(funcionarioFiltro) &&
        funcionario.ativo !== false,
    )
      ? 1
      : 0;
  }, [funcionarios, funcionarioFiltro]);

  function exportarExcel() {
    try {
      const dadosEscalas = escalasFiltradas.map((escala) => {
        const funcionario = funcionarioPorId[String(escala.funcionario_id)];
        const dia = diasSemana.find(
          (item) => item.id === Number(escala.dia_semana),
        );

        return {
          Funcionário: funcionario?.nome || "Não identificado",
          Dia: dia?.nome || "Não identificado",
          Período: escala.periodo || "",
          Entrada: escala.entrada || "",
          Saída: escala.saida || "",
          Retorno: escala.retorno || "",
          "Segunda saída": escala.saida2 || "",
          Observações: escala.observacoes || "",
        };
      });

      const dadosAtividades = atividadesFiltradas.map((atividade) => {
        const escala = escalasFiltradas.find(
          (item) => String(item.id) === String(atividade.escala_id),
        );
        const funcionario = escala
          ? funcionarioPorId[String(escala.funcionario_id)]
          : null;
        const local = localPorId[String(atividade.local_id)];

        return {
          Funcionário: funcionario?.nome || "Não identificado",
          Local: local?.nome || "Não identificado",
          Início: atividade.inicio || "",
          Fim: atividade.fim || "",
          Descrição: atividade.descricao || "",
        };
      });

      const dadosOcorrencias = ocorrenciasFiltradas.map((ocorrencia) => {
        const funcionario = funcionarioPorId[String(ocorrencia.funcionario_id)];

        return {
          Funcionário: funcionario?.nome || "Não identificado",
          Data: ocorrencia.data || "",
          Horário: ocorrencia.horario || "",
          Descrição: ocorrencia.descricao || "",
        };
      });

      const workbook = XLSX.utils.book_new();

      const planilhaEscalas = XLSX.utils.json_to_sheet(dadosEscalas);
      const planilhaAtividades = XLSX.utils.json_to_sheet(dadosAtividades);
      const planilhaOcorrencias = XLSX.utils.json_to_sheet(dadosOcorrencias);

      XLSX.utils.book_append_sheet(workbook, planilhaEscalas, "Escalas");
      XLSX.utils.book_append_sheet(workbook, planilhaAtividades, "Atividades");
      XLSX.utils.book_append_sheet(
        workbook,
        planilhaOcorrencias,
        "Ocorrências",
      );

      XLSX.writeFile(workbook, "relatorios.xlsx");

      toast.success("Relatório exportado com sucesso!");
    } catch (erro) {
      console.error("Erro ao exportar relatório:", erro);
      toast.error("Não foi possível exportar o relatório.");
    }
  }

  const totalAtividades = atividadesFiltradas.length;
  const totalEscalas = escalasFiltradas.length;
  const totalOcorrencias = ocorrenciasFiltradas.length;

  if (carregando) {
    return (
      <div className="relatorios-container">
        <div className="relatorios-loading">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="relatorios-container">
      <div className="relatorios-header">
        <div>
          <h1>Relatórios</h1>
          <p>Visualize e exporte os dados do sistema.</p>
        </div>

        <button type="button" className="btn-exportar" onClick={exportarExcel}>
          Exportar Excel
        </button>
      </div>

      <section className="relatorios-filtros">
        <div className="filtro-group">
          <label htmlFor="funcionarioFiltro">Funcionário</label>
          <select
            id="funcionarioFiltro"
            value={funcionarioFiltro}
            onChange={(e) => setFuncionarioFiltro(e.target.value)}
          >
            <option value="">Todos os funcionários</option>
            {funcionarios.map((funcionario) => (
              <option key={funcionario.id} value={funcionario.id}>
                {funcionario.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="dataInicio">Data inicial das ocorrências</label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="filtro-group">
          <label htmlFor="dataFim">Data final das ocorrências</label>
          <input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn-limpar-filtros"
          onClick={() => {
            setFuncionarioFiltro("");
            setDataInicio("");
            setDataFim("");
          }}
        >
          Limpar filtros
        </button>
      </section>

      <section className="relatorios-stats">
        <div className="relatorio-card">
          <span>Funcionários</span>
          <strong>{totalFuncionarios}</strong>
        </div>

        <div className="relatorio-card">
          <span>Escalas</span>
          <strong>{totalEscalas}</strong>
        </div>

        <div className="relatorio-card">
          <span>Atividades</span>
          <strong>{totalAtividades}</strong>
        </div>

        <div className="relatorio-card">
          <span>Ocorrências</span>
          <strong>{totalOcorrencias}</strong>
        </div>
      </section>

      <section className="relatorios-graficos">
        <div className="grafico-card">
          <h2>Escalas por dia da semana</h2>

          {escalasPorDia.length > 0 ? (
            <div className="grafico-barras">
              {escalasPorDia.map((item) => {
                const maximo = Math.max(
                  ...escalasPorDia.map((dia) => dia.total),
                  1,
                );

                return (
                  <div className="barra-item" key={item.nome}>
                    <span className="barra-label">{item.nome}</span>
                    <div className="barra-track">
                      <div
                        className="barra-fill"
                        style={{
                          width: `${(item.total / maximo) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{item.total}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="grafico-vazio">Nenhuma escala encontrada.</p>
          )}
        </div>

        <div className="grafico-card">
          <h2>Atividades por local</h2>

          {atividadesPorLocal.length > 0 ? (
            <div className="grafico-barras">
              {atividadesPorLocal.map((item) => {
                const maximo = Math.max(
                  ...atividadesPorLocal.map((local) => local.total),
                  1,
                );

                return (
                  <div className="barra-item" key={item.nome}>
                    <span className="barra-label">{item.nome}</span>
                    <div className="barra-track">
                      <div
                        className="barra-fill"
                        style={{
                          width: `${(item.total / maximo) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{item.total}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="grafico-vazio">Nenhuma atividade encontrada.</p>
          )}
        </div>

        <div className="grafico-card">
          <h2>Ocorrências por período</h2>

          {ocorrenciasPorPeriodo.length > 0 ? (
            <div className="grafico-barras">
              {ocorrenciasPorPeriodo.map((item) => {
                const maximo = Math.max(
                  ...ocorrenciasPorPeriodo.map((periodo) => periodo.total),
                  1,
                );

                return (
                  <div className="barra-item" key={item.nome}>
                    <span className="barra-label">{item.nome}</span>
                    <div className="barra-track">
                      <div
                        className="barra-fill"
                        style={{
                          width: `${(item.total / maximo) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{item.total}</strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="grafico-vazio">Nenhuma ocorrência encontrada.</p>
          )}
        </div>
      </section>
    </div>
  );
}
