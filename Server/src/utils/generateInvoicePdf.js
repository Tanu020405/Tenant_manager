import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Asset paths
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const FONT_REGULAR = "Helvetica";
const FONT_BOLD = "Helvetica-Bold";

// Colors — match sample (gold accent, dark navy text)
const ACCENT = "#2563eb";       // brand blue for header/total row
const GOLD   = "#C8922A";       // gold for "RENTAL INVOICE" title + labels
const DARK   = "#1e293b";       // near-black for body text
const MUTED  = "#64748b";       // slate for secondary text
const LINE   = "#e2e8f0";       // light divider

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Draw a simple horizontal rule */
function rule(doc, x, y, w, color = LINE, weight = 0.5) {
    doc.save()
        .moveTo(x, y).lineTo(x + w, y)
        .strokeColor(color).lineWidth(weight).stroke()
        .restore();
}

/** Render two-column label/value pair flush right */
function metaRow(doc, label, value, x, y, w) {
    doc.font(FONT_BOLD).fontSize(9).fillColor(GOLD)
        .text(label, x, y, { width: w * 0.45, align: "right" });
    doc.font(FONT_REGULAR).fontSize(9).fillColor(DARK)
        .text(value, x + w * 0.48, y, { width: w * 0.52, align: "right" });
}

// ─── main builder ─────────────────────────────────────────────────────────────

export function buildInvoicePdf(doc, invoice) {
    const {
        _id,
        period,
        amount,
        dueDate,
        status,
        paidAt,
        propertySnapshot,
        renter,
        notes,
        createdAt,
    } = invoice;

    const safeAmount   = Number(amount || 0);
    const invoiceNum   = _id.toString().slice(-8).toUpperCase().padStart(8, "0");
    const invoiceDate  = createdAt
        ? new Date(createdAt).toLocaleDateString("en-IN")
        : new Date().toLocaleDateString("en-IN");
    const dueDateStr   = dueDate
        ? new Date(dueDate).toLocaleDateString("en-IN")
        : "—";
    const paidOnStr    = paidAt
        ? new Date(paidAt).toLocaleDateString("en-IN")
        : null;

    const W  = doc.page.width;       // 595
    const H  = doc.page.height;      // 842
    const M  = 50;                   // margin
    const CW = W - M * 2;            // content width = 495

    // ── Fonts ──────────────────────────────────────────────────────
    // Using standard PDFKit fonts (no registration needed)

    // ── TOP: Logo (right) + Company name (left) ─────────────────────────────
    let y = M;

    // Company name / address block (left)
    doc.font(FONT_BOLD).fontSize(13).fillColor(DARK)
        .text("PROPCONNECT", M, y);
    doc.font(FONT_REGULAR).fontSize(8).fillColor(MUTED)
        .text("Tenant & Property Management", M, y + 16);
    if (propertySnapshot?.address) {
        doc.text(propertySnapshot.address, M, y + 27, { width: CW * 0.45 });
    }

    // Logo (right-aligned)
    try {
        doc.image(LOGO_PATH, W - M - 160, y - 8, { width: 160, height: 50, fit: [160, 50] });
    } catch { /* logo not found — skip silently */ }

    y += 70;
    rule(doc, M, y, CW);
    y += 14;

    // ── TITLE: "RENTAL INVOICE" ──────────────────────────────────────────────
    // Right-aligned large title (matching sample)
    doc.font(FONT_BOLD).fontSize(28).fillColor(GOLD)
        .text("RENTAL", 0, y, { width: W - M, align: "right" });
    y += 32;
    doc.font(FONT_BOLD).fontSize(28).fillColor(GOLD)
        .text("INVOICE", 0, y, { width: W - M, align: "right" });
    y += 44;

    // ── BILL TO (left) + Meta rows (right) ──────────────────────────────────
    const metaX = M + CW * 0.5;
    const metaW = CW * 0.5;
    const billY = y;

    // Bill To block (left side)
    doc.font(FONT_BOLD).fontSize(9).fillColor(GOLD).text("Bill To", M, billY);
    doc.font(FONT_BOLD).fontSize(13).fillColor(DARK)
        .text(renter?.name || "—", M, billY + 14);
    doc.font(FONT_REGULAR).fontSize(9).fillColor(MUTED)
        .text(renter?.email || "", M, billY + 30);
    if (renter?.phone) {
        doc.text(renter.phone, M, billY + 42);
    }

    // Meta rows (right side) — Invoice #, Invoice date, Due date
    metaRow(doc, "Invoice #",     invoiceNum,   metaX, billY,      metaW);
    metaRow(doc, "Invoice date",  invoiceDate,  metaX, billY + 16, metaW);
    metaRow(doc, "Due date",      dueDateStr,   metaX, billY + 32, metaW);
    if (paidOnStr) {
        metaRow(doc, "Paid on", paidOnStr, metaX, billY + 48, metaW);
    }

    y = billY + 72;
    rule(doc, M, y, CW, LINE, 0.5);
    y += 18;

    // ── ITEMS TABLE ──────────────────────────────────────────────────────────
    const COL = {
        qty:   M,
        desc:  M + 40,
        price: M + CW * 0.62,
        amt:   M + CW * 0.80,
    };
    const ROW_H = 24;

    // Table header
    doc.rect(M, y, CW, ROW_H).fill(GOLD);
    doc.font(FONT_BOLD).fontSize(9).fillColor("white")
        .text("QTY",         COL.qty,   y + 7, { width: 35 })
        .text("Description", COL.desc,  y + 7, { width: CW * 0.55 })
        .text("Unit Price",  COL.price, y + 7, { width: CW * 0.16, align: "right" })
        .text("Amount",      COL.amt,   y + 7, { width: CW * 0.20, align: "right" });
    y += ROW_H;

    // Single line item — Apartment Rental (1 month)
    const unitPrice = safeAmount;
    const lineItems = [
        { qty: 1, desc: `Apartment Rental (${period || "1 month"})`, price: unitPrice, amount: unitPrice },
    ];

    lineItems.forEach((item, i) => {
        const rowY = y + i * ROW_H;
        if (i % 2 === 1) doc.rect(M, rowY, CW, ROW_H).fill("#fafaf7");
        doc.font(FONT_REGULAR).fontSize(9).fillColor(DARK)
            .text(String(item.qty),                          COL.qty,   rowY + 7, { width: 35 })
            .text(item.desc,                                 COL.desc,  rowY + 7, { width: CW * 0.55 })
            .text(item.price.toLocaleString("en-IN"),        COL.price, rowY + 7, { width: CW * 0.16, align: "right" })
            .text(item.amount.toLocaleString("en-IN"),       COL.amt,   rowY + 7, { width: CW * 0.20, align: "right" });
    });

    y += lineItems.length * ROW_H + 4;
    rule(doc, M, y, CW, GOLD, 0.5);
    y += 10;

    // ── TOTALS ───────────────────────────────────────────────────────────────
    const totX = M + CW * 0.55;
    const totW = CW * 0.45;

    // Subtotal
    doc.font(FONT_REGULAR).fontSize(9).fillColor(DARK)
        .text("Subtotal", totX, y, { width: totW * 0.55 })
        .text(safeAmount.toLocaleString("en-IN"), totX + totW * 0.55, y, { width: totW * 0.45, align: "right" });
    y += 18;

    rule(doc, totX, y, totW, GOLD, 0.5);
    y += 8;

    // Total row — colored
    const totalLabel = `Total (INR)`;
    doc.font(FONT_BOLD).fontSize(10).fillColor(GOLD)
        .text(totalLabel, totX, y, { width: totW * 0.55 });
    doc.font(FONT_BOLD).fontSize(10).fillColor(GOLD)
        .text(`INR ${safeAmount.toLocaleString("en-IN")}`, totX + totW * 0.55, y, {
            width: totW * 0.45,
            align: "right",
        });
    y += 18;

    rule(doc, totX, y, totW, GOLD, 0.5);
    y += 30;

    // ── STATUS BADGE ─────────────────────────────────────────────────────────
    const statusColor =
        status === "paid"    ? "#16a34a" :
        status === "overdue" ? "#dc2626" : "#d97706";
    doc.font(FONT_BOLD).fontSize(9).fillColor(statusColor)
        .text(`Status: ${status?.toUpperCase() || "PENDING"}`, M, y);
    y += 20;

    // ── NOTES ────────────────────────────────────────────────────────────────
    if (notes) {
        y += 8;
        doc.font(FONT_BOLD).fontSize(9).fillColor(GOLD).text("Notes", M, y);
        y += 13;
        doc.font(FONT_REGULAR).fontSize(9).fillColor(DARK)
            .text(notes, M, y, { width: CW });
        y = doc.y + 8;
    }

    // ── TERMS & CONDITIONS ───────────────────────────────────────────────────
    y += 20;
    doc.font(FONT_BOLD).fontSize(9).fillColor(GOLD).text("Terms and Conditions", M, y);
    y += 13;
    doc.font(FONT_REGULAR).fontSize(8).fillColor(MUTED)
        .text("Payment is due by the due date shown above.", M, y)
        .text("This is a system-generated invoice — no signature required.", M, y + 12);

    // ── FOOTER LINE ──────────────────────────────────────────────────────────
    rule(doc, M, H - 36, CW, LINE, 0.5);
    doc.font(FONT_REGULAR).fontSize(7).fillColor(MUTED)
        .text("PROPCONNECT · Tenant & Property Management · System Generated",
              M, H - 26, { width: CW, align: "center" });
}

// ─── stream factory ───────────────────────────────────────────────────────────

export function createInvoicePdfStream(invoice) {
    const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        compress: true,
        autoFirstPage: true,
    });

    process.nextTick(() => {
        buildInvoicePdf(doc, invoice);
        doc.end();
    });

    return doc;
}

/**
 * Returns a Promise<Buffer> of the invoice PDF.
 * Use this when you need the PDF as bytes (e.g. email attachment).
 */
export function generateInvoicePdfBuffer(invoice) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 0, compress: true, autoFirstPage: true });
        const chunks = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end",  ()      => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        buildInvoicePdf(doc, invoice);
        doc.end();
    });
}