# MF Avaliação - correção da conclusão no PWA (06/11/2026)

## Alterações

- Confirmação de **Concluir avaliação** no Safari/Chrome/PWA e no iOS/Android nativo.
- Cancelar não altera dados; confirmar mantém a verificação das 7 seções já implementada pela API.
- Mensagens de falha da conclusão aparecem junto ao botão.
- Corrigida a confirmação de **exclusão de foto postural** na versão web.
- Removido aviso desatualizado sobre seções que seriam habilitadas futuramente.
- Removido aviso duplicado do IMC e unificados avisos de classificação neuromotora.
- **Nenhuma alteração de API, banco, migrações, credenciais, fórmulas ou registros.**

## Verificação antes de publicar

1. npm ci --include=optional --no-audit --no-fund
2. npx tsc --noEmit && npm run lint
3. EXPO_PUBLIC_API_URL=https://mf-avaliacao-api.onrender.com/api/v1 npx expo export -p web
4. node scripts/mf-pwa/VERIFICAR_PWA.cjs --dist
5. Com avaliação de teste 7/7: cancelar conclusão, confirmar, verificar status concluído, somente leitura e histórico.
6. Testar cancelar/confirmar a exclusão de foto **fictícia**.

**A homologação profissional dos protocolos e classificações continua pendente.**
Não utilizar resultados estimativos como oficiais sem aprovação profissional.
