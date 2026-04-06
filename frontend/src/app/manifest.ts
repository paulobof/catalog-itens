import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SakaBof Catálogo',
    short_name: 'SakaBof',
    description: 'Catálogo pessoal de itens da casa organizados por cômodos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fce4ec',
    theme_color: '#ec407a',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    screenshots: [],
  }
}
