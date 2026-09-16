# Sabom — interface de atendimento

Objetivo: permitir que garçons registrem pedidos rapidamente e que o caixa identifique as próximas comandas a receber.

## Direção visual
- Azul principal #2449D8: ações e navegação.
- Tinta #202B43: textos e identidade.
- Fundo #F5F7FB: separação das áreas de trabalho.
- Branco #FFFFFF: superfícies de leitura.
- Verde #147D64: mesas livres e confirmações.
- Âmbar #A46612: pagamento pendente.
- Tipografia: Avenir Next com fallback em Segoe UI, títulos semibold e números tabulares; corpo 14–16px.
- Alinhamento à esquerda, espaço consistente e estados descritos em palavras além de cores.

## Layout escolhido
Desktop:
```
[Navegação] [Título da seção / pessoa conectada     ]
[         ] [Salão e ação de atualizar             ]
[         ] [Resumo do atendimento                 ]
[         ] [Busca e filtros          ] [No caixa  ]
[         ] [Mesas em grade           ] [Comandas  ]
```
Celular:
```
[Marca / pessoa]
[Título / ação]
[Resumo 2 x 2]
[Busca / filtros roláveis]
[Mesas 2 colunas]
[Navegação inferior / Mais]
```

## Revisão antes da implementação
Uma grade uniforme de indicadores tinha pouca utilidade para o caixa. O desenho foi revisado para acrescentar uma fila acionável de pagamentos junto ao salão. O foco visual está na identificação das mesas, com números grandes e informação real das comandas; não há gráficos decorativos ou indicadores inventados. A tela de login usa uma composição gráfica de mesa feita em CSS, ligada ao assunto do produto.

## Comportamentos
Busca por mesa ou nome, filtros por situação, acesso direto às comandas; menu móvel com equipe, ajustes e saída; carrinho com quantidades e observações; cardápio por categoria e disponibilidade; fila de preparo e gestão de equipe conectadas às APIs existentes. Diálogos com foco contido, Escape e restauração do foco. Zoom habilitado e movimento reduzido respeitado.

## Validação realizada
- `npm run lint`: aprovado.
- `npm run build`: aprovado, incluindo TypeScript.
- Chromium: login, mesas, pedidos, cardápio, preparo, equipe, configurações e comanda em 1440, 390 e 320 pixels (24 combinações), sem transbordamento horizontal.
- Interações verificadas: filtros de situação, busca por cliente, busca sem resultados e limpeza, menu móvel, abertura de equipe, abertura/fechamento de diálogos com Escape, filtro de categoria, adição e alteração de quantidades no carrinho.
- Nenhum erro JavaScript detectado no navegador durante o teste.
- Capturas em `docs/previews` usam dados simulados; não representam movimentação real do restaurante.
- APIs e permissões existentes preservadas. Operações no Supabase real não foram executadas nesta validação de interface.
