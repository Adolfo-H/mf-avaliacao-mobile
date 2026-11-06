# MF Avaliação Física — hospedagem e segurança da versão PWA

**A instalação na tela inicial do iPhone não custa assinatura Apple Developer.** Ainda é preciso hospedar o frontend e a API para acesso 24h, por HTTPS. Isso pode envolver custos.

## Arquitetura

- Frontend: `npx expo export -p web` → `dist/` (site **SPA**, `web.output = single`).
- Navegação: Netlify usa `public/_redirects` para devolver `index.html` às rotas dinâmicas (`/students/<uuid>`, etc.). Em Nginx usar `try_files $uri $uri/ /index.html;` no host do frontend.
- Backend: a API Laravel 13 mantém MySQL e fotos em disco privado, nunca é incluída no `dist/` e **não** deve estar hospedada em um frontend estático.
- Autenticação: token de sessão Bearer; a web atual usa `sessionStorage`, nunca `localStorage` para guardar histórico ou fotos.
- PDF: a API gera sob autorização; no Safari fica em Blob URL temporária, revogada na exclusão do documento.
- **Sem service worker**: não armazenamos offline fotos, PDF, respostas da API ou tokens. É um PWA online.

## Variáveis: SEMPRE DOMÍNIOS REAIS

No ambiente que compila o site (`.env.local` de trabalho ou variáveis do provedor do frontend):

```dotenv
EXPO_PUBLIC_API_URL=https://api.SEU-DOMINIO.com/api/v1
```

`EXPO_PUBLIC_` é PUBLICO no bundle JS; não colocar senhas, tokens, APP_KEY ou segredos nesse prefixo.

Na API Laravel hospedada (configuração PRIVADA; **não enviar ao Git**):

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.SEU-DOMINIO.com
MF_PWA_ALLOWED_ORIGINS=https://app.SEU-DOMINIO.com
```

Para teste local: CORS permite `http://localhost:8081` e `http://127.0.0.1:8081` por padrão. Em produção especifique exclusivamente os domínios HTTPS controlados. Não use `*` nem coloque `/` no final das origens.

Se o Laravel usa `config:cache`, recriar cache após atualização das variáveis. Mantenha Sanctum, limiter de login, backups restauráveis e logs de auditoria habilitados.

## Hospedar o frontend na Netlify (exemplo; só com API HTTPS pronta)

1. Rodar `TESTAR_MOBILE.cmd` e garantir que `dist/` foi gerado.
2. Conferir `dist/index.html`, `dist/manifest.webmanifest`, `dist/_redirects` e `dist/_headers`.
3. Publicar **somente `dist/`** como site estático em um provedor sob sua conta (por exemplo, Netlify). Configurar build `npx expo export -p web`, publish directory `dist`. Se o frontend for compilado na nuvem, cadastrar `EXPO_PUBLIC_API_URL` nas variáveis do provedor.
4. O servidor deve apresentar HTTPS válido; testar por Safari no iPhone.
5. O servidor da API deve ter HTTPS válido, CORS para o domínio do frontend, banco persistente, armazenamento privado e backup em máquina separada.
6. Instalar o PWA pelos passos do `GUIA_IOS.md`.

**Não publique a API Laravel ou banco de dados em hospedagem estática. Não exponha a API de desenvolvimento do WSL para a internet com dados clínicos sem autenticação, HTTPS e validação de segurança.**

## Pendências antes de produção

- [ ] Hospedagem de API e banco de produção estáveis (não depender do notebook ligado).
- [ ] HTTPS em ambos os domínios e CORS exato.
- [ ] Troca de todas as credenciais eventualmente expostas no histórico Git (o repositório já teve `.env` rastreado).
- [ ] Revisão de vulnerabilidades npm ainda abertas.
- [ ] Política de privacidade / consentimento e controle de acessos revisados.
- [ ] Backup externo criptografado, teste periódico de recuperação, APP_KEY e GPG salvas separadamente.
- [ ] Cálculos clínicos homologados pela profissional antes de exibir laudos.
- [ ] Teste ponta a ponta nos dois iPhones e documentação de aceite.
