import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		// Dev only: Vite serves the SPA on :5173 and forwards /api/biab/*
		// to the Bun proxy on :3000 so the browser only ever talks to
		// same-origin and the BIAB key never enters the browser bundle.
		proxy: {
			"/api/biab": {
				target: "http://localhost:3000",
				changeOrigin: true,
			},
		},
	},
});
