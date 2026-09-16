# Configuração do projeto sabom

Projeto: `sxqkpshpzvfggvyoxrxe`. Verificado em 15/09/2026 via MCP autenticado.

## Concluído

- Banco inicialmente vazio; aplicadas as migrations `20260915225255_sabom.sql` e `20260915225400_preparation.sql`.
- Os arquivos foram renomeados para corresponder às versões geradas pelo MCP. Conteúdo SQL preservado; não reaplicar os nomes antigos `202609100001` e `202609150001`.
- Criadas 7 tabelas, 5 views com `security_invoker` e 6 funções `SECURITY INVOKER` com `search_path` fixo.
- RLS ativado nas tabelas; acesso de `anon` e `authenticated` revogado. O servidor usa a chave secreta e verifica sessão/perfil.
- Inicializado 1 administrador (`admin`), 70 mesas, 3 categorias e 10 produtos. Nenhum pedido real inserido.
- Senha inicial aleatória salva apenas em `.env.local` (`SABOM_ADMIN_PASSWORD`), com permissão 600. Guarde-a em um gerenciador de senhas e remova essa variável após a inicialização. Não a cadastre nas variáveis da hospedagem.
- Importação anterior preservada. Novo arquivo privado: `data/supabase-bootstrap-20260915.sql`, já aplicado. Não reaplicar.
- Cadastro de funcionários restrito a administradores; novos acessos exigem senha entre 12 e 128 caracteres. Contas existentes não tiveram senhas redefinidas.
- Pedido → preparo → entrega → solicitação/confirmacão de pagamento testado no banco remoto com `service_role`, em transação revertida ao final. Zero pedidos persistidos pelo teste; sequências podem ter lacunas normais após rollback.

## Configuração indispensável antes de usar

1. Abra [API Keys do projeto](https://supabase.com/dashboard/project/sxqkpshpzvfggvyoxrxe/settings/api-keys).
2. Copie a chave **secret** (`sb_secret_…`) para `SUPABASE_SECRET_KEY` em `.env.local`. A alternativa legada é `SUPABASE_SERVICE_ROLE_KEY`. A URL já está preenchida. Não use uma chave publishable/anon e não coloque a chave na conversa, no Git ou em variáveis `NEXT_PUBLIC_`.
3. Execute `npm run supabase:check`. O comando consulta tabelas e views sem alterar dados nem imprimir credenciais.
4. Se o login de admin não funcionar porque a senha foi perdida, defina uma nova `SABOM_ADMIN_PASSWORD` e execute `npm run supabase:reset-admin`. Isso atualiza apenas o usuário `admin` e não apaga mesas, pedidos nem cardápio.
5. Reinicie `npm run dev`, entre com `admin` e a senha escolhida, cadastre a equipe em **Equipe** e confira preços/cardápio.

OAuth do MCP autoriza a administração do projeto, mas não fornece a chave secreta ao processo Next.js. A conexão HTTP autenticada do aplicativo e o login completo continuam pendentes até essa configuração.

## Verificações

Lint, build e testes PostgreSQL/PGlite passaram. No ambiente restrito, os testes exigiram execução fora do sandbox porque o subprocesso Node foi bloqueado (EPERM). Foram verificadas também as permissões reais no projeto pelo MCP.

Os advisors não apontaram erros nem avisos de segurança; há [informações de RLS sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), intencionais neste modelo de acesso somente pelo servidor. Há [4 chaves estrangeiras sem índice](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys), melhoria de desempenho a acompanhar com o crescimento, e índices ainda sem uso em banco recém-criado.

A pasta `.git` disponível nesta sessão não contém metadados de um repositório Git válido; não foi possível verificar o índice ou criar commit. `.gitignore` protege `.env.local` e os arquivos privados de inicialização. Antes de publicar, confirme isso no checkout Git real.

## Publicar

Use hospedagem Node.js compatível com Next.js, configure somente `SUPABASE_URL` e `SUPABASE_SECRET_KEY` como variáveis do servidor e habilite HTTPS. Execute `npm run build`; use `npm start` se necessário. Valide login/logout, cadastro de funcionário e acesso negado para garçom à gestão de usuários, além de um atendimento completo pela interface. Não publique antes de validar a conexão com a chave configurada.
