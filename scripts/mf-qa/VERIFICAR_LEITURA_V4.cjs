#!/usr/bin/env node
'use strict';
/* Executa a ponte REAL de estilos, com paletas reais, sem API/banco/fotos. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
let n=0;
function check(ok,what){n++;assert.ok(ok,what);}
function load(p,deps={}){
 const compiled=ts.transpileModule(read(p),{fileName:p,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
 const mod={exports:{}};
 new Function('require','module','exports',compiled.outputText)(key=>{if(!(key in deps)) throw Error('Import inesperado no teste: '+key);return deps[key];},mod,mod.exports);
 return mod.exports;
}
const tok=load('lib/mf-tokens.ts');
const bridge=load('lib/mf-styles.ts',{'react-native':{Dimensions:{get:()=>({width:390})},StyleSheet:{create:x=>x}},'@/lib/mf-tokens':tok});
function lum(h){const a=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return a[0]*.2126+a[1]*.7152+a[2]*.0722;}
function contrast(a,b){const l=lum(a),r=lum(b);return(Math.max(l,r)+.05)/(Math.min(l,r)+.05);}
const source=bridge.MFStyleSheet.create({
  safe:{backgroundColor:'#F7F8F6'},
  card:{backgroundColor:'#FFFFFF',borderColor:'#E4E9E7'},
  profileCard:{backgroundColor:'#123C47'},
  detailValue:{color:'#172D34'},
  detailLabel:{color:'#839095'},
  sectionTitle:{color:'#172D34'},
  input:{backgroundColor:'#F9FAF9',color:'#172D34',borderColor:'#DEE4E2'},
  textInput:{backgroundColor:'#FAFCFB',color:'#123C47'},
  statusCard:{backgroundColor:'#123C47'},
  statusValue:{color:'#FFFFFF'},
  saveButton:{backgroundColor:'#123C47'},
  saveButtonText:{color:'#FFFFFF'},
  filterButtonActive:{backgroundColor:'#40856C'},
  filterTextActive:{color:'#FFFFFF'},
  disabled:{opacity:0.40},
  inputReadOnly:{color:'#6E7C80',opacity:0.5},
  loadingText:{color:'#66757A'},
});
for(const [mode,p] of Object.entries(tok.MF_COLORS)){
 tok.setMFActiveTheme(mode);
 check(source.safe.backgroundColor===p.bg,mode+' fundo');
 check(source.card.backgroundColor===p.surface,mode+' cartão claro');
 check(source.profileCard.backgroundColor===p.surface,mode+' cartão de aluno');
 check(source.detailValue.color===p.ink,mode+' valor de aluno');
 check(source.sectionTitle.color===p.ink,mode+' título de seção');
 check(source.textInput.color===p.ink,mode+' campo numérico');
 check(source.disabled.opacity>=.90,mode+' campos desabilitados legíveis');
 check(source.inputReadOnly.opacity>=.90,mode+' readonly legível');
 const surfacePairs=[['detailValue','profileCard'],['detailLabel','profileCard'],['sectionTitle','card'],['loadingText','card'],['textInput','card']];
 for(const [fg,bg] of surfacePairs){const a=source[fg].color,b=source[bg].backgroundColor;check(contrast(a,b)>=4.5,mode+' contraste '+fg+'/'+bg+' = '+contrast(a,b).toFixed(2));}
 check(contrast(source.statusValue.color,source.statusCard.backgroundColor)>=4.5,mode+' cartão de status');
 check(contrast(source.saveButtonText.color,source.saveButton.backgroundColor)>=4.5,mode+' botão salvar');
 check(contrast(source.filterTextActive.color,source.filterButtonActive.backgroundColor)>=4.5,mode+' filtro ativo');
}
tok.setMFActiveTheme('light');check(source.detailValue.color===tok.MF_COLORS.light.ink,'retorno ao claro não mantém tema escuro');
tok.setMFActiveTheme('dark');check(source.detailValue.color===tok.MF_COLORS.dark.ink,'alternância escuro na mesma referência de styles');
const css=read('public/mf-theme-visual-v4.css');
const html=read('public/index.html');
check(html.includes('href="/mf-theme-visual-v4.css"'),'HTML referencia CSS v4');
for(const s of ['input:disabled','input[readonly]','textarea:disabled','textarea[readonly]','-webkit-text-fill-color: var(--mf-field-text)','data-mf-theme="dark"','data-mf-theme="light"']) check(css.includes(s),'CSS WebKit '+s);
for(const [p,term] of [['app/(app)/(tabs)/dashboard.tsx',"{'Cuidar começa\\npor conhecer.'}"],['app/(auth)/login.tsx',"{'Cada evolução\\ncomeça com\\num novo olhar.'}"]]){
 check(read(p).includes(term),'quebra de linha via expressão JSX: '+p);
}
if(!process.env.MF_QA_SMOKE_ONLY){
 const app=path.join(root,'app');let count=0;
 function visit(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())visit(p);else if(e.name.endsWith('.tsx')){const src=fs.readFileSync(p,'utf8');if(src.includes('MFStyleSheet as StyleSheet')){count++;check(src.startsWith('"use no memo";\n'),`React Compiler desligado no módulo visual ${path.relative(root,p)}`);}}}}
 visit(app);check(count===28,'quantidade de telas legadas: '+count);
 console.log('TELAS_LEGADAS_SEM_MEMO:',count);
}
console.log('MF_LEITURA_V4_OK:',n,'verificações de tema, contraste, leitura, CSS e quebra de linha');
