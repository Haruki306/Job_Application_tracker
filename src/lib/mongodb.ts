import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
export const databaseName = process.env.MONGODB_DB_NAME ?? "daymark";

if (!uri) {
  throw new Error("Set MONGODB_URI in .env.local before starting the application.");
}

declare global {
  var daymarkMongoClient: MongoClient | undefined;
  var daymarkMongoClientPromise: Promise<MongoClient> | undefined;
}

const client =
  global.daymarkMongoClient ??
  new MongoClient(uri, { appName: "daymark-job-tracker" });
const clientPromise = global.daymarkMongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global.daymarkMongoClient = client;
  global.daymarkMongoClientPromise = clientPromise;
}

export async function getDatabase(): Promise<Db> {
  await clientPromise;
  return client.db(databaseName);
}

export { client, clientPromise };
