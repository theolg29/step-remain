export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const customKey = req.headers.get('x-ors-api-key') || req.headers.get('authorization')
  const apiKey = (
    customKey ||
    process.env.ORS_API_KEY ||
    process.env.VITE_ORS_API_KEY ||
    ''
  ).trim()

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: {
          message:
            'Clé API ORS_API_KEY manquante sur le serveur Vercel. Ajoute ORS_API_KEY dans les variables d’environnement Vercel.',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    const body = await req.json()
    const orsResponse = await fetch(
      'https://api.openrouteservice.org/v2/directions/foot-walking/geojson',
      {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )

    const data = await orsResponse.text()
    return new Response(data, {
      status: orsResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Impossible de contacter openrouteservice.'
    return new Response(JSON.stringify({ error: { message: msg } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
