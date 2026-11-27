#!/usr/bin/env node
'use strict';
// Sem acesso à rede nem dados de alunos. Executa também na CI.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const vm = require('node:vm');
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const check = (condition, message) => { assert.ok(condition, message); console.log('OK',message); };
function htmlCheck(file) {
  const html = read(file);
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || '';
  check(/\blang=["']pt-BR["']/i.test(htmlTag), file+' idioma pt-BR');
  check(/\btranslate=["']no["']/i.test(htmlTag), file+' translate=no');
  check(/<meta\b(?=[^>]*\bname=["']google["'])(?=[^>]*\bcontent=["']notranslate["'])[^>]*>/i.test(html),file+' meta notranslate');
  check(/<body\b[^>]*\btranslate=["']no["']/i.test(html), file+' proteção no body');
}
htmlCheck('public/index.html');
check(JSON.parse(read('app.json')).expo.web.lang==='pt-BR','app.json: idioma da web');
check(JSON.parse(read('public/manifest.webmanifest')).lang==='pt-BR','manifest: idioma');
for (const f of ['services/students.ts','services/progress-photos.ts','services/postural-assessment.ts']) {
 const s = read(f);
 check(s.includes('prepareMFPhoto(asset,') && !s.includes('ImageManipulator.manipulate'), f+' usa conversor compartilhado');
}
for (const f of ['app/(app)/students/[uuid].tsx','app/(app)/assessments/[uuid]/progress-photos.tsx','app/(app)/assessments/[uuid]/postural-assessment.tsx']) {
 const s=read(f); check(s.includes('pickMFPhoto(source,') && s.includes('photoErrorMessage(exception,') && !s.includes('launchImageLibraryAsync'), f+' usa seletor e tratamento de erros');
}
const source=read('lib/mf-photo-common.ts');
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},reportDiagnostics:true});
assert.equal((transpiled.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const mod={exports:{}};
vm.runInNewContext(transpiled.outputText,{exports:mod.exports,module:mod,Math,Number,Error});
const {photoDimensions,requireJpeg,jpegByteLength,photoErrorMessage,MAX_JPEG_BYTES}=mod.exports;
const dim=(w,h,m,ew,eh)=>{const d=photoDimensions(w,h,m);assert.equal(d.width,ew);assert.equal(d.height,eh);};
dim(3024,4032,1600,1200,1600);dim(4032,3024,1600,1600,1200);dim(100,200,1600,100,200);dim(1,5000,1600,1,1600);dim(4000,6000,1800,1200,1800);
for(const [w,h] of [[0,10],[NaN,10],[Infinity,10],[-1,4],[10,0]])assert.throws(()=>photoDimensions(w,h,1600));
check(true,'Dimensões verticais/horizontais, sem ampliação, sem zero/NaN');
assert.equal(jpegByteLength('/9j/'),3); assert.equal(jpegByteLength('AAAAAA=='),4);
assert.throws(()=>requireJpeg('not-jpeg'));assert.throws(()=>requireJpeg(null));
const oversized='/9j/'+'A'.repeat(Math.ceil(MAX_JPEG_BYTES/3)*4);assert.throws(()=>requireJpeg(oversized));
check(true,'JPEG e limite de 5 MiB');
assert.match(photoErrorMessage({name:'ApiError',status:403},'erro'),/consentimento/);
assert.match(photoErrorMessage({name:'ApiError',status:500,message:'secret'},'erro'),/servidor/);
assert.doesNotMatch(photoErrorMessage({name:'ApiError',status:500,message:'secret'},'erro'),/secret/);
assert.match(photoErrorMessage({message:'The index is not in the allowed range.'},'erro'),/imagem/);
check(true,'Erros em português, sem mensagem interna do servidor');
check(read('lib/mf-photo-prepare.web.ts').includes('img.naturalWidth') && read('lib/mf-photo-prepare.web.ts').includes('URL.revokeObjectURL'), 'Web: dimensões naturais, descarte de URL temporária');
if(process.argv.includes('--dist'))htmlCheck('dist/index.html');
console.log('MF_IDIOMA_FOTOS_OK');
