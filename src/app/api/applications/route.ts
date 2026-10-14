import { getDatabase } from "@/lib/mongodb";
import type { ApplicationDocument } from "@/lib/applications";
import { getUserId, mutationHasTrustedOrigin, readApplicationFields } from "@/lib/application-api";
import { toClientApplication } from "@/lib/application-response";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const userId = await getUserId(request);
    if (!userId) return Response.json({ error: "Sign in to view applications." }, { status: 401 });

    const db = await getDatabase();
    const records = await db
      .collection<ApplicationDocument>("applications")
      .find({ userId })
      .sort({ appliedAt: -1, createdAt: -1 })
      .toArray();

    return Response.json(records.map(toClientApplication));
  } catch {
    console.error("Unable to load applications from MongoDB.");
    return Response.json({ error: "Applications could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!mutationHasTrustedOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const userId = await getUserId(request);
    if (!userId) return Response.json({ error: "Sign in to add applications." }, { status: 401 });

    const parsed = await readApplicationFields(request);
    if ("error" in parsed) return parsed.error;

    const now = new Date();
    const collection = (await getDatabase()).collection<ApplicationDocument>("applications");
    const id = new ObjectId();
    await collection.insertOne({ ...parsed.fields, _id: id, userId, createdAt: now, updatedAt: now });
    const saved = await collection.findOne({ _id: id, userId });
    if (!saved) {
      return Response.json({ error: "The application could not be loaded after saving." }, { status: 500 });
    }

    return Response.json(toClientApplication(saved), { status: 201 });
  } catch {
    console.error("Unable to save an application to MongoDB.");
    return Response.json({ error: "Application could not be saved." }, { status: 500 });
  }
}
