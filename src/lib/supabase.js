import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function validarConfiguracao() {
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL não foi configurada.");
  }

  if (!supabaseKey) {
    throw new Error("VITE_SUPABASE_ANON_KEY não foi configurada.");
  }

  let url;

  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error("A URL do Supabase é inválida.");
  }

  if (url.protocol !== "https:") {
    throw new Error("A URL do Supabase precisa utilizar HTTPS.");
  }

  if (!url.hostname.endsWith(".supabase.co")) {
    console.warn("A URL não possui o domínio padrão do Supabase.");
  }

  if ([...supabaseKey].some((c) => c.charCodeAt(0) > 255)) {
    throw new Error("A chave do Supabase contém caracteres inválidos.");
  }
}

validarConfiguracao();

console.log("Configuração do Supabase:");
console.log("URL configurada:", Boolean(supabaseUrl));
console.log("Chave configurada:", Boolean(supabaseKey));
console.log("URL:", supabaseUrl);
console.log("Tamanho da chave:", supabaseKey.length);

export const supabase = createClient(supabaseUrl, supabaseKey);
