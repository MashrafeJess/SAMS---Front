import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Point this at whichever WebAPI launch profile you run.
  //   https profile -> https://localhost:7153   (default)
  //   http  profile -> http://localhost:5080
  const target = env.VITE_API_TARGET || 'https://localhost:7153'

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
    server: {
      port: 5173,
      proxy: {
        // Everything under /api is forwarded to the SAMS WebAPI.
        //
        // This proxy is not a convenience -- it is what makes cookie auth work.
        // The browser only ever talks to http://localhost:5173, so the SAMS.Auth
        // cookie is first-party: no CORS preflight, and SameSite=Lax is satisfied.
        // Calling https://localhost:7153 directly from the page would be a
        // cross-site request (different scheme => different site), and Lax would
        // strip the cookie from every fetch.
        '/api': {
          target,
          changeOrigin: true,
          // The ASP.NET dev certificate is self-signed; Node would reject it.
          secure: false,
        },
      },
    },
  }
})
