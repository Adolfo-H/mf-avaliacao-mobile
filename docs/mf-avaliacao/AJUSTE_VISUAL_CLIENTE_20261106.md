# MF Avaliação Física — Ajustes visuais para a versão do cliente

## Entrega de 06/11/2026 — somente Mobile/PWA

Base de código: `Adolfo-H/mf-avaliacao-mobile`, `main` no commit `a838fed5b3bffbf357ab7efeb33b69ec3efb5a06`.

### O que foi alterado

1. **Concluir avaliação:** diálogo visual próprio, com cores e tipografia do MF (navy e verde), progresso das seções, mensagens de confirmação e botões Voltar/Concluir. A decisão é explícita e funciona no PWA, Safari, Chrome e React Native; mantém chamada anterior a `POST /assessments/{uuid}/complete`.
2. **Jackson–Pollock:** escondido o acesso à tela experimental "Prévia das fórmulas" e retirada a caixa de aviso repetida no fim das dobras cutâneas. Os campos para registrar dobras, protocolos e dados já salvos foram preservados. O calculador de pesquisa da API **não foi alterado**.
3. **PAR-Q:** retirada a seção da anamnese (perguntas, formulário externo e avisos). O salvamento da anamnese deixa de enviar `parq_answers` ou `parq_external`, o que preserva eventuais registros antigos. **Nenhum registro é excluído do banco**, nenhum endpoint da API é apagado.

### Validação

O instalador valida a revisão Git e o conteúdo original dos três arquivos antes de editar. Depois executa `npm ci`, TypeScript, ESLint, Expo Doctor, compilação Expo Web e verificação estrutural PWA. Só gera o ZIP completo após os testes serem aprovados.

### Precauções

- Não altera a API, o banco TiDB, as fotografias, chaves, senhas nem o Render.
- Código novo é criado em worktree independente; a `main` e a versão publicada permanecem intactas até revisão, commit, merge e deploy.
- Remover o PAR-Q da interface **não é uma decisão de triagem clínica**. Antes de utilizar o app com alunos reais, a profissional deverá definir como realiza sua avaliação de prontidão e registrar esse processo adequadamente; os cálculos ainda não homologados não podem ser tratados como laudos oficiais.
- **O ZIP completo será gerado no computador WSL do usuário**, e não está dentro deste ZIP de correção. Ele inclui todo o código Mobile versionado com as mudanças aplicadas.

### Teste de aceitação na versão publicada

Com um aluno fictício: abrir uma avaliação 7/7, clicar em "Concluir avaliação", testar **Voltar** sem fechar e depois **Concluir**, verificar status concluído e somente leitura. Conferir que o PAR-Q não aparece na Anamnese; que a Composição Corporal mantém dobras e botão Salvar; e que não há atalho para "Prévia das fórmulas".
