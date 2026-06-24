const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Pastas e arquivos a ignorar
const IGNORAR = [
  ".git",
  "node_modules",
  ".next",
  ".env.local",
  ".env",
  "auto-push.js",
];

let timer = null;
const DELAY_MS = 5000; // Aguarda 5 segundos após a última alteração antes de fazer push

function deveIgnorar(caminho) {
  return IGNORAR.some((item) => caminho.includes(item));
}

function fazerPush() {
  try {
    const status = execSync("git status --porcelain").toString().trim();
    if (!status) {
      console.log("✓ Nenhuma alteração detectada.");
      return;
    }

    const agora = new Date().toLocaleString("pt-BR");
    console.log(`\n[${agora}] Alterações detectadas! Enviando para GitHub...`);

    execSync("git add .");
    execSync(`git commit -m "auto: atualização automática em ${agora}"`);
    execSync("git push");

    console.log("✅ GitHub atualizado! A Vercel iniciará o deploy.\n");
  } catch (err) {
    console.error("❌ Erro ao fazer push:", err.message);
  }
}

function agendarPush() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(fazerPush, DELAY_MS);
}

// Observa a pasta raiz do projeto
const raiz = path.resolve(__dirname);

fs.watch(raiz, { recursive: true }, (evento, arquivo) => {
  if (!arquivo || deveIgnorar(arquivo)) return;
  console.log(`📝 Arquivo alterado: ${arquivo}`);
  agendarPush();
});

console.log("👀 Auto-push ativo! Salvou um arquivo? GitHub será atualizado em 5 segundos.");
console.log("   Pressione Ctrl+C para parar.\n");
