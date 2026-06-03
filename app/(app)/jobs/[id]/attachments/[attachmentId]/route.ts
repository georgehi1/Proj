import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, attachmentId } = await params;
  const attachment = await prisma.jobAttachment.findFirst({
    where: { id: attachmentId, jobId: id },
  });
  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(attachment.data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `attachment; filename="${attachment.filename}"`,
    },
  });
}
