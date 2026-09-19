# Vida Natural — loja

E-commerce da [Vida Natural](https://www.vidanat.com.br/) em Next.js: vitrine
redesenhada + backend real (catálogo em banco, carrinho validado no servidor,
cupons, promoções, pedidos e checkout com Mercado Pago).

Todo o conteúdo comercial (produtos, preços, descrições, imagens, categorias,
textos institucionais) foi extraído do site atual — nada foi inventado.

## Rodando

```bash
npm install
cp .env.example .env          # preencha o que for usar
npx prisma migrate dev        # cria o banco
npx prisma db seed            # popula com o catálogo real
npm run dev                   # http://localhost:3000
```

| Comando | O que faz |
| --- | --- |
| `npm run dev` | desenvolvimento |
| `npm run build` / `npm run start` | build e servidor de produção |
| `npm run lint` / `npm run typecheck` | ESLint e TypeScript |
| `npm run scrape` | reextrai o catálogo de vidanat.com.br |
| `npx prisma db seed` | recarrega o banco a partir do catálogo |
| `npm run test:commerce` | fluxo de compra (carrinho, cupom, pedido, webhook) |
| `npm run test:ui` | interações da interface (Playwright) |
| `npm run test:responsivo` | overflow, imagens e erros de JS em 5 larguras |
| `npm run test:links` | links internos, imagens e metadados de todas as páginas |
| `npm run db:studio` | interface visual para editar o banco |

> No Windows, abra sempre `http://localhost:3000` (e não `127.0.0.1`), senão o
> Next bloqueia os recursos de desenvolvimento e a página fica sem JavaScript.

## Stack

| Peça | Escolha |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Banco | Prisma 7 + SQLite (troca para Postgres em uma linha) |
| Estilos | Tailwind CSS 4 com tokens em `src/app/globals.css` |
| Animações | Framer Motion |
| Validação | Zod em toda entrada de API |
| Pagamento | Mercado Pago Checkout Pro (PIX, cartão, boleto) |

## Arquitetura

```
prisma/
  schema.prisma            modelo de dados
  seed.ts                  popula a partir de src/data/catalog.json
src/
  server/                  ← só roda no servidor (marcado com 'server-only')
    db.ts                  cliente Prisma
    catalog.ts             consultas do catálogo → DTOs
    cart.ts                RECÁLCULO do carrinho (fonte de verdade de preço)
    orders.ts              criação de pedido, status, histórico, estoque
    coupons                (dentro de cart.ts) validação de cupom
    shipping.ts            CEP (ViaCEP) e cotação de frete
    settings.ts            configurações da loja em chave/valor
    payments/mercadopago.ts  preferência, consulta e assinatura do webhook
    rate-limit.ts          limite por IP
  app/api/
    cart                   POST → recalcula o carrinho
    cep                    GET  → endereço pelo CEP
    search                 GET  → busca no catálogo
    checkout               POST → cria o pedido e a cobrança
    webhooks/mercadopago   POST → confirma pagamento (com assinatura)
    pedidos/consulta       POST → localiza pedido por e-mail + número
    admin/pedidos          GET/POST → operação da loja (token)
    admin/revalidar        POST → publica alterações do banco na hora
  app/                     páginas (home, produtos, categoria, checkout, pedido…)
  components/              UI (cart, checkout, product, home, layout, ui)
  lib/types.ts             DTOs compartilhados servidor ↔ cliente
```

### Regra de ouro do preço

O navegador **nunca** envia preço. Ele manda `slug` + `quantidade` + cupom +
CEP; `src/server/cart.ts` recalcula tudo a partir do banco, e
`src/server/orders.ts` recalcula de novo antes de gravar o pedido e gerar a
cobrança. Um preço adulterado no cliente não muda nada.

## O que está ligado e o que está desligado

Nada que envolva promessa comercial foi ativado por conta própria. Tudo abaixo
está **pronto e testado**, esperando a sua decisão:

| Recurso | Estado | Como ativar |
| --- | --- | --- |
| Promoção (`de/por`, % OFF, "economize") | estrutura pronta, **nenhum produto com promoção** | defina `compareAtPriceCents` no produto (Prisma Studio) — só com um preço anterior real |
| Ofertas progressivas (2/3 unidades) | pronto, **sem faixas cadastradas** | crie linhas em `PriceTier` com `minQuantity` e `unitPriceCents` |
| Cupons | pronto, cupom `BEMVINDO10` **inativo** | `active = true` no cupom, ou crie o seu |
| Frete grátis acima de X | pronto, **desligado** | `shipping.freeShipping.enabled = true` em `Setting` |
| Tabela de frete | **modo "a combinar"** | cadastre `ShippingRate` e mude `shipping.mode` para `table` |
| Controle de estoque | **desligado por produto** | `trackStock = true` e informe `stock` |
| Selo "mais vendido" | **desligado** | `bestSeller = true`, com base em vendas reais |
| Selo "novidade" | ligado nos 10 méis de abelhas sem ferrão | é a própria loja que os publica como lançamentos |
| Kits ("leve junto") | 2 kits ativos, **sem desconto** (preço = soma dos itens) | defina `priceCents` no kit para praticar preço fechado |

Não há contador regressivo, "X pessoas vendo" nem quantidade de vendas
inventada — nenhum gatilho é exibido sem dado real por trás.

## Pagamento (Mercado Pago)

1. Crie uma aplicação em <https://www.mercadopago.com.br/developers/panel/app>.
2. Preencha no `.env`:
   - `MERCADOPAGO_ACCESS_TOKEN` (secreto, só servidor)
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (opcional, para Checkout Bricks)
   - `MERCADOPAGO_WEBHOOK_SECRET` (painel → Webhooks → assinatura secreta)
   - `NEXT_PUBLIC_SITE_URL` com o domínio público
3. Cadastre o webhook apontando para `https://seudominio/api/webhooks/mercadopago`,
   evento **Pagamentos**.

Como funciona: `/api/checkout` grava o pedido, cria a preferência com os totais
do servidor e devolve o link do checkout. O cliente paga no ambiente do Mercado
Pago e volta para `/pedido/sucesso|pendente|erro`.

**O pedido nunca é marcado como pago pelo retorno do navegador.** O status só
muda quando: (a) o webhook chega, tem assinatura HMAC válida e o pagamento é
consultado na API com o token do servidor; ou (b) a página de retorno consulta
o mesmo pagamento na API. Assinatura inválida → 401.

Sem as credenciais o site continua funcionando: o pedido é registrado e
finalizado pelo WhatsApp, exatamente como a loja opera hoje — em nenhum momento
o site finge que houve pagamento.

## Operação da loja

Enquanto não existe um painel administrativo, use `npx prisma studio` para
editar produtos, preços, estoque e cupons, e as rotas abaixo com
`ADMIN_API_TOKEN`:

```bash
# listar pedidos
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" https://seudominio/api/admin/pedidos

# marcar pagamento e status (mesmo caminho do webhook: baixa estoque e registra histórico)
curl -X POST -H "Authorization: Bearer $ADMIN_API_TOKEN" -H "Content-Type: application/json" \
  -d '{"number":"VN-000001","paymentStatus":"approved","status":"enviado"}' \
  https://seudominio/api/admin/pedidos

# publicar alterações do banco na hora (as páginas têm cache de 60s)
curl -X POST -H "Authorization: Bearer $ADMIN_API_TOKEN" -H "Content-Type: application/json" \
  -d '{}' https://seudominio/api/admin/revalidar
```

O cliente acompanha o pedido em `/pedido/<token>` (link dado na compra) ou em
`/pedidos`, informando e-mail **e** número do pedido.

## Indo para produção

1. **Banco**: troque `provider` para `postgresql` em `prisma/schema.prisma`,
   aponte `DATABASE_URL` para o servidor e rode `npx prisma migrate deploy`.
   SQLite é ótimo para desenvolvimento, mas não para várias instâncias.
2. **Frete**: decida entre manter "a combinar" ou cadastrar a tabela. É o item
   mais importante antes de vender com pagamento online.
3. **E-mail**: não há envio de e-mail. A confirmação hoje é a página do pedido.
   Integrar Resend/SendGrid em `src/server/orders.ts` é o próximo passo natural.
4. **Domínio**: `site.url` em `src/lib/site.ts` alimenta canonical, OpenGraph e
   sitemap.
5. **Rate limit**: `src/server/rate-limit.ts` é em memória. Com mais de uma
   instância, troque por Redis mantendo a mesma assinatura.

## Conteúdo do catálogo

```bash
npm run scrape                    # produtos, preços, descrições e imagens oficiais
node scripts/scrape-pages.mjs     # textos institucionais
node scripts/make-cutouts.mjs     # recorta o fundo branco das fotos
npx prisma db seed                # leva tudo para o banco
```

`scripts/make-cutouts.mjs` faz um flood fill a partir das bordas (limiar de
luminância 196 + guarda de saturação) para remover o fundo branco e a sombra
sem comer tampas claras — é o que permite as embalagens flutuarem sobre os
fundos creme e verdes.

## Design

Tokens no bloco `@theme` de `src/app/globals.css`: creme (`cream-*`),
verde-floresta (`forest-*`), mel (`honey-*`), Fraunces (display) + Figtree
(texto).

Cada seção tem um ambiente próprio — hero creme com grão, faixa verde escura,
categorias limpas, nativas em papel artesanal, storytelling em verde profundo —
usando `<Texture>` e `<Blob>` (`src/components/ui/Texture.tsx`) em vez de
padrões repetidos. Toda animação respeita `prefers-reduced-motion`.

## Verificações

Com o servidor de produção rodando (`npm run build && npm run start`):

| Suíte | Resultado |
| --- | --- |
| `npm run build` / `lint` / `typecheck` | sem erros — 66 páginas |
| `npm run test:commerce` | 28/28 (recálculo, faixas, cupom, pedido, idempotência, webhook, estoque, histórico) |
| `npm run test:ui` | 16/16 (carrinho, busca, filtros, abas de espécies, menu mobile) |
| `npm run test:links` | 59 páginas, nenhum link ou imagem quebrada |
| `npm run test:responsivo` | sem overflow em 375, 430, 768, 1024 e 1440 px |

Os testes de comércio criam e apagam os próprios dados; o cupom de exemplo
volta a ficar inativo ao final.
