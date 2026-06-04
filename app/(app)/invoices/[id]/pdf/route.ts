import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/pdf/render";
import { contentDisposition, FILE_SECURITY_HEADERS } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Invoices/quotes are office-only financial documents.
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "STAFF") {
    return new Response("Not found", { status: 404 });
  }

  const { id } = await params;
  const pdf = await renderInvoicePdf(id);
  if (!pdf) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(pdf.buffer), {
    headers: {
      ...FILE_SECURITY_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition("inline", pdf.filename),
    },
  });
}
