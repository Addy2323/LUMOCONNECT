import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required; tests use an isolated temporary schema.')
const schema = `lumo_hot_deals_test_${randomUUID().replaceAll('-', '')}`
const url = new URL(process.env.DATABASE_URL)
url.searchParams.set('schema', schema)
const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: url.toString(), HOT_DEALS_TEST_SCHEMA: schema, HOT_DEALS_IDENTITY_SECRET: randomUUID() }
const db = new PrismaClient({ datasources: { db: { url: url.toString() } } })
try {
  const migration = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env, stdio: 'inherit' })
  if (migration.status !== 0) throw new Error('Isolated test migrations failed')
  const tests = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'tests/integration/hot-deals.test.ts'], { env, stdio: 'inherit' })
  process.exitCode = tests.status ?? 1
} finally {
  if (!/^lumo_hot_deals_test_[a-f0-9]{32}$/.test(schema)) throw new Error('Unsafe test schema')
  await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
  await db.$disconnect()
}
