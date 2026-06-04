import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getObject } from "@/lib/storage";
import { contentDisposition, FILE_SECURITY_HEADERS } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Attachments are office files (certificates, signed quotes, etc.) and are
  // never exposed to the contractor portal.
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "STAFF") {
    return new Response("Not found", { status: 404 });
  }

  const { id, attachmentId } = await params;
  const attachment = await prisma.jobAttachment.findFirst({
    where: { id: attachmentId, jobId: id },
  });
  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  // Bytes come either from object storage (proxied through this authed route,
  // so storage URLs are never exposed) or from the DB fallback column.
  let bytes: Uint8Array;
  if (attachment.storageKey) {
    try {
      bytes = await getObject(attachment.storageKey);
    } catch {
      return new Response("File unavailable", { status: 502 });
    }
  } else if (attachment.data) {
    bytes = attachment.data;
  } else {
    return new Response("File unavailable", { status: 404 });
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      ...FILE_SECURITY_HEADERS,
      "Content-Type": attachment.mimeType,
      "Content-Length": String(bytes.length),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": contentDisposition("attachment", attachment.filename),
    },
  });
}
