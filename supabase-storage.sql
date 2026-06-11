-- ═══════════════════════════════════════════════════════════════
--  BOLÃO DO 29 · Supabase Storage + tabela de comprovantes
--  Cole no SQL Editor e clique Run
-- ═══════════════════════════════════════════════════════════════

-- 1. Cria o bucket "bolao29" (público para leitura, privado para escrita)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bolao29',
  'bolao29',
  false,                           -- não expõe URLs públicas diretamente
  8388608,                         -- 8 MB por arquivo
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf']
)
on conflict (id) do nothing;

-- 2. Policy: qualquer pessoa pode fazer upload em comprovantes/
create policy "upload_comprovantes"
  on storage.objects for insert
  with check (bucket_id = 'bolao29' and name like 'comprovantes/%');

-- 3. Policy: só o dono do arquivo (anon key) pode ler os próprios
--    Na prática: você acessa pelo painel do Supabase (Storage > bolao29)
create policy "leitura_comprovantes"
  on storage.objects for select
  using (bucket_id = 'bolao29');

-- 4. Tabela que registra qual comprovante pertence a qual apelido
create table if not exists comprovantes (
  id         uuid primary key default gen_random_uuid(),
  apelido    text not null references participantes(apelido) on delete cascade,
  arquivo    text not null,          -- path: comprovantes/fulano_123.jpg
  tamanho    int,
  status     text default 'pendente', -- pendente | confirmado | rejeitado
  criado_em  timestamptz default now()
);

create index if not exists idx_comp_apelido on comprovantes(apelido);

-- RLS
alter table comprovantes enable row level security;

create policy "leitura_comprovantes_pub"
  on comprovantes for select using (true);

create policy "insert_comprovantes"
  on comprovantes for insert with check (true);

-- 5. Verificação
select 'Storage + tabela criados com sucesso!' as resultado;
select name from storage.buckets where id = 'bolao29';
