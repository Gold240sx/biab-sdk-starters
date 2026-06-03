import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/solid-router'
import { TanStackRouterDevtools } from '@tanstack/solid-router-devtools'

import '@fontsource/inter/400.css'

import { HydrationScript } from 'solid-js/web'
import { Suspense, onMount, onCleanup } from 'solid-js'
import { initBiabAnalytics } from '@biab-dev/sdk/analytics-core'

import Header from '../components/Header'

import styleCss from '../styles.css?url'

export const Route = createRootRouteWithContext()({
  head: () => ({
    links: [{ rel: 'stylesheet', href: styleCss }],
  }),
  shellComponent: RootComponent,
})

function RootComponent() {
  onMount(() => {
    const siteId = import.meta.env.VITE_BIAB_SITE_ID as string | undefined
    const baseUrl = import.meta.env.VITE_BIAB_PACKAGE_API_BASE_URL as
      | string
      | undefined
    const apiKey = import.meta.env.VITE_BIAB_PUBLIC_KEY as string | undefined
    if (!siteId || !baseUrl || !apiKey) return
    const tracker = initBiabAnalytics({ siteId, baseUrl, apiKey })
    onCleanup(() => tracker.stop())
  })

  return (
    <html>
      <head>
        <HydrationScript />
        <HeadContent />
      </head>
      <body>
        <Suspense>
          <Header />
          <Outlet />
          <TanStackRouterDevtools />
        </Suspense>
        <Scripts />
      </body>
    </html>
  )
}
