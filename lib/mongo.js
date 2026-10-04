import { MongoClient } from 'mongodb'

const URI = process.env.MONGODB_URI || process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'adytrix'

if (!URI && process.env.NODE_ENV === 'production') {
  throw new Error('MongoDB connection string is not configured')
}

// Cached connection (reused across hot-reloads and serverless invocations)
export async function getDb() {
  if (!global._adytrixDbPromise) {
    const client = new MongoClient(URI)
    global._adytrixDbPromise = client.connect().then((c) => c.db(DB_NAME))
  }
  return global._adytrixDbPromise
}
