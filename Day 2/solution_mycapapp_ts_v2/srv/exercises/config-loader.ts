// ── Two config shapes (the concrete types that fill in T) ─────────────
export interface DatabaseConfig {
  host: string
  port: number
  ssl: boolean
}

export interface ServerConfig {
  name: string
  workers: number
}

// ── The generic validator contract ───────────────────────────────────
export type Validator<T> = (raw: unknown) => raw is T          // rows 2, 3

// ── The reusable, typed loader ────────────────────────────────────────
export class ConfigLoader<T> {                                  // row 1

  constructor(private readonly validate: Validator<T>) {}       // row 5

  load(raw: unknown): T {                                       // rows 4, 6
    if (!this.validate(raw)) {
      throw new Error('Invalid config: failed validation')
    }
    return raw                                                  // narrowed unknown → T
  }
}

// ── One type-guard validator per shape ────────────────────────────────
export const isDatabaseConfig: Validator<DatabaseConfig> = (raw): raw is DatabaseConfig => {
  const c = raw as Partial<DatabaseConfig>
  return typeof c?.host === 'string'
    && typeof c?.port === 'number'
    && typeof c?.ssl === 'boolean'
}

export const isServerConfig: Validator<ServerConfig> = (raw): raw is ServerConfig => {
  const c = raw as Partial<ServerConfig>
  return typeof c?.name === 'string'
    && typeof c?.workers === 'number'
}

// ── Test two different shapes through the SAME loader ─────────────────
const dbLoader = new ConfigLoader(isDatabaseConfig)             // row 7: T inferred = DatabaseConfig
const db = dbLoader.load(JSON.parse('{ "host": "localhost", "port": 5432, "ssl": true }'))
console.log(`DB on ${db.host}:${db.port} (ssl=${db.ssl})`)

const serverLoader = new ConfigLoader<ServerConfig>(isServerConfig)  // row 8: T pinned explicitly
const server = serverLoader.load(JSON.parse('{ "name": "api", "workers": 4 }'))
console.log(`Server ${server.name} with ${server.workers} workers`)