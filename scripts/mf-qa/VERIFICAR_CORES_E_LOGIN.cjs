#!/usr/bin/env node
'use strict';
/* Testa o código real do bridge nos DOIS temas, sem acessar APIs ou fotos.
   Testes de estrutura em todos os módulos de avaliações usando o parser TS. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const assert = require('node:assert/strict');
const root = process.cwd();
let checks = 0;
const ensure = (predicate, message) => { checks++; assert.ok(predicate, message); };
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

// Transpilar diretamente os módulos TS permite exercitar o MESMO algoritmo de
// cores usado no React Native, sem exigir DOM, credenciais ou screenshot.
function loadTS(p, deps = {}) {
  const code = read(p);
  const out = ts.transpileModule(code, { fileName: p, compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX,
  }});
  const module = { exports: {} };
  new Function('require', 'module', 'exports', out.outputText)(name => {
    if (!(name in deps)) throw new Error('Dependência não permitida no teste: ' + name);
    return deps[name];
  }, module, module.exports);
  return module.exports;
}
const tokens = loadTS('lib/mf-tokens.ts');
const bridge = loadTS('lib/mf-styles.ts', {
  'react-native': { Dimensions: { get: () => ({ width: 390 }) }, StyleSheet: { create: o => o } },
  '@/lib/mf-tokens': tokens,
});
const hex = x => typeof x === 'string' && /^#[\da-f]{6}$/i.test(x);
function lum(value) {
  let n = [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255)
    .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * n[0] + .7152 * n[1] + .0722 * n[2];
}
const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((a,b)=>a-b); return (y+.05)/(x+.05); };
function readable(fg, bg, label) {
  ensure(hex(fg)&&hex(bg), `Cor inválida: ${label}: ${fg} em ${bg}`);
  ensure(ratio(fg,bg) >= 4.5, `Contraste ${ratio(fg,bg).toFixed(2)} menor que AA: ${label} (${fg} / ${bg})`);
}

const scenarios = [
  ['Perímetros | título', 'tableCard', '#FFFFFF', 'sectionTitle', '#172D34'],
  ['Perímetros | cabeçalho', 'tableCard', '#FFFFFF', 'tableHeaderName', '#839095'],
  ['Perímetros | valor', 'tableCard', '#FFFFFF', 'metricValue', '#172D34'],
  ['Perímetros | status', 'statusCard', '#FFFFFF', 'statusValue', '#FFFFFF'],
  ['VO2 | card', 'formCard', '#FFFFFF', 'fieldLabel', '#344A51'],
  ['VO2 | input antigo', 'timeInput', '#123C47', 'timeInput', '#FFFFFF'],
  ['VO2 | opção escolhida', 'choiceSelected', '#40856C', 'choiceSelectedText', '#FFFFFF'],
  ['VO2 | salvar', 'save', '#123C47', 'saveText', '#FFFFFF'],
  ['Fotos | cartão', 'photoCard', '#FFFFFF', 'photoTitle', '#172D34'],
  ['Fotos | detalhes', 'photoCard', '#FFFFFF', 'photoDate', '#7B898A'],
  ['Fotos | checkbox e visto', 'checkboxActive', '#40856C', 'checkboxActive', '#FFFFFF'],
  ['Fotos | ação principal', 'primaryButton', '#123C47', 'primaryButtonText', '#FFFFFF'],
  ['Neuromotor | formulário', 'formCard', '#FFFFFF', 'fieldLabel', '#344A51'],
  ['Neuromotor | entrada', 'numericInput', '#123C47', 'numericInput', '#FFFFFF'],
  ['Neuromotor | botão', 'saveButton', '#123C47', 'saveButtonText', '#FFFFFF'],
  ['Postura | opção', 'optionChipActive', '#40856C', 'optionTextActive', '#FFFFFF'],
  ['Postura | descrição', 'introCard', '#FFFFFF', 'introText', '#66757A'],
  ['Anamnese | cartão', 'card', '#FFFFFF', 'fieldLabel', '#344A51'],
  ['Anamnese | status', 'statusCard', '#123C47', 'statusValue', '#FFFFFF'],
  ['Composição | status', 'statusCard', '#123C47', 'statusLabel', '#91BCAA'],
  ['Composição | leitura', 'resultsCard', '#FFFFFF', 'resultValue', '#172D34'],
  ['Cadastro | nome', 'profileCard', '#123C47', 'name', '#FFFFFF'],
  ['Cadastro | idade', 'profileCard', '#123C47', 'age', '#C9D8DA'],
  ['Avaliação nova | cartão selecionado', 'selectedCard', '#123C47', 'selectedName', '#FFFFFF'],
  ['Avaliação nova | detalhe selecionado', 'selectedCard', '#123C47', 'selectedDescription', '#CCD9DB'],
  ['Comparação | texto de ação', 'compareButton', '#123C47', 'compareButtonText', '#FFFFFF'],
  ['Histórico | status selecionado', 'filterButtonActive', '#40856C', 'filterTextActive', '#FFFFFF'],
  ['Histórico | data', 'historyCard', '#FFFFFF', 'historyDate', '#172D34'],
];
for (const theme of ['light', 'dark']) {
  tokens.setMFActiveTheme(theme);
  for (const [label,bgName,bgOld,txtName,txtOld] of scenarios) {
    const entries = { [bgName]: { backgroundColor:bgOld } };
    entries[txtName] = { ...(entries[txtName] || {}), color:txtOld };
    const styles = bridge.MFStyleSheet.create(entries);
    let background = styles[bgName].backgroundColor;
    let color = styles[txtName].color;
    readable(color, background, `${label} (${theme})`);
  }
}

// Exercitar os cartões com cor + fundo na MESMA classe também.
for (const theme of ['light','dark']) {
  tokens.setMFActiveTheme(theme);
  for (const name of ['dateInput','timeInput','numericInput','textInput','textarea']) {
    const s = bridge.MFStyleSheet.create({[name]:{backgroundColor:'#123C47',color:'#FFFFFF'}})[name];
    readable(s.color,s.backgroundColor,`campo integrado ${name} (${theme})`);
  }
}

const css = read('public/mf-theme-visual-v3.css');
ensure(read('public/index.html').includes('href="/mf-theme-visual-v3.css"'), 'HTML não referencia CSS de versão exclusiva');
const login = read('app/(auth)/login.tsx');
for (const field of ['mf-login-email','mf-login-password']) {
  ensure(css.includes('#'+field+':-webkit-autofill'),`autofill WebKit faltando: ${field}`);
  ensure(login.includes(`nativeID="${field}"`),`campo login sem ID: ${field}`);
}
ensure(css.includes('box-shadow:') && css.includes('-webkit-text-fill-color:'),'CSS do autofill incompleto');
ensure(css.includes('data-mf-theme="dark"'),'autofill sem tema escuro');
ensure(login.includes('autoComplete="email"') && login.includes('autoComplete="current-password"'),'autocomplete de login não semântico');

// Verificar se as telas legadas continuam usando o bridge central em vez de
// reintroduzir paletas ad hoc. Não modifica operações, validações ou payloads.
function allFiles(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?allFiles(path.join(dir,x.name)):[path.join(dir,x.name)]);
}
const base = path.join(root,'app','(app)');
const files = allFiles(base).filter(f=>f.endsWith('.tsx') && /\/(assessments|students|evaluators)\//.test(f.replaceAll('\\','/')));
const legacy=files.filter(f=>/StyleSheet\.create\(/.test(fs.readFileSync(f,'utf8')));
ensure(legacy.length>=24,`Esperávamos no mínimo 24 formulários/telas legadas; vieram ${legacy.length}`);
for(const f of legacy){
  const s=fs.readFileSync(f,'utf8');
  ensure(/MFStyleSheet\s+as\s+StyleSheet/.test(s),`tela sem tema compartilhado: ${path.relative(root,f)}`);
  const tree=ts.createSourceFile(f,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  ensure(tree.parseDiagnostics.length===0,`JSX inválido: ${path.relative(root,f)}`);
}
console.log(`MF_CONTRASTE_INTEGRAL_OK — ${checks} verificações em ${legacy.length} telas, 2 temas, autofill Safari/Chromium`);
