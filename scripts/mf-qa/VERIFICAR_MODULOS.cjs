#!/usr/bin/env node
'use strict';
/* Etapa 09: checagem estática, somente leitura. Sem HTTP, sem env, sem writes. */
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'modulos_08.json'), 'utf8'));
const errors = [];
const warn = [];
const fail = (msg) => { errors.push(msg); console.error('FALHA:', msg); };
const read = (rel) => {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { fail(`Arquivo ausente: ${rel}`); return null; }
  return fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
};
if (!fs.existsSync(path.join(root, 'package.json')) || !fs.readFileSync(path.join(root, 'package.json'), 'utf8').includes('expo-router')) {
  console.error('ERRO: execute dentro de C:\\Projetos\\mf-avaliacao-mobile');
  process.exit(1);
}
for (const m of manifest.modules) {
  for (const rel of m.mobile_files) {
    if (!fs.existsSync(path.join(root, rel))) {
      fail(`${m.id}: falta ${rel}. Instale o respectivo pacote antes de prosseguir.`);
    }
  }
  const entry = read(m.mobile_entry_screen);
  const route = `pathname: '${m.mobile_route}'`;
  if (entry) {
    const count = entry.split(route).length - 1;
    if (count !== 1) fail(`${m.id}: atalho ${m.mobile_route} encontrado ${count} vez(es) (esperado: 1).`);
  }
  const service = m.mobile_files.find(f => f.startsWith('services/'));
  if (service) {
    const value = read(service);
    if (value && (!value.includes('getToken') || !value.includes('/assessments/'))) {
      fail(`${m.id}: serviço sem autenticação/caminho de avaliação esperados.`);
    }
  }
  console.log(`CHECADO: ${m.id} — ${m.name}`);
}
const comp = read('app/(app)/assessments/[uuid]/body-composition.tsx');
if (comp && !/\['pollock_7',\s*'pollock_3',\s*'guedes_3'\]\.includes\(protocol\s*\?\?\s*''\)/.test(comp)) {
  fail('Seletor de dobras deve funcionar para Pollock 7, Pollock 3 e Guedes.');
}
const file = path.join(root, '.env');
const tracked = cp.spawnSync('git', ['ls-files','--error-unmatch','.env'], {cwd: root, encoding:'utf8', stdio:'ignore'});
if (tracked.status === 0) {
  warn.push('Existe .env versionado. Confirme que contém SOMENTE EXPO_PUBLIC_* (nenhum segredo privado); não mostraremos seu conteúdo.');
}
for (const w of warn) console.log('ATENÇÃO:', w);
if (errors.length) {
  console.error(`\nREPROVADO: ${errors.length} problema(s). Nenhum arquivo modificado.`);
  process.exit(1);
}
console.log('\nOK: 6 módulos, telas, links e chamadas autenticadas conferidos.');
console.log('IMPORTANTE: execute TypeScript, Expo Doctor e ESLint separadamente.');
