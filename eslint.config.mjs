import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import legacyWarnings from './eslint.legacy.mjs'

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  ...legacyWarnings,
  globalIgnores(['.next/**', 'node_modules/**', '.pnpm-store/**', '.lumo-private/**', 'next-env.d.ts']),
])
