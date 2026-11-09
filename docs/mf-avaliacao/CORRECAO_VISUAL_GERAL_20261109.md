# MF Saúde & Movimento — correção visual geral

**Base GitHub Mobile:** `9467027fbc3527892fd5f53fdc28e5373791a2c3` (após PR #25 — temas e fotos). Revisão de 09/11/2026.

## Causa diagnosticada

As telas legadas do sistema (perímetros, VO₂ máximo, composição corporal, anamnese, testes neuromotores, evolução fotográfica, postura, relatórios, cadastro e histórico) passam por `MFStyleSheet`, uma adaptação de cores. Ela tratava o texto de forma independente do fundo onde ele é desenhado, de modo que branco e tons pastel às vezes eram preservados em cartões brancos, ou texto escuro em botões escuros. Em especial, o estado ativo/selecionado combinava um verde muito claro com fontes claras. O problema afetava os dois temas.

No login, o retângulo amarelo mostrado na captura é consistente com o estilo automático de `:autofill` do Safari/WebKit e outros navegadores. A correção CSS visa esse estado sem impedir o preenchimento automático de senhas.

## Arquivos alterados

- `lib/mf-styles.ts`: substituição somente da ponte visual. Usa tokens já existentes; diferencia campos de entrada, cartões, botões de ação, estados ativos, avisos e rótulos associados à superfície. Recalcula a cor após mudar o tema. Preserva estilos e handlers das 28 telas legadas.
- `public/mf-theme-visual-v3.css`: novo CSS com cores próprias para `:autofill` do login claro/escuro e indicadores de foco; escopo limitado a email/senha.
- `public/index.html`: referencia nome de CSS versionado, evitando carregar a versão antiga do cache do PWA.
- `app/(auth)/login.tsx`: identifica os dois inputs com `nativeID`, informa `autoComplete` e mantém os estados, login, sessão e fluxo existentes.
- `scripts/mf-qa/VERIFICAR_CORES_E_LOGIN.cjs`: matriz de pares de cores nas telas, validação dos dois temas, fontes/estrutura das telas legadas, verificação do CSS e IDs de login.

## Preservação funcional e de dados

Nenhum código da API, autenticação de backend, serviços de armazenamento de fotos, biblioteca de PDF, fórmulas ou cálculos clínicos foi modificado. O pacote não contém senhas, tokens nem dados pessoais, nem publica nada automaticamente. O ícone personalizado da empresa e o cache privado de fotos da PR #25 são mantidos.

## Validações e limites

O script exige compilação TypeScript, ESLint, Expo Doctor, testes da ponte visual, exportação Web/Metro e verificações PWA antes de gerar o ZIP completo. Em ambiente local sem o repositório completo, a matriz de contraste e a sintaxe foram testadas com cenários simulados; a compilação real só pode ser declarada aprovada quando o script rodar no repositório do Ubuntu.

**Validação manual obrigatória antes da produção:** em um ambiente de prévia/testes, conferir temas claro e escuro e estados salvo/concluído/bloqueado nas sete seções, incluindo perímetros, VO₂, bioimpedância/composição, anamnese, neuromotor, postura e fotos; confirmar login com senha preenchida pelo Safari; conferir geração de PDF e foto do aluno já salvo. A análise do código não substitui homologação clínica ou verificação funcional em aparelho real.
