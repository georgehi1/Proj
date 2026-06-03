import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

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
  const photo = await prisma.jobPhoto.findFirst({
    where: { id: photoId, jobId: id },
  });
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.size),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${photo.filename}"`,
    },
  });
}
