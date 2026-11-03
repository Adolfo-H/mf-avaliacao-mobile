#!/usr/bin/env node
'use strict';
// Check de web app que não lê e não imprime senhas ou tokens.
const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const isDist = process.argv.includes('--dist');
let failures = 0;
const where = p => path.join(root, ...p.split('/'));
function check(ok, message) { console.log(`${ok ? 'OK  ' : 'ERRO'} ${message}`); if (!ok) failures++; }
const app = JSON.parse(fs.readFileSync(where('app.json'),'utf8').replace(/^\uFEFF/,''));
check(app.expo.web?.output === 'single', 'web.output=single para URLs de alunos/avaliações com UUID');
check(app.expo.web?.bundler === 'metro', 'Web usa Metro / Expo SDK 58');
const files = ['public/index.html','public/manifest.webmanifest','public/mf-pwa-icon.png',
  'public/apple-touch-icon.png','public/_redirects','public/_headers',
  'services/assessment-reports.web.ts'];
for(const f of files) check(fs.existsSync(where(f)),f);
if(fs.existsSync(where('public/index.html'))){
 const html=fs.readFileSync(where('public/index.html'),'utf8');
 check(html.includes('href="/manifest.webmanifest"') && html.includes('MF_PWA_V1_START'), 'HTML inclui manifest e metatags iPhone');
}
if(fs.existsSync(where('public/manifest.webmanifest'))){
 try{
  const m=JSON.parse(fs.readFileSync(where('public/manifest.webmanifest'),'utf8'));
  check(m.display==='standalone' && m.start_url==='/' && m.icons?.length>0,'Manifest standalone e ícone');
 } catch(e){check(false, 'Manifest JSON válido')}
}
const webFile=fs.existsSync(where('services/assessment-reports.web.ts')) ?
 fs.readFileSync(where('services/assessment-reports.web.ts'),'utf8') : '';
check(webFile.includes('cache: \'no-store\'') && webFile.includes('URL.revokeObjectURL'),
  'PDFs com download autenticado, sem cache e com descarte explícito');
// Sem service worker evita cache de dados clínicos no dispositivo.
check(!fs.existsSync(where('public/sw.js')) && !fs.existsSync(where('public/service-worker.js')),
  'Sem service worker que possa armazenar dados clínicos');
if(isDist){
 check(fs.existsSync(where('dist/index.html')),'Export criou dist/index.html');
 check(fs.existsSync(where('dist/manifest.webmanifest')),'Manifest copiado para dist');
 check(fs.existsSync(where('dist/apple-touch-icon.png')),'Ícone iPhone copiado para dist');
 if(fs.existsSync(where('dist/index.html'))) {
  const html=fs.readFileSync(where('dist/index.html'),'utf8');
  check(html.includes('manifest.webmanifest'),'Manifest referenciado no HTML exportado');
 }
}
console.log(failures===0 ? 'PWA: verificações estruturais passaram.' : `PWA: ${failures} pendências.`);
if(failures) process.exitCode=1;
