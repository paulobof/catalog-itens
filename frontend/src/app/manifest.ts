import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Catalog Itens',
    short_name: 'Catalog',
    description: 'Catálogo pessoal de itens da casa organizados por cômodos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fce4ec',
    theme_color: '#ec407a',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  }
}
