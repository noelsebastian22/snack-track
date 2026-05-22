import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Snack-Track Vendor POS',
    short_name: 'Snack-Track',
    description: 'High-performance Vendor POS for Snack-Track',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9F9',
    theme_color: '#FF8C00',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
