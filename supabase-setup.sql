-- ═══════════════════════════════════════════════════
--  BOLÃO DO 29 · Setup do banco (Supabase / PostgreSQL)
--  Cole este script no SQL Editor do seu projeto Supabase
-- ═══════════════════════════════════════════════════

-- Participantes
create table if not exists participantes (
  id         uuid primary key default gen_random_uuid(),
  apelido    text unique not null,
  foto       text,           -- dataURL da foto (base64) ou null
  criado_em  timestamptz default now()
);

-- Palpites
create table if not exists palpites (
  id         uuid primary key default gen_random_uuid(),
  apelido    text not null references participantes(apelido) on update cascade on delete cascade,
  jogo_id    int not null,
  gols_casa  int not null check (gols_casa >= 0),
  gols_fora  int not null check (gols_fora >= 0),
  criado_em  timestamptz default now(),
  unique (apelido, jogo_id)
);

-- Índices para queries rápidas
create index if not exists idx_palpites_apelido on palpites(apelido);
create index if not exists idx_palpites_jogo    on palpites(jogo_id);

-- ── Row Level Security ──────────────────────────────────────────────
-- Todos podem LER (transparência total)
-- Todos podem INSERIR/ATUALIZAR (quem quiser entra)
-- Ninguém pode DELETAR via API pública

alter table participantes enable row level security;
alter table palpites enable row level security;

-- Participantes: leitura pública
create policy "leitura_publica_participantes"
  on participantes for select using (true);

-- Participantes: inserção/atualização pública (qualquer um pode entrar)
create policy "insercao_publica_participantes"
  on participantes for insert with check (true);

create policy "upsert_participantes"
  on participantes for update using (true);

-- Palpites: leitura pública
create policy "leitura_publica_palpites"
  on palpites for select using (true);

-- Palpites: inserção/atualização pública
create policy "insercao_publica_palpites"
  on palpites for insert with check (true);

create policy "upsert_palpites"
  on palpites for update using (true);

-- ── Verificar setup ─────────────────────────────────────────────────
select 'Setup concluído! Tabelas criadas:' as status;
select table_name from information_schema.tables
  where table_schema = 'public'
  and table_name in ('participantes','palpites');
