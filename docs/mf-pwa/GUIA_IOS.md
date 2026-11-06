# MF Avaliação Física — instalação no iPhone via PWA

## Objetivo

Abrir o aplicativo pelo Safari e usar **Compartilhar → Adicionar à Tela de Início → Abrir como App** nos dois iPhones, sem precisar assinar Apple Developer. O ícone é reutilizado de `assets/images/icon.png` do projeto Expo.

> Este PWA **não tem funcionamento offline**. Precisa de internet para consultar ou salvar avaliações. Fotos e dados clínicos não são armazenados por service worker. Não use dados reais até concluir a homologação, a infraestrutura HTTPS e os testes no aparelho.

## Teste no notebook — sem publicar

No CMD:

```bat
cd /d C:\Projetos\mf-avaliacao-mobile
npx expo start --web --clear
```

Abra o endereço local mostrado pelo Expo no navegador do computador. Para login local, `EXPO_PUBLIC_API_URL` em `.env.local` deve apontar para a API (normalmente `/api/v1`), e a API deve aceitar a origem web no CORS.

### Testar PDF no Safari

1. Escolher aluno → Histórico → Relatórios PDF.
2. Escolher uma avaliação concluída e clicar **Gerar PDF**.
3. Clicar **Abrir PDF / imprimir / compartilhar**. O Safari abre o documento em outra aba ou visualizador.
4. Retornar à tela e selecionar **Excluir cópia temporária**. A URL temporária é revogada.

No iPhone instalado, uma janela de visualização pode ir para o Safari. Teste a abertura e o compartilhamento real antes da liberação.

### Testar fotografias

O Expo ImagePicker e ImageManipulator têm suporte Web; entretanto, a câmera e os seletores do Safari dependem de interação direta e de permissões. Testar no **iPhone real em HTTPS**, com fotos fictícias e consentimento ativo. A tela pode abrir o seletor de arquivos em vez do editor nativo usado no aplicativo iOS.

## Instalar na tela inicial após publicar HTTPS

1. Abrir a URL HTTPS do PWA pelo **Safari** do iPhone.
2. Tocar no menu da página ou botão **Compartilhar**.
3. Selecionar **Adicionar à Tela de Início**.
4. Habilitar **Abrir como App** se a opção aparecer.
5. Tocar em **Adicionar** e abrir **MF Avaliação** pelo ícone.

Repetir no outro iPhone. Os usuários entram com suas próprias contas. O `sessionStorage` do navegador pode exigir novo login após encerrar o PWA, por segurança.

## Matriz de aceite (dois aparelhos)

- [ ] A interface inicial abre e as telas cabem na área útil, sem cortar botões.
- [ ] O login real funciona via HTTPS; logout revoga sessão.
- [ ] Administrador, avaliador e recepção veem apenas o permitido.
- [ ] Aluno fictício: cadastro, edição e histórico de avaliações.
- [ ] Sete seções podem ser preenchidas, salvas e abertas novamente.
- [ ] Fotos de aluno, evolução e posturais: captura/seleção, upload e leitura.
- [ ] Bloqueio de foto com consentimento revogado.
- [ ] Gráficos de evolução e comparação de avaliações.
- [ ] PDF é aberto no Safari sem expor link público com token.
- [ ] Fotos, PDFs e dados não aparecem quando a pessoa sai da conta.
- [ ] Sem internet: exibe erro de rede sem alterar dados ou simular salvamento.
- [ ] Fechar e reabrir ícone: funciona com a política de login adotada.

O aceite da profissional responsável e a revisão da LGPD são obrigatórios antes de usar dados reais.
