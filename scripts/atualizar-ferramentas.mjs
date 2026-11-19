#!/usr/bin/env node
/* =====================================================================
   atualizar-ferramentas.mjs  —  registra sozinho as ferramentas de tools/
   no array TOOLS do index.html (Painel de Automação).

   Uso (a partir da pasta do painel, ou de qualquer lugar):
     node scripts/atualizar-ferramentas.mjs                  atualiza o index.html
     node scripts/atualizar-ferramentas.mjs --verificar      não grava; sai com código 1 se desatualizado
     node scripts/atualizar-ferramentas.mjs --remover-ausentes
                                                             também apaga do array as ferramentas
                                                             cujo arquivo não existe mais em tools/

   Fonte única da verdade: 4 meta tags no <head> de cada tools/*.html
     hub-nome, hub-descricao, hub-icone, hub-categoria

   Regras:
   - id = nome do arquivo sem .html; arquivo = 'tools/<nome>.html'.
   - Ferramenta NOVA sem alguma meta tag: usa fallback (nome = <title>,
     ícone 🧩, categoria "Outras ferramentas", descrição vazia) e avisa.
   - Ferramenta JÁ registrada: cada campo vem da meta tag quando ela existe;
     se não existe, mantém o valor atual (nunca rebaixa ao fallback).
   - A ordem do array é preservada; novas entram no fim, antes do
     comentário-marcador. Nada fora do array TOOLS é alterado.
   - Idempotente: rodar duas vezes seguidas não altera nada na segunda.
   - Antes de gravar, avalia o array resultante, confere ids únicos e que
     cada "arquivo" existe (exceto as ferramentas ausentes, que só geram
     AVISO). Se falhar, não grava e sai com código 2.

   Sem dependências (apenas Node 16+).
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = path.join(RAIZ, 'index.html');
const DIR_TOOLS = path.join(RAIZ, 'tools');
const MARCADOR = '// -> novas ferramentas entram aqui';
const CAMPOS = ['nome', 'descricao', 'icone', 'categoria'];
const FALLBACK = { icone: '🧩', categoria: 'Outras ferramentas', descricao: '' };

const flags = new Set(process.argv.slice(2));
const CONHECIDAS = new Set(['--verificar', '--remover-ausentes', '--ajuda', '-h', '--help']);
for (const f of flags) {
  if (!CONHECIDAS.has(f)) { console.error(`ERRO: opção desconhecida "${f}". Use --ajuda.`); process.exit(2); }
}
if (flags.has('--ajuda') || flags.has('-h') || flags.has('--help')) {
  console.log('Uso: node scripts/atualizar-ferramentas.mjs [--verificar] [--remover-ausentes]');
  process.exit(0);
}
const VERIFICAR = flags.has('--verificar');
const REMOVER = flags.has('--remover-ausentes');

function falhar(msg) { console.error('ERRO: ' + msg); process.exit(2); }

/* ---------- utilidades ---------- */
function decodificarEntidades(s) {
  const nomes = { amp: '&', quot: '"', lt: '<', gt: '>', apos: "'", nbsp: ' ' };
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const cod = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return String.fromCodePoint(cod); } catch { return m; }
    }
    const v = nomes[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}
const limpar = (s) => decodificarEntidades(s).replace(/\s+/g, ' ').trim();

function lerMetas(html) {
  const fimHead = html.search(/<\/head\s*>/i);
  const regiao = fimHead >= 0 ? html.slice(0, fimHead) : html;
  const metas = {};
  for (const tag of regiao.match(/<meta\b[^>]*>/gi) || []) {
    const attrs = {};
    for (const m of tag.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
    }
    const nome = (attrs.name || '').toLowerCase();
    if (nome.startsWith('hub-') && 'content' in attrs) {
      const campo = nome.slice(4);
      if (CAMPOS.includes(campo)) {
        const valor = limpar(attrs.content);
        if (valor !== '' && !(campo in metas)) metas[campo] = valor;  // vale a primeira ocorrência
      }
    }
  }
  return metas;
}

function lerTitulo(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  return m ? limpar(m[1]) : '';
}

function aspas(s) {
  return "'" + String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029")
    .replace(/<\//g, '<\\/') + "'";   // evita fechar o <script> do index.html
}

function serializar(obj, eol) {
  const linhas = Object.keys(obj).map((k) => {
    const v = obj[k];
    return `    ${k}: ${typeof v === 'string' ? aspas(v) : JSON.stringify(v)},`;
  });
  return ['  {', ...linhas, '  },'].join(eol) + eol;
}

function avaliar(src) { return new Function('"use strict"; return (' + src + ');')(); }

/* ---------- leitura do index.html ---------- */
if (!fs.existsSync(INDEX)) falhar(`index.html não encontrado em ${RAIZ}`);
if (!fs.existsSync(DIR_TOOLS)) falhar(`pasta tools/ não encontrada em ${RAIZ}`);
const original = fs.readFileSync(INDEX, 'utf8');            // se houver BOM, é preservado como está
const EOL = original.includes('\r\n') ? '\r\n' : '\n';

const reIni = /const TOOLS = \[[ \t]*\r?\n/;
const mIni = reIni.exec(original);
if (!mIni) falhar('não achei "const TOOLS = [" no index.html.');
const iniRegiao = mIni.index + mIni[0].length;
const posMarcador = original.indexOf(MARCADOR, iniRegiao);
if (posMarcador < 0) falhar(`não achei o comentário-marcador "${MARCADOR}..." dentro do array TOOLS.`);
const iniLinhaMarc = original.lastIndexOf('\n', posMarcador) + 1;
if (iniLinhaMarc < iniRegiao || original.slice(iniLinhaMarc, posMarcador).trim() !== '') {
  falhar('o comentário-marcador precisa estar sozinho na sua linha.');
}
const cabeca = original.slice(0, iniRegiao);
const regiao = original.slice(iniRegiao, iniLinhaMarc);
const cauda = original.slice(iniLinhaMarc);

/* ---------- entradas atuais (texto original de cada bloco preservado) ---------- */
const reBloco = /^([ \t]*)\{[ \t]*\r?\n[\s\S]*?^\1\}[ \t]*,?[ \t]*(?:\r?\n|$)/gm;
const entradas = [];
for (const m of regiao.matchAll(reBloco)) {
  let texto = m[0];
  let obj;
  try { obj = avaliar(texto.trim().replace(/,\s*$/, '')); }
  catch (e) { falhar('não consegui interpretar uma entrada do array TOOLS: ' + e.message); }
  texto = texto.replace(/\}[ \t]*,?[ \t]*(?:\r?\n|$)$/, '},' + EOL);   // garante vírgula final
  entradas.push({ obj, texto, visto: false });
}
if (regiao.replace(reBloco, '').trim() !== '') {
  falhar('há conteúdo inesperado (comentário ou código) dentro do array TOOLS, fora das entradas. Nada foi gravado.');
}

/* ---------- varredura de tools/ ---------- */
let adicionadas = 0, atualizadas = 0, removidas = 0, avisos = 0;
const ausentes = new Set();
const aviso = (msg) => { avisos++; console.log('AVISO: ' + msg); };

const arquivos = fs.readdirSync(DIR_TOOLS, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.toLowerCase().endsWith('.html'))
  .map((d) => d.name)
  .sort();

for (const nomeArq of arquivos) {
  const id = nomeArq.slice(0, -'.html'.length);
  const arquivo = `tools/${nomeArq}`;
  const html = fs.readFileSync(path.join(DIR_TOOLS, nomeArq), 'utf8').replace(/^﻿/, '');
  const metas = lerMetas(html);
  const existente = entradas.find((e) => e.obj.id === id || e.obj.arquivo === arquivo);

  if (existente) {
    existente.visto = true;
    const novo = { ...existente.obj };
    let mudou = false;
    for (const c of CAMPOS) {
      if (c in metas && novo[c] !== metas[c]) { novo[c] = metas[c]; mudou = true; }
    }
    if (mudou) {
      existente.obj = novo;
      existente.texto = serializar(novo, EOL);
      atualizadas++;
      console.log(`Atualizada: ${id}`);
    }
    continue;
  }

  const faltando = CAMPOS.filter((c) => !(c in metas));
  const obj = {
    id,
    nome: metas.nome || lerTitulo(html) || id,
    descricao: metas.descricao ?? FALLBACK.descricao,
    icone: metas.icone || FALLBACK.icone,
    categoria: metas.categoria || FALLBACK.categoria,
    arquivo,
  };
  if (faltando.length) {
    aviso(`${arquivo} sem a(s) meta tag(s) ${faltando.map((c) => 'hub-' + c).join(', ')} — usei o padrão para o que faltou. Preencha-as no <head> do arquivo.`);
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) {
    aviso(`${arquivo}: o nome do arquivo tem espaços, acentos ou símbolos; prefira minúsculas, números e hífens (o nome vira o id).`);
  }
  entradas.push({ obj, texto: serializar(obj, EOL), visto: true });
  adicionadas++;
  console.log(`Adicionada: ${id}`);
}

/* ---------- registradas que sumiram de tools/ ---------- */
for (const e of [...entradas]) {
  if (e.visto) continue;
  if (REMOVER) {
    entradas.splice(entradas.indexOf(e), 1);
    removidas++;
    console.log(`Removida: ${e.obj.id} (arquivo ${e.obj.arquivo} não existe mais)`);
  } else {
    ausentes.add(e.obj.id);
    aviso(`"${e.obj.id}" está registrada, mas ${e.obj.arquivo} não existe mais em tools/. Mantida (use --remover-ausentes para apagar o registro).`);
  }
}

/* ---------- monta o novo index.html e valida antes de gravar ---------- */
const novoTexto = cabeca + entradas.map((e) => e.texto).join('') + cauda;

let lista;
try {
  const m = reIni.exec(novoTexto);
  const ini = m.index + 'const TOOLS = '.length;
  const fim = novoTexto.indexOf('];', novoTexto.indexOf(MARCADOR, ini));
  lista = avaliar(novoTexto.slice(ini, fim + 1));
} catch (e) { falhar('o array TOOLS resultante não é JavaScript válido: ' + e.message + ' Nada foi gravado.'); }
if (!Array.isArray(lista)) falhar('o TOOLS resultante não é um array. Nada foi gravado.');
const ids = new Set();
for (const t of lista) {
  for (const k of ['id', 'nome', 'arquivo']) {
    if (typeof t[k] !== 'string' || t[k] === '') falhar(`entrada inválida (campo "${k}" ausente): ${JSON.stringify(t)}. Nada foi gravado.`);
  }
  if (ids.has(t.id)) falhar(`id duplicado: "${t.id}". Nada foi gravado.`);
  ids.add(t.id);
  if (!ausentes.has(t.id) && !fs.existsSync(path.join(RAIZ, t.arquivo))) {
    falhar(`o arquivo "${t.arquivo}" (id "${t.id}") não existe. Nada foi gravado.`);
  }
}
if (lista.length !== entradas.length) falhar('número de entradas avaliadas difere do esperado. Nada foi gravado.');

/* ---------- resultado ---------- */
const mudou = novoTexto !== original;
console.log(`Resumo: ${adicionadas} adicionadas, ${atualizadas} atualizadas, ${avisos} avisos` + (removidas ? `, ${removidas} removidas` : ''));
const nAlteracoes = adicionadas + atualizadas + removidas;

if (VERIFICAR) {
  if (mudou) { console.log(`index.html DESATUALIZADO (${nAlteracoes} alterações pendentes). Rode: node scripts/atualizar-ferramentas.mjs`); process.exit(1); }
  console.log('index.html está atualizado (0 alterações).');
  process.exit(0);
}
if (mudou) {
  fs.writeFileSync(INDEX, novoTexto, 'utf8');
  console.log(`index.html gravado (${nAlteracoes} alterações, ${lista.length} ferramentas no painel).`);
} else {
  console.log(`0 alterações — index.html já estava atualizado (${lista.length} ferramentas no painel).`);
}
