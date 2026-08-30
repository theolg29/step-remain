export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: { message: 'Method not allowed' } }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const url = new URL(req.url)
  const queryText = url.searchParams.get('text') || ''
  const size = url.searchParams.get('size') || '5'

  if (!queryText.trim()) {
    return new Response(JSON.stringify({ features: [] }), {
      status: 200,
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
    const orsUrl = `https://api.openrouteservice.org/geocode/search?${new URLSearchParams({
      api_key: apiKey,
      text: queryText.trim(),
      size,
    })}`

    const orsResponse = await fetch(orsUrl, {
      headers: {
        Authorization: apiKey,
      },
    })

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
