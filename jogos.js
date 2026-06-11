// jogos.js — 24 jogos da 1ª Rodada · Copa do Mundo 2026
const FLAGS = {
  'México':'🇲🇽','África do Sul':'🇿🇦','Coreia do Sul':'🇰🇷','Rep. Tcheca':'🇨🇿',
  'Canadá':'🇨🇦','Bósnia':'🇧🇦','Estados Unidos':'🇺🇸','Paraguai':'🇵🇾',
  'Austrália':'🇦🇺','Turquia':'🇹🇷','Catar':'🇶🇦','Suíça':'🇨🇭',
  'Brasil':'🇧🇷','Marrocos':'🇲🇦','Haiti':'🇭🇹','Escócia':'🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  'Alemanha':'🇩🇪','Curaçao':'🇨🇼','Holanda':'🇳🇱','Japão':'🇯🇵',
  'Costa do Marfim':'🇨🇮','Equador':'🇪🇨','Suécia':'🇸🇪','Tunísia':'🇹🇳',
  'Espanha':'🇪🇸','Cabo Verde':'🇨🇻','Bélgica':'🇧🇪','Egito':'🇪🇬',
  'Arábia Saudita':'🇸🇦','Uruguai':'🇺🇾','Irã':'🇮🇷','Nova Zelândia':'🇳🇿',
  'Argentina':'🇦🇷','Argélia':'🇩🇿','França':'🇫🇷','Senegal':'🇸🇳',
  'Iraque':'🇮🇶','Noruega':'🇳🇴','Áustria':'🇦🇹','Jordânia':'🇯🇴',
  'Portugal':'🇵🇹','RD Congo':'🇨🇩','Inglaterra':'🏴󠁧󠁢󠁥󠁮󠁧󠁿','Croácia':'🇭🇷',
  'Gana':'🇬🇭','Panamá':'🇵🇦','Uzbequistão':'🇺🇿','Colômbia':'🇨🇴',
};

const JOGOS = [
  { id:1,  g:'A', casa:'México',         fora:'África do Sul',  utc:'2026-06-11T19:00:00Z', local:'Cidade do México', sofaSlug:'LUbsGVb' },
  { id:2,  g:'A', casa:'Coreia do Sul',  fora:'Rep. Tcheca',    utc:'2026-06-12T02:00:00Z', local:'Guadalajara',      sofaSlug:'fUbsOVb' },
  { id:3,  g:'B', casa:'Canadá',         fora:'Bósnia',         utc:'2026-06-12T19:00:00Z', local:'Toronto',          sofaSlug:'SUbsHVb' },
  { id:4,  g:'D', casa:'Estados Unidos', fora:'Paraguai',       utc:'2026-06-13T01:00:00Z', local:'Los Angeles',      sofaSlug:'RUbsKVb' },
  { id:5,  g:'D', casa:'Austrália',      fora:'Turquia',        utc:'2026-06-14T04:00:00Z', local:'Vancouver',        sofaSlug:'aUbsQUb' },
  { id:6,  g:'B', casa:'Catar',          fora:'Suíça',          utc:'2026-06-13T19:00:00Z', local:'San Francisco',    sofaSlug:'NUbsLVb' },
  { id:7,  g:'C', casa:'Brasil',         fora:'Marrocos',       utc:'2026-06-13T22:00:00Z', local:'Nova York/NJ',     sofaSlug:'YUbsDVb' },
  { id:8,  g:'C', casa:'Haiti',          fora:'Escócia',        utc:'2026-06-14T01:00:00Z', local:'Boston',           sofaSlug:'BUbsTVb' },
  { id:9,  g:'E', casa:'Alemanha',       fora:'Curaçao',        utc:'2026-06-14T17:00:00Z', local:'Houston',          sofaSlug:'HUbsAVb' },
  { id:10, g:'F', casa:'Holanda',        fora:'Japão',          utc:'2026-06-14T20:00:00Z', local:'Dallas',           sofaSlug:'IUbsEVb' },
  { id:11, g:'E', casa:'Costa do Marfim',fora:'Equador',        utc:'2026-06-14T23:00:00Z', local:'Filadélfia',       sofaSlug:'JUbsFVb' },
  { id:12, g:'F', casa:'Suécia',         fora:'Tunísia',        utc:'2026-06-15T02:00:00Z', local:'Monterrey',        sofaSlug:'KUbsGVb' },
  { id:13, g:'H', casa:'Espanha',        fora:'Cabo Verde',     utc:'2026-06-15T16:00:00Z', local:'Atlanta',          sofaSlug:'LUbsHVb' },
  { id:14, g:'G', casa:'Bélgica',        fora:'Egito',          utc:'2026-06-15T19:00:00Z', local:'Seattle',          sofaSlug:'MUbsIVb' },
  { id:15, g:'H', casa:'Arábia Saudita', fora:'Uruguai',        utc:'2026-06-15T22:00:00Z', local:'Miami',            sofaSlug:'NUbsJVb' },
  { id:16, g:'G', casa:'Irã',            fora:'Nova Zelândia',  utc:'2026-06-16T01:00:00Z', local:'Los Angeles',      sofaSlug:'OUbsKVb' },
  { id:17, g:'J', casa:'Argentina',      fora:'Argélia',        utc:'2026-06-16T17:00:00Z', local:'Kansas City',      sofaSlug:'PUbsLVb' },
  { id:18, g:'I', casa:'França',         fora:'Senegal',        utc:'2026-06-16T19:00:00Z', local:'Nova York/NJ',     sofaSlug:'QUbsMVb' },
  { id:19, g:'I', casa:'Iraque',         fora:'Noruega',        utc:'2026-06-16T22:00:00Z', local:'Boston',           sofaSlug:'RUbsNVb' },
  { id:20, g:'J', casa:'Áustria',        fora:'Jordânia',       utc:'2026-06-17T04:00:00Z', local:'San Francisco',    sofaSlug:'SUbsOVb' },
  { id:21, g:'K', casa:'Portugal',       fora:'RD Congo',       utc:'2026-06-17T17:00:00Z', local:'Houston',          sofaSlug:'TUbsPVb' },
  { id:22, g:'L', casa:'Inglaterra',     fora:'Croácia',        utc:'2026-06-17T20:00:00Z', local:'Dallas',           sofaSlug:'UUbsQVb' },
  { id:23, g:'L', casa:'Gana',           fora:'Panamá',         utc:'2026-06-17T23:00:00Z', local:'Toronto',          sofaSlug:'VUbsRVb' },
  { id:24, g:'K', casa:'Uzbequistão',    fora:'Colômbia',       utc:'2026-06-18T02:00:00Z', local:'Cidade do México', sofaSlug:'WUbsSVb' },
];

function flag(n) { return FLAGS[n] || '🏳️'; }

function horaBSB(utc) {
  return new Date(utc).toLocaleTimeString('pt-BR',
    { hour:'2-digit', minute:'2-digit', timeZone:'America/Sao_Paulo' });
}
function diaBSB(utc) {
  const d   = new Date(utc);
  const loc = new Date(d.toLocaleString('en-US',{ timeZone:'America/Sao_Paulo' }));
  const sem = ['dom','seg','ter','qua','qui','sex','sáb'][loc.getDay()];
  const ds  = d.toLocaleDateString('pt-BR',{ day:'2-digit', month:'2-digit', timeZone:'America/Sao_Paulo' });
  return `${ds} (${sem})`;
}
function jogosPorDia() {
  const m = new Map();
  for (const j of JOGOS) {
    const d = diaBSB(j.utc);
    if (!m.has(d)) m.set(d,[]);
    m.get(d).push(j);
  }
  return m;
}
function datasUnicas() {
  return [...new Set(JOGOS.map(j => j.utc.slice(0,10)))];
}
