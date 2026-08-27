import type { RouteResult } from '../types'

/**
 * Construit un fichier GPX à partir du tracé complet (tous les points, pas
 * un échantillon) — contrairement à Google Maps, une app qui importe un GPX
 * (OsmAnd, Komoot, Organic Maps...) suit le tracé exact, virage par virage.
 */
export function buildGpx(route: RouteResult, name: string): string {
  const points = route.coordinates
    .map(([lat, lng], i) => {
      const ele = route.elevations[i]
      const eleTag = ele !== undefined ? `<ele>${ele}</ele>` : ''
      return `      <trkpt lat="${lat}" lon="${lng}">${eleTag}</trkpt>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pas restants" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`
}

function escapeXml(text: string): string {
  const entities: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  }
  return text.replace(/[<>&'"]/g, (char) => entities[char])
}

/**
 * Partage le GPX via l'API native (feuille de partage mobile, propose les
 * apps compatibles installées) si dispo, sinon le télécharge directement.
 */
export async function shareOrDownloadGpx(gpxContent: string, filename: string): Promise<void> {
  const file = new File([gpxContent], filename, { type: 'application/gpx+xml' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (err) {
      // Partage annulé par l'utilisateur : on ne bascule pas sur un téléchargement surprise.
      if (err instanceof Error && err.name === 'AbortError') return
    }
  }

  downloadGpx(gpxContent, filename)
}

function downloadGpx(gpxContent: string, filename: string): void {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
