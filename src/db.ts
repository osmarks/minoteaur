import { migrate, MigrateDBConfig } from "postgres-migrations"
import { parse } from "pg-connection-string"
import { config } from "dotenv"
import { Pool } from 'pg'

config()

const connectionString = process.env.DB
if (connectionString === undefined) {
    console.error("Please provide a DB connection string.")
    process.exit(1)
}

// HERE BE BODGES
// Due to what seems to be an error in the type declarations here (https://github.com/iceddev/pg-connection-string/blob/master/index.d.ts#L7), we need to do some casting and modification of the connection string
const connData = parse(connectionString as string)
connData.port = parseInt(connData.port as any) || 5432
migrate(connData as MigrateDBConfig, "./migrations", undefined as any)

const pool = new Pool({ connectionString })

export const many = query => pool.query(query).then(result => result.rows)
export const one = query => many(query).then(rows => rows[0] === undefined ? null : rows[0])
export const query = query => pool.query(query)