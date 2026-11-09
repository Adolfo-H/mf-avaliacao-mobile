# MF Saúde & Movimento — revisão visual v4 (9/11/2026)

## Evidência visual examinada

Foram examinadas as **28 capturas** do conjunto `WhatsApp Unknown 2026-11-09 at 16.54.36.zip`, incluindo cadastro/edição e ficha do aluno, histórico e seções de avaliação: anamnese, composição corporal, perímetros, VO₂ máximo, testes neuromotores, fotos de evolução e avaliação postural. **As fotografias e dados pessoais presentes nas capturas não fazem parte do código ou deste pacote.**

Problemas visíveis: títulos/valores de campos com contraste muito baixo em superfícies brancas; opções e avisos de avaliação com texto esmaecido; dados de testes concluídos praticamente ilegíveis; mistura aparente de cores claras/escuras; e `Cuidar começa\npor conhecer.` mostrado literalmente no dashboard.

## Diagnóstico do código e escopo

A base auditada é o commit `7d3b3b7760331f42c698424b2d396a8e837ff0d5` do Mobile. As telas legadas usam `MFStyleSheet` para converter cores no momento do acesso a `styles.algo`; esse cálculo depende de `getMFPalette()` global. O React Compiler otimiza a leitura do objeto, sem que a variável global seja uma dependência React explícita. Isso **pode** manter cores do tema anterior enquanto a superfície já mudou. É uma hipótese fundamentada na implementação e coerente com as imagens, a confirmar em teste real pós-publicação.

Em paralelo, várias telas concluídas aplicam `opacity: 0.4–0.65` a blocos/entradas desabilitadas. No Safari, o próprio estado disabled/readonly pode reduzir ainda mais a leitura dos campos.

## Mudanças no frontend (sem API ou banco)

1. Inserida a diretiva `"use no memo";` no início das telas antigas que utilizam o adaptador `MFStyleSheet`, como medida de compatibilidade para evitar otimização incorreta da leitura das cores. A diretiva é oficial do React Compiler e não altera os eventos dos formulários, URLs nem o estado clínico. A limpeza arquitetural futura ideal seria substituir o adaptador global por estilos obtidos diretamente do contexto de tema.
2. `lib/mf-styles.ts`: campos desabilitados/de leitura passam a apresentar opacidade de **no mínimo 0,92**, mantendo **`editable={false}`** e os controles de autorização existentes. Os demais estilos continuam sob o adaptador atual.
3. `public/mf-theme-visual-v4.css`: cores explícitas para entradas HTML `:disabled` e `[readonly]` nos temas claro/escuro, incluindo `-webkit-text-fill-color` exigido pelo Safari/WebKit. O CSS anterior de autofill do login é mantido.
4. `public/index.html`: referencia v4 para evitar usar arquivo CSS antigo.
5. `app/(app)/(tabs)/dashboard.tsx`: `Cuidar começa\npor conhecer.` passa a ser uma **quebra de linha real** por expressão JavaScript no JSX.
6. `app/(auth)/login.tsx`: corrigido o mesmo problema de `Cada evolução\ncomeça com\num novo olhar.` na apresentação desktop.
7. Teste preexistente `VERIFICAR_CORES_E_LOGIN.cjs` atualizado para conferir CSS v4. `scripts/mf-qa/VERIFICAR_LEITURA_V4.cjs`: testes de alternância da mesma instância de estilos, contraste de diferentes superfícies, opacidade de campos desabilitados, CSS, texto e adesão das telas antigas.

## Preservação de funcionalidades e dados

Não toca `services/`, `types/`, `lib/api.ts`, autenticação, dados dos alunos, fotos, regras clínicas, backend Laravel, banco TiDB nem Backblaze. O ZIP gerado usa a árvore de código existente em worktree isolado. Nenhuma credencial ou dado de aluno é incluído, e não há push/merge/deploy automático.

## Aceite técnico e limitações

A geração do código completo só acontece se o Ubuntu aprovar:

- `npx tsc --noEmit`
- `npm run lint`
- teste preexistente de contraste e login, mais o novo teste v4
- `npx expo-doctor`
- exportação Web/Metro com URL conhecida da API e validação PWA/CSS

Esses testes são **estruturais e de lógica, não substituem um teste visual em dispositivo real**. Antes de publicar para clientes, testar em versão preview as 7 seções com avaliações em andamento e concluídas, filtros em claro/escuro, campos de leitura e login/autofill. Testar com aluno fictício; aprovação de compilação não equivale à homologação clínica.
