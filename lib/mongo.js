import { MongoClient } from 'mongodb'

// Cached connection (reused across hot-reloads and serverless invocations)
export async function getDb() {
  if (!global._adytrixDbPromise) {
    const client = new MongoClient(process.env.MONGO_URL)
    global._adytrixDbPromise = client.connect().then((c) => c.db(process.env.DB_NAME))
  }
  return global._adytrixDbPromise
}
