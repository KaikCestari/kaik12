# Sabom

MVP web para controle de mesas, pedidos e caixa de uma lanchonete.

## Funcionalidades

- Interface responsiva com visual de aplicativo desktop.
- Experiência mobile para o garçom, com carrinho fixo e controles próprios para toque.
- Busca de produtos, itens avulsos e observação por item.
- Salão configurado com 70 mesas.
- Histórico dos pedidos enviados durante o atendimento.
- Painel administrativo de pedidos do turno, com filtros de pagos e não pagos.
- Gestão de cardápio, categorias, preços e disponibilidade.
- Painel de preparo por item para cozinha e bar.
- Impressão do pedido ou de uma prévia em bobina térmica de 80 mm.
- Perfis de garçom e administrador, com gestão de usuários restrita ao administrador.
- Aplicativo Web Progressivo (PWA), instalável pela opção **Adicionar à tela inicial** do navegador.

## Tecnologia

- Next.js e TypeScript
- React
- PostgreSQL no Supabase; acesso exclusivamente pelo servidor Next.js
- CSS responsivo

## Executar localmente

```bash
npm install
npm run dev
```

Configure o Supabase conforme abaixo antes de entrar. Acesse `http://localhost:3000`.

No celular, abra o endereço do sistema no navegador e use **Adicionar à tela inicial**. O Sabom será aberto em modo de aplicativo, sem a interface do navegador.

Para imprimir um pedido, adicione os itens e use **Imprimir prévia**, ou envie o pedido e use **Imprimir** no histórico. O layout foi preparado para bobinas de 80 mm e também pode ser salvo como PDF pela janela do navegador.

Contas, sessões, produtos, mesas e pedidos ficam no Supabase. O sistema não utiliza banco local nem fallback em memória.

## Perfis

- Garçom: abre mesa com número e nome temporário, adiciona produtos cadastrados ou avulsos e envia pedidos.
- Administrador/caixa: também adiciona pedidos, mantém cadastros e confirma o pagamento para liberar a mesa.

O item avulso pertence apenas ao pedido e deve receber nome, preço, quantidade, destino (cozinha ou bar) e observação opcional.

## Configurar o Supabase

O projeto `sabom` já foi migrado e inicializado. Consulte [o estado da configuração e os passos restantes](docs/supabase-setup.md) antes de executar os passos abaixo, destinados a bancos novos.

1. No SQL Editor de um projeto Supabase novo, aplique os arquivos de `supabase/migrations/` em ordem: `20260915225255_sabom.sql` e `20260915225400_preparation.sql`. Se a primeira migration já foi aplicada, execute somente a segunda. `supabase/schema.sql` é apenas um aviso apontando para as migrations.
2. Copie `.env.example` para `.env.local` e configure `SUPABASE_URL` e `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`). A chave fica apenas no servidor.
3. Para inicializar um banco vazio, defina `SABOM_ADMIN_PASSWORD` com pelo menos 8 caracteres e execute `npm run supabase:bootstrap`. Isso gera `data/supabase-import.sql` com o usuário `admin`, 70 mesas e um cardápio inicial. Revise os preços antes de operar.
4. Aplique o SQL gerado no mesmo projeto. A inicialização exige tabelas vazias e aborta integralmente caso já existam dados. Não execute esse passo em um projeto que já está em uso. O gerador recusa sobrescrever arquivos; use `SABOM_EXPORT_PATH` se precisar gerar em outro destino. O arquivo contém o hash da senha: mantenha-o privado.
5. Se o `admin` já existir no Supabase mas a senha estiver perdida ou errada, defina uma nova `SABOM_ADMIN_PASSWORD` e execute `npm run supabase:reset-admin` para redefinir o acesso sem apagar os dados.
6. Execute `npm run dev`, entre com `admin` e a senha escolhida, cadastre a equipe e ajuste o cardápio.

## Publicar

Hospede o aplicativo em um serviço com suporte ao servidor Node.js/Next.js (o Supabase hospeda o banco). Configure as variáveis `SUPABASE_URL` e `SUPABASE_SECRET_KEY` na hospedagem, execute `npm run build` e use `npm start` quando o provedor exigir um comando de início. Use HTTPS para os cookies de produção e a instalação do PWA.

## Cardápio e preparo

- **Cardápio (administrador):** criar categorias e produtos, editar nome, preço, categoria e destino, suspender e reativar produtos. Os valores de pedidos enviados são preservados.
- **Preparo (equipe autenticada):** filtrar cozinha/bar e avançar cada item por pendente → preparando → pronto → entregue. Atualização automática a cada 10 segundos. Alterações concorrentes são recusadas para evitar avançar duas etapas por engano.
- O pagamento não remove itens ainda em preparo; eles saem da fila ao confirmar a entrega. Pedidos encerrados antes da migration não entram na fila.
- É necessário acesso à internet. O PWA não envia pedidos offline.

## Verificação

```bash
npm run lint
npx tsc --noEmit
npm run test:supabase
npm run build
```

Os testes executam as migrations em PostgreSQL via PGlite e cobrem inicialização, atomicidade de pedidos, preços históricos, indisponibilidade, fechamento, permissões e transições de preparo. A conexão com o projeto hospedado precisa ser validada após configurar as credenciais.

O MCP serve para administrar/aplicar a migração. Durante o uso, o Next.js acessa o Supabase pela biblioteca `@supabase/supabase-js`. RLS e permissões bloqueiam acesso direto das funções e tabelas por `anon` e `authenticated`; o servidor valida a sessão e o perfil antes de usar a chave secreta. Veja a [documentação de chaves do Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

O envio de pedido e a confirmação de pagamento usam funções PostgreSQL com bloqueio da mesa e transação única. O painel do turno considera o início às 06h no fuso `America/Sao_Paulo`, independentemente do fuso do servidor. Não há dependência de SQLite, banco local ou importador legado.
# kaik12
