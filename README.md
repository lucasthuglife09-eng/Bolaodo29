# ⚽ Bolão do 29 · Copa 2026

## Deploy em 5 minutos

### 1. Criar banco no Supabase (gratuito)

1. Acesse **supabase.com** → New Project
2. Escolha um nome (ex: `bolao29`) e senha forte
3. No menu lateral: **SQL Editor** → cole o conteúdo de `supabase-setup.sql` → **Run**
4. Vá em **Project Settings → API**:
   - Copie **Project URL** (ex: `https://abcdef.supabase.co`)
   - Copie **anon/public key** (começa com `eyJ...`)

### 2. Configurar `config.js`

Abra `config.js` e edite as 4 linhas marcadas com `←`:

```js
const CFG = {
  pix:      'bolao29@maino.com.br',  // ← sua chave PIX
  whatsapp: '5521999999999',          // ← DDI+DDD+número
  ...
};

const SUPA = {
  url:     'https://XXXXXXXXXXX.supabase.co', // ← Project URL
  anonKey: 'eyXXXXXXXXXXXX...',               // ← anon key
};
```

### 3. Deploy no Netlify

1. Acesse **app.netlify.com/drop**
2. Arraste a pasta `bolao29/` inteira
3. Pronto — URL no ar na hora

---

## Páginas

| Página | URL | O que faz |
|---|---|---|
| Principal | `/` | Jogos ao vivo + ranking + prêmio em destaque |
| Entrar | `/entrar.html` | Apelido, foto, palpites, envio WhatsApp |
| Transparência | `/transparencia.html` | Todos os palpites de todos — visão por pessoa ou por jogo |

---

## Como funciona

1. Participante acessa `/entrar.html`, escolhe apelido + foto, preenche palpites
2. Clica **Enviar** → salva no Supabase (banco central) + abre WhatsApp com a mensagem formatada
3. Faz o PIX de R$ 10 e manda comprovante pro organizador
4. Ranking e palpites aparecem em tempo real para todos em qualquer device

**Atualização automática:**
- Resultados Sofascore: a cada **25s** durante jogos ao vivo, **4min** no intervalo
- Dados do banco: junto com cada tick de resultados

---

## Pontuação

| | |
|---|---|
| Placar exato | **25 pts** |
| Vencedor + gols de 1 lado | **10 pts** |
| Só o resultado | **7 pts** |
| Errou | **0 pts** |

**Desempate:** mais exatos → menor dif. de gols → hora de envio

---

## Arquivos

```
bolao29/
├── index.html          Página principal
├── entrar.html         Formulário de entrada
├── transparencia.html  Página pública de todos os palpites
├── config.js           ← EDITE ANTES DE SUBIR
├── jogos.js            24 jogos da 1ª rodada
├── scores.js           API Sofascore (resultados ao vivo)
├── db.js               Camada de dados (Supabase)
├── main.js             Lógica da página principal
├── entrar.js           Lógica da entrada
├── transp.js           Lógica da transparência
├── style.css           Visual completo
├── netlify.toml        Config do Netlify
└── supabase-setup.sql  ← rode isso no Supabase primeiro
```
