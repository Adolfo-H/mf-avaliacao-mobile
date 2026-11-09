#!/usr/bin/env node
'use strict';
/* Testes offline de tokens e ponte de estilos; nenhum dado clínico é lido. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = process.cwd();
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

function loadTS(file, requireStub) {
  const src = read(file);
  const out = ts.transpileModule(src, {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  });
  const errors = (out.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, file + ' inválido: ' + errors.map(e => e.messageText).join('; '));
  const sandbox = { module: { exports: {} }, exports: {}, require: requireStub };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(out.outputText, sandbox, { filename: file });
  return sandbox.module.exports;
}
const colors = loadTS('lib/mf-tokens.ts', name => { throw Error('Módulo inesperado: '+name); });
let theme = 'light';
const styles = loadTS('lib/mf-styles.ts', name => {
  if (name === 'react-native') return { Dimensions: { get: () => ({ width: 390 }) }, StyleSheet: { create: x => x } };
  if (name === '@/lib/mf-tokens') return {
    getMFActiveTheme: () => theme, getMFPalette: () => colors.MF_COLORS[theme],
  };
  throw Error('Módulo inesperado: '+name);
});
const sample = styles.MFStyleSheet.create({
  historyDate: { color: '#172D34' },
  metricValue: { color: '#172D34' },
  name: { color: '#FFFFFF' },
  age: { color: '#C9D8DA' },
  selectionLabel: { color: '#336B55' },
  statusLabel: { color: '#91BCAA' },
  filterButtonActive: { backgroundColor: '#40856C' },
  filterTextActive: { color: '#FFFFFF' },
  selectedName: { color: '#FFFFFF' },
  saveButton: { backgroundColor: '#123C47' },
  saveButtonText: { color: '#FFFFFF' },
  content: { paddingHorizontal: 20 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E4E9E7' },
});
function luminance(hex) {
  const values = hex.slice(1).match(/.{2}/g).map(n => parseInt(n, 16) / 255);
  const linear = values.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}
function contrast(a, b) {
  const x=luminance(a), y=luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
let assertions = 0;
function check(fg,bg,label) {
  const ratio=contrast(fg,bg);
  assert.ok(ratio>=4.5, `${label}: contraste ${ratio.toFixed(2)}:1 menor que 4.5:1`);
  assertions += 1;
}
for(const t of ['light','dark']) {
  theme=t;
  const c=colors.MF_COLORS[t];
  check(sample.historyDate.color, sample.card.backgroundColor, `${t} data histórico`);
  check(sample.metricValue.color, sample.card.backgroundColor, `${t} valores`);
  check(sample.name.color, sample.card.backgroundColor, `${t} nome ficha`);
  check(sample.age.color, sample.card.backgroundColor, `${t} idade`);
  check(sample.selectionLabel.color, c.greenSoft, `${t} seleção`);
  check(sample.statusLabel.color, c.navy, `${t} etiqueta status`);
  check(sample.filterTextActive.color, sample.filterButtonActive.backgroundColor, `${t} filtro ativo`);
  check(sample.selectedName.color, c.navy, `${t} nome cartão azul`);
  check(sample.saveButtonText.color, sample.saveButton.backgroundColor, `${t} salvar`);
  check(c.ink,c.bg,`${t} títulos sobre fundo`);
  check(c.muted,c.surface,`${t} legendas`);
  check(c.greenText,c.surface,`${t} links`);
}
assert.equal(styles.mfLegacyColor('#FFFFFF'), '#FFFFFF', 'ícones brancos inline não podem desaparecer');
assert.equal(styles.mfLegacyColor('#FFFFFF', 'placeholderTextColor'), colors.MF_COLORS[theme].muted);
const themeProvider = read('contexts/MFThemeContext.tsx');
assert.ok(themeProvider.includes('setMFActiveTheme(theme);'), 'contexto deve sincronizar tema no render');
assert.ok(themeProvider.includes("setAttribute('data-mf-theme', theme)"), 'CSS deve sincronizar tema');
const students = read('app/(app)/(tabs)/alunos.tsx');
const assessments = read('app/(app)/(tabs)/avaliacoes.tsx');
const avatar = read('components/MFStudentAvatar.tsx');
assert.ok(students.includes('<MFStudentAvatar uuid={item.uuid} hasPhoto={item.has_photo}'));
assert.ok(assessments.includes('<MFStudentAvatar uuid={item.student.uuid}'));
assert.ok(avatar.includes('getStudentPhotoDataUrl(uuid)'));
assert.ok(avatar.includes('useAuth()'));
assert.ok(read('services/students.ts').includes('invalidateMFStudentThumbnail(uuid)'));
assert.ok(read('contexts/AuthContext.tsx').includes('clearMFStudentThumbnails()'));
assert.ok(read('services/students.ts').includes("cache: 'no-store'"));
console.log(`TEMA_FOTOS_OK — ${assertions} contrastes AA + carregamento privado e invalidacao`);
