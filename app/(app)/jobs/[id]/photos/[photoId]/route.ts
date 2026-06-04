import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assertJobAccess } from "@/lib/contractor";
import { contentDisposition, FILE_SECURITY_HEADERS } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, photoId } = await params;

  // Office roles see any job's photos; a contractor only their assigned jobs'.
  try {
    await assertJobAccess(session.user, id);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const photo = await prisma.jobPhoto.findFirst({
    where: { id: photoId, jobId: id },
  });
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      ...FILE_SECURITY_HEADERS,
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.size),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": contentDisposition("inline", photo.filename),
    },
  });
}
