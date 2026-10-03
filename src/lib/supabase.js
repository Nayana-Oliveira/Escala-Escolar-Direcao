
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Configuração do Supabase ausente.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testarConexao() {
  console.log("Iniciando teste de conexão com Supabase...");

  try {
    const { data, error } = await supabase
      .from("locais")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Erro retornado pelo Supabase:", error);
      return { sucesso: false, erro: error.message };
    }

    console.log("Conexão realizada com sucesso.");
    console.log("Registros encontrados:", data);

    return { sucesso: true, dados: data };
  } catch (erro) {
    console.error("Falha inesperada:", erro);

    return {
      sucesso: false,
      erro: erro instanceof Error ? erro.message : String(erro),
    };
  }
}