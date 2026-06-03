import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function money(n: number) {
  return new Prisma.Decimal(n.toFixed(2));
}

async function main() {
  console.log("Seeding Homefix CRM…");

  // --- Company settings (single row, id = 1) ---
  await prisma.companySettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      companyName: "Homefix Limited",
      town: "Leatherhead",
      postcode: "KT22",
      phone: "01372 372470",
      email: "hello@homefixlimited.co.uk",
      defaultVatRate: money(20),
      invoicePrefix: "INV",
      quotePrefix: "QUO",
    },
  });

  // --- Admin user (always created; credentials configurable via env) ---
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@homefixlimited.co.uk").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "password123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Office Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Admin ready: ${adminEmail}`);

  // Demo data is opt-in (local only) — never seed it into production.
  if (process.env.SEED_DEMO !== "true") {
    console.log("SEED_DEMO not set — skipping demo clients/jobs/invoices.");
    return;
  }
  if ((await prisma.client.count()) > 0) {
    console.log("Clients already present — skipping demo data.");
    return;
  }

  // --- Contractors ---
  const dave = await prisma.contractor.create({
    data: {
      name: "Dave Brennan",
      trade: "Plumber",
      phone: "07700 900200",
      email: "dave@example.com",
      dayRate: money(220),
    },
  });
  const priya = await prisma.contractor.create({
    data: {
      name: "Priya Shah",
      trade: "Tiler",
      companyName: "Shah Tiling",
      phone: "07700 900201",
      dayRate: money(200),
    },
  });

  // --- Clients ---
  const smith = await prisma.client.create({
    data: {
      name: "Sarah Smith",
      type: "RESIDENTIAL",
      email: "sarah.smith@example.com",
      phone: "07700 900123",
      addressLine1: "14 Oak Avenue",
      town: "Leatherhead",
      postcode: "KT22 7AB",
      notes: "Repeat customer. Prefers morning appointments.",
    },
  });

  const acme = await prisma.client.create({
    data: {
      name: "Acme Estates Ltd",
      type: "COMMERCIAL",
      email: "facilities@acme-estates.example.com",
      phone: "01372 900456",
      addressLine1: "Unit 5, Mole Business Park",
      town: "Leatherhead",
      postcode: "KT22 7BA",
      notes: "Manages 12 rental properties across Surrey.",
    },
  });

  // --- Jobs ---
  const bathroomJob = await prisma.job.create({
    data: {
      clientId: smith.id,
      title: "Bathroom refurbishment",
      description: "Full bathroom strip-out and refit, new suite and tiling.",
      status: "IN_PROGRESS",
      siteAddress: "14 Oak Avenue, Leatherhead, KT22 7AB",
      scheduledDate: new Date(Date.now() + 2 * 86400000),
      contractors: { connect: [{ id: dave.id }, { id: priya.id }] },
    },
  });

  const guttersJob = await prisma.job.create({
    data: {
      clientId: acme.id,
      title: "Gutter clearance — 4 properties",
      description: "Planned preventative maintenance, autumn round.",
      status: "SCHEDULED",
      siteAddress: "Various, Leatherhead",
      scheduledDate: new Date(Date.now() + 7 * 86400000),
      contractors: { connect: [{ id: dave.id }] },
    },
  });

  await prisma.job.create({
    data: {
      clientId: smith.id,
      title: "Leaking kitchen tap",
      description: "Reported dripping mixer tap.",
      status: "ENQUIRY",
    },
  });

  // --- Communications ---
  await prisma.communication.createMany({
    data: [
      {
        clientId: smith.id,
        jobId: bathroomJob.id,
        type: "CALL",
        body: "Called to confirm tile choice — going with matte grey.",
        createdById: admin.id,
      },
      {
        clientId: smith.id,
        type: "NOTE",
        body: "Customer happy with progress so far.",
        createdById: admin.id,
      },
      {
        clientId: acme.id,
        jobId: guttersJob.id,
        type: "EMAIL",
        body: "Sent schedule of works and access requirements.",
        createdById: admin.id,
      },
    ],
  });

  // --- Invoices / quotes ---
  // Quote for the bathroom job
  const quoteSubtotal = 4200;
  const quoteVat = quoteSubtotal * 0.2;
  await prisma.invoice.create({
    data: {
      type: "QUOTE",
      number: 1,
      clientId: smith.id,
      jobId: bathroomJob.id,
      status: "ACCEPTED",
      issueDate: new Date(Date.now() - 20 * 86400000),
      vatRate: money(20),
      subtotal: money(quoteSubtotal),
      vatAmount: money(quoteVat),
      total: money(quoteSubtotal + quoteVat),
      notes: "Quote valid for 30 days.",
      lineItems: {
        create: [
          { description: "Strip out & dispose of old suite", quantity: money(1), unitPrice: money(600), lineTotal: money(600), position: 0 },
          { description: "Supply & fit new bathroom suite", quantity: money(1), unitPrice: money(2200), lineTotal: money(2200), position: 1 },
          { description: "Tiling (walls & floor)", quantity: money(1), unitPrice: money(1400), lineTotal: money(1400), position: 2 },
        ],
      },
    },
  });

  // Invoice for the gutters job
  const invSubtotal = 480;
  const invVat = invSubtotal * 0.2;
  await prisma.invoice.create({
    data: {
      type: "INVOICE",
      number: 1,
      clientId: acme.id,
      jobId: guttersJob.id,
      status: "SENT",
      issueDate: new Date(Date.now() - 5 * 86400000),
      dueDate: new Date(Date.now() + 25 * 86400000),
      vatRate: money(20),
      subtotal: money(invSubtotal),
      vatAmount: money(invVat),
      total: money(invSubtotal + invVat),
      lineItems: {
        create: [
          { description: "Gutter clearance — 4 properties", quantity: money(4), unitPrice: money(120), lineTotal: money(480), position: 0 },
        ],
      },
    },
  });

  console.log(`Done. Demo data seeded. Log in with ${adminEmail}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
