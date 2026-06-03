import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";

import { getAnalyticsConfig } from "./lib/biab.server";
import stylesUrl from "./styles.css?url";

export const links: LinksFunction = () => [
	{ rel: "stylesheet", href: stylesUrl },
];

export async function loader(_: LoaderFunctionArgs) {
	return { analytics: getAnalyticsConfig() };
}

export default function App() {
	const { analytics } = useLoaderData<typeof loader>();
	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<Meta />
				<Links />
			</head>
			<body>
				<Outlet />
				<ScrollRestoration />
				<Scripts />
				{analytics ? (
					<script
						// Server-known config inlined so the public key never lives
						// in the static client bundle. The dynamic-import below
						// reads it after hydration.
						dangerouslySetInnerHTML={{
							__html: `window.__BIAB_ANALYTICS__=${JSON.stringify(analytics)};`,
						}}
					/>
				) : null}
				<script
					type="module"
					dangerouslySetInnerHTML={{
						__html: `
							const cfg = window.__BIAB_ANALYTICS__;
							if (cfg && cfg.siteId && cfg.baseUrl && cfg.apiKey) {
								import("@biab-dev/sdk/analytics-core").then(({ initBiabAnalytics }) => {
									initBiabAnalytics({
										siteId: cfg.siteId,
										baseUrl: cfg.baseUrl,
										apiKey: cfg.apiKey,
									});
								});
							}
						`,
					}}
				/>
			</body>
		</html>
	);
}
