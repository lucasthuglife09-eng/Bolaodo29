// netlify/functions/scores.js
// Proxy server-side para a API do Sofascore
// GET /.netlify/functions/scores?date=2026-06-11
// Retorna todos os jogos da Copa do Mundo daquele dia

const HEADERS_OUT = {
  'Content-Type':                'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control':               'public, max-age=20',
};

const SOFA_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept':     'application/json, text/plain, */*',
  'Referer':    'https://www.sofascore.com/',
  'Origin':     'https://www.sofascore.com',
};

const WC_ID = 16; // uniqueTournament.id da Copa do Mundo FIFA

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: HEADERS_OUT, body: '' };
  }

  const { date } = event.queryStringParameters || {};

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      statusCode: 400,
      headers: HEADERS_OUT,
      body: JSON.stringify({ error: 'Use ?date=YYYY-MM-DD' }),
    };
  }

  try {
    const url = `https://api.sofascore.com/api/v1/sport/football/scheduled-events/${date}`;
    const res = await fetch(url, { headers: SOFA_HEADERS });

    if (!res.ok) {
      return {
        statusCode: res.status,
        headers: HEADERS_OUT,
        body: JSON.stringify({ error: `Sofascore respondeu ${res.status}` }),
      };
    }

    const json = await res.json();

    // Filtra só Copa do Mundo
    const copa = (json.events || []).filter(
      e => e.tournament?.uniqueTournament?.id === WC_ID
    );

    return {
      statusCode: 200,
      headers: HEADERS_OUT,
      body: JSON.stringify({ events: copa }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: HEADERS_OUT,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
