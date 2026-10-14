import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import type { ApplicationDocument } from "@/lib/applications";
import { getUserId, mutationHasTrustedOrigin, readApplicationFields } from "@/lib/application-api";
import { toClientApplication } from "@/lib/application-response";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!mutationHasTrustedOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const userId = await getUserId(request);
    if (!userId) return Response.json({ error: "Sign in to edit applications." }, { status: 401 });

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Application was not found." }, { status: 404 });
    }

    const parsed = await readApplicationFields(request);
    if ("error" in parsed) return parsed.error;

    const collection = (await getDatabase()).collection<ApplicationDocument>("applications");
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      { $set: { ...parsed.fields, updatedAt: new Date() } },
      { returnDocument: "after" },
    );

    if (!result) return Response.json({ error: "Application was not found." }, { status: 404 });
    return Response.json(toClientApplication(result));
  } catch {
    console.error("Unable to update an application in MongoDB.");
    return Response.json({ error: "Application could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!mutationHasTrustedOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const userId = await getUserId(request);
    if (!userId) return Response.json({ error: "Sign in to delete applications." }, { status: 401 });

    const { id } = await context.params;
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Application was not found." }, { status: 404 });
    }

    const result = await (await getDatabase())
      .collection<ApplicationDocument>("applications")
      .deleteOne({ _id: new ObjectId(id), userId });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Application was not found." }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch {
    console.error("Unable to delete an application from MongoDB.");
    return Response.json({ error: "Application could not be deleted." }, { status: 500 });
  }
}
