import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatCurrency, formatDate, humanize } from "@/lib/format";

export type InvoicePdfData = {
  type: string;
  number: number;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes: string | null;
  client: {
    name: string;
    addressLine1: string | null;
    addressLine2: string | null;
    town: string | null;
    postcode: string | null;
    email: string | null;
  };
  lineItems: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  company: {
    companyName: string;
    addressLine1: string | null;
    addressLine2: string | null;
    town: string | null;
    postcode: string | null;
    phone: string | null;
    email: string | null;
    vatNumber: string | null;
  };
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0f172a" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1d54d6" },
  docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", textAlign: "right" },
  muted: { color: "#64748b" },
  section: { marginTop: 24 },
  label: { color: "#94a3b8", fontSize: 8, textTransform: "uppercase", marginBottom: 3 },
  block: { width: "48%" },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 6,
    marginTop: 20,
    color: "#64748b",
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cDesc: { width: "52%" },
  cQty: { width: "12%", textAlign: "right" },
  cUnit: { width: "18%", textAlign: "right" },
  cTotal: { width: "18%", textAlign: "right" },
  totals: { marginTop: 14, alignSelf: "flex-end", width: "40%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  notes: { marginTop: 28, color: "#475569" },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 8,
  },
});

function addressLines(parts: (string | null)[]) {
  return parts.filter(Boolean).join("\n");
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const isQuote = data.type === "QUOTE";
  const c = data.company;

  return (
    <Document title={`${humanize(data.type)} ${data.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.row}>
          <View>
            <Text style={styles.brand}>{c.companyName}</Text>
            <Text style={[styles.muted, { marginTop: 4 }]}>
              {addressLines([c.addressLine1, c.addressLine2, c.town, c.postcode])}
            </Text>
            {c.phone ? <Text style={styles.muted}>{c.phone}</Text> : null}
            {c.email ? <Text style={styles.muted}>{c.email}</Text> : null}
            {c.vatNumber ? <Text style={styles.muted}>VAT: {c.vatNumber}</Text> : null}
          </View>
          <View>
            <Text style={styles.docTitle}>{isQuote ? "QUOTE" : "INVOICE"}</Text>
            <Text style={[styles.muted, { textAlign: "right", marginTop: 4 }]}>
              {isQuote ? "Quote" : "Invoice"} #{data.number}
            </Text>
          </View>
        </View>

        <View style={[styles.row, styles.section]}>
          <View style={styles.block}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.client.name}</Text>
            <Text style={styles.muted}>
              {addressLines([
                data.client.addressLine1,
                data.client.addressLine2,
                data.client.town,
                data.client.postcode,
              ])}
            </Text>
            {data.client.email ? <Text style={styles.muted}>{data.client.email}</Text> : null}
          </View>
          <View style={styles.block}>
            <View style={styles.row}>
              <Text style={styles.label}>Issue date</Text>
              <Text>{formatDate(data.issueDate)}</Text>
            </View>
            {data.dueDate ? (
              <View style={[styles.row, { marginTop: 4 }]}>
                <Text style={styles.label}>Due date</Text>
                <Text>{formatDate(data.dueDate)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHead}>
          <Text style={styles.cDesc}>Description</Text>
          <Text style={styles.cQty}>Qty</Text>
          <Text style={styles.cUnit}>Unit price</Text>
          <Text style={styles.cTotal}>Total</Text>
        </View>
        {data.lineItems.map((l, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.cDesc}>{l.description}</Text>
            <Text style={styles.cQty}>{l.quantity}</Text>
            <Text style={styles.cUnit}>{formatCurrency(l.unitPrice)}</Text>
            <Text style={styles.cTotal}>{formatCurrency(l.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>VAT ({data.vatRate}%)</Text>
            <Text>{formatCurrency(data.vatAmount)}</Text>
          </View>
          <View style={styles.grand}>
            <Text>Total</Text>
            <Text>{formatCurrency(data.total)}</Text>
          </View>
        </View>

        {data.notes ? (
          <View style={styles.notes}>
            <Text style={styles.label}>Notes</Text>
            <Text>{data.notes}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>
          {c.companyName} · Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
}
