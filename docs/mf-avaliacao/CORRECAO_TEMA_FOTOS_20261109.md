# MF Avaliação — leitura e fotografias (09/11/2026)

- Um único tema ativo para o React Context, estilos legados e CSS iOS/PWA.
- Correção de textos claros sobre branco, verdes escuros no modo escuro e estados selecionados.
- Estilos em cartões, seletores, botões e detalhes agora usam paletas com contraste revisado.
- Listas de alunos e avaliações exibem a foto privada cadastrada quando `has_photo=true`.
- Busca de miniatura: mesma API autorizada existente; no máximo 3 GETs simultâneos; cache só em memória, por usuário, 24 imagens/90s.
- Upload e exclusão invalidam miniaturas em memória; logout limpa miniaturas; GET usa `cache: no-store`.
- Não cria endpoint novo, não altera backend, banco, credenciais, permissões nem PDFs.
- Não foi testada com usuário autenticado: testar com aluno fictício após deploy de pré-visualização.
