/* Build a social media services quotation: Jewell Projects -> Balga Designs */
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, HeadingLevel, ShadingType,
  VerticalAlign, PositionalTab, PositionalTabAlignment, PositionalTabLeader,
} = require("docx");

/* palette */
const GREEN = "5A674E";
const KHAKI = "B7B597";
const DARK = "1B1B1B";
const LIGHT = "F4F4EF";
const MUTE = "6B6B63";
const WHITE = "FFFFFF";

const FONT = "Calibri";
const PAGE_W = 12240, PAGE_H = 15840; // US Letter DXA
const MARGIN = 1080; // 0.75"
const CONTENT_W = PAGE_W - MARGIN * 2; // 10080

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

function t(text, o = {}) {
  return new TextRun({ text, font: FONT, size: o.size || 20, color: o.color || DARK, bold: o.bold || false, italics: o.italics || false, allCaps: o.caps || false, characterSpacing: o.spacing });
}
function p(runs, o = {}) {
  return new Paragraph({ children: Array.isArray(runs) ? runs : [runs], alignment: o.align, spacing: { before: o.before || 0, after: o.after == null ? 120 : o.after, line: o.line || 264, lineRule: "auto" }, ...(o.border ? { border: o.border } : {}) });
}
function cell(children, o = {}) {
  return new TableCell({
    children,
    width: { size: o.w, type: WidthType.DXA },
    verticalAlign: o.valign || VerticalAlign.CENTER,
    shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
    margins: { top: o.mt == null ? 100 : o.mt, bottom: o.mb == null ? 100 : o.mb, left: o.ml == null ? 130 : o.ml, right: o.mr == null ? 130 : o.mr },
    borders: o.borders || NO_BORDERS,
  });
}

/* ---------- header band ---------- */
const headerTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [5040, 5040],
  borders: NO_BORDERS,
  rows: [
    new TableRow({
      children: [
        cell([
          p(t("JEWELL PROJECTS", { size: 34, bold: true, color: DARK, spacing: 30 }), { after: 20 }),
          p(t("Digital · Web · Social Media", { size: 17, color: MUTE, spacing: 20, caps: true }), { after: 0 }),
        ], { w: 5040, ml: 0, valign: VerticalAlign.CENTER }),
        cell([
          p(t("QUOTATION", { size: 30, bold: true, color: GREEN, spacing: 40 }), { align: AlignmentType.RIGHT, after: 0 }),
        ], { w: 5040, mr: 0, valign: VerticalAlign.CENTER }),
      ],
    }),
  ],
});

/* accent rule */
const rule = new Paragraph({ spacing: { before: 120, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GREEN } }, children: [t("", { size: 2 })] });

/* ---------- meta + parties ---------- */
function kv(k, v, o = {}) {
  return new Paragraph({
    spacing: { after: 60, line: 240, lineRule: "auto" },
    children: [
      new TextRun({ text: k + "  ", font: FONT, size: 18, bold: true, color: MUTE, allCaps: true, characterSpacing: 20 }),
      new TextRun({ text: v, font: FONT, size: 20, color: o.color || DARK, bold: o.bold || false }),
    ],
  });
}

const partiesTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [3360, 3360, 3360],
  borders: NO_BORDERS,
  rows: [
    new TableRow({
      children: [
        cell([
          p(t("FROM", { size: 17, bold: true, color: GREEN, spacing: 30 }), { after: 60 }),
          p(t("Jewell Projects", { size: 21, bold: true }), { after: 30 }),
          p(t("Lizelle Jewell", { size: 19 }), { after: 20 }),
          p(t("lizelle@jewellprojects.com", { size: 18, color: MUTE }), { after: 20 }),
          p(t("jewellprojects.com", { size: 18, color: MUTE }), { after: 0 }),
        ], { w: 3360, ml: 0, fill: LIGHT, valign: VerticalAlign.TOP, mt: 140, mb: 140, ml: 140 }),
        cell([p(t(""))], { w: 240, borders: NO_BORDERS }),
        cell([
          p(t("PREPARED FOR", { size: 17, bold: true, color: GREEN, spacing: 30 }), { after: 60 }),
          p(t("Balga Designs", { size: 21, bold: true }), { after: 30 }),
          p(t("Sustainable Landscapes", { size: 19, italics: true, color: MUTE }), { after: 20 }),
          p(t("Lennox Head, NSW 2478", { size: 18, color: MUTE }), { after: 20 }),
          p(t("info@balgadesigns.com.au", { size: 18, color: MUTE }), { after: 0 }),
        ], { w: 3360, fill: LIGHT, valign: VerticalAlign.TOP, mt: 140, mb: 140, ml: 140 }),
      ],
    }),
  ],
});

/* quote meta row */
const metaTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [2520, 2520, 2520, 2520],
  borders: NO_BORDERS,
  rows: [
    new TableRow({
      children: [
        cell([p(t("QUOTE NO.", { size: 16, bold: true, color: MUTE, spacing: 20 }), { after: 30 }), p(t("JP-SM-0001", { size: 20, bold: true }), { after: 0 })], { w: 2520, ml: 0, fill: WHITE }),
        cell([p(t("DATE", { size: 16, bold: true, color: MUTE, spacing: 20 }), { after: 30 }), p(t("28 July 2026", { size: 20, bold: true }), { after: 0 })], { w: 2520, fill: WHITE }),
        cell([p(t("VALID UNTIL", { size: 16, bold: true, color: MUTE, spacing: 20 }), { after: 30 }), p(t("27 August 2026", { size: 20, bold: true }), { after: 0 })], { w: 2520, fill: WHITE }),
        cell([p(t("CURRENCY", { size: 16, bold: true, color: MUTE, spacing: 20 }), { after: 30 }), p(t("AUD ($)", { size: 20, bold: true }), { after: 0 })], { w: 2520, fill: WHITE, mr: 0 }),
      ],
    }),
  ],
});

/* ---------- line-items table ---------- */
const COLS = [5040, 1400, 1820, 1820]; // Description | Qty | Unit price | Amount = 10080
function headRow() {
  const mk = (label, align) => cell([new Paragraph({ alignment: align, spacing: { after: 0 }, children: [new TextRun({ text: label, font: FONT, size: 17, bold: true, color: WHITE, allCaps: true, characterSpacing: 20 })] })], { w: null, fill: GREEN, mt: 130, mb: 130 });
  return new TableRow({
    tableHeader: true,
    children: [
      cell([new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: "Description", font: FONT, size: 17, bold: true, color: WHITE, allCaps: true, characterSpacing: 20 })] })], { w: COLS[0], fill: GREEN, mt: 130, mb: 130 }),
      cell([new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [new TextRun({ text: "Qty", font: FONT, size: 17, bold: true, color: WHITE, allCaps: true, characterSpacing: 20 })] })], { w: COLS[1], fill: GREEN, mt: 130, mb: 130 }),
      cell([new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [new TextRun({ text: "Unit Price", font: FONT, size: 17, bold: true, color: WHITE, allCaps: true, characterSpacing: 20 })] })], { w: COLS[2], fill: GREEN, mt: 130, mb: 130 }),
      cell([new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [new TextRun({ text: "Amount", font: FONT, size: 17, bold: true, color: WHITE, allCaps: true, characterSpacing: 20 })] })], { w: COLS[3], fill: GREEN, mt: 130, mb: 130 }),
    ],
  });
}
function itemRow(title, desc, qty, unit, amount, fill) {
  const titleCell = cell([
    p(t(title, { size: 20, bold: true }), { after: 40 }),
    p(t(desc, { size: 17, color: MUTE }), { after: 0, line: 240 }),
  ], { w: COLS[0], fill, valign: VerticalAlign.TOP, mt: 130, mb: 130 });
  const qtyCell = cell([new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [t(qty, { size: 20 })] })], { w: COLS[1], fill, valign: VerticalAlign.TOP, mt: 130 });
  const unitCell = cell([new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [t(unit, { size: 20 })] })], { w: COLS[2], fill, valign: VerticalAlign.TOP, mt: 130 });
  const amtCell = cell([new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [t(amount, { size: 20, bold: true })] })], { w: COLS[3], fill, valign: VerticalAlign.TOP, mt: 130 });
  return new TableRow({ children: [titleCell, qtyCell, unitCell, amtCell] });
}
function totalRow(label, value, o = {}) {
  return new TableRow({
    children: [
      cell([p(t(""))], { w: COLS[0], borders: NO_BORDERS }),
      cell([new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [t(label, { size: o.big ? 21 : 19, bold: true, color: o.big ? WHITE : DARK, caps: o.caps })] })], { w: COLS[1] + COLS[2], fill: o.fill, mt: o.big ? 150 : 110, mb: o.big ? 150 : 110 }),
      cell([new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [t(value, { size: o.big ? 22 : 20, bold: true, color: o.big ? WHITE : DARK })] })], { w: COLS[3], fill: o.fill, mt: o.big ? 150 : 110, mb: o.big ? 150 : 110 }),
    ],
  });
}

const thin = { style: BorderStyle.SINGLE, size: 4, color: "E0E0D8" };
const itemsBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: thin, insideVertical: NONE };

const itemsTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: COLS,
  borders: itemsBorders,
  rows: [
    headRow(),
    itemRow(
      "Social Media Content Plan — Monthly",
      "Monthly content strategy & calendar, on-brand captions, hashtag research, and scheduling across Facebook & Instagram. Includes one planning session and a monthly performance snapshot.",
      "1 / mo", "$[  amount  ]", "$[  amount  ]", WHITE
    ),
    itemRow(
      "Social Posts & Content Video Reel Editing",
      "Design and production of social posts plus editing of short-form video Reels (cuts, captions, music, transitions, brand overlays) supplied ready to publish.",
      "[  qty  ]", "$[  rate  ]", "$[  amount  ]", LIGHT
    ),
  ],
});

const totalsTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: COLS,
  borders: NO_BORDERS,
  rows: [
    totalRow("Subtotal", "$[  amount  ]"),
    totalRow("GST (10%)", "$[  amount  ]"),
    totalRow("Total Due (AUD)", "$[  amount  ]", { big: true, caps: true, fill: GREEN }),
  ],
});

/* ---------- what's included ---------- */
function bulletHeader(txt) {
  return new Paragraph({ spacing: { before: 60, after: 100 }, children: [new TextRun({ text: txt, font: FONT, size: 22, bold: true, color: GREEN, allCaps: true, characterSpacing: 20 })] });
}
function bullet(txt) {
  return new Paragraph({
    spacing: { after: 70, line: 252, lineRule: "auto" },
    indent: { left: 260, hanging: 200 },
    children: [new TextRun({ text: "▪  ", font: FONT, size: 18, color: KHAKI }), new TextRun({ text: txt, font: FONT, size: 19, color: DARK })],
  });
}

const includedLeft = [
  bulletHeader("Content Plan includes"),
  bullet("Monthly content calendar mapped to key dates & campaigns"),
  bullet("Copywriting: captions, hooks & call-to-actions"),
  bullet("Researched, relevant hashtag sets"),
  bullet("Scheduling & publishing coordination"),
  bullet("Monthly performance snapshot & recommendations"),
];
const includedRight = [
  bulletHeader("Posts & Reel editing includes"),
  bullet("Graphic social posts designed on-brand"),
  bullet("Short-form Reel editing — cuts, captions & music"),
  bullet("Brand overlays, transitions & colour grade"),
  bullet("Formatting for Feed, Reels & Stories"),
  bullet("Up to two rounds of revisions per deliverable"),
];

const includedTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [4920, 240, 4920],
  borders: NO_BORDERS,
  rows: [
    new TableRow({
      children: [
        cell(includedLeft, { w: 4920, ml: 0, valign: VerticalAlign.TOP }),
        cell([p(t(""))], { w: 240 }),
        cell(includedRight, { w: 4920, mr: 0, valign: VerticalAlign.TOP }),
      ],
    }),
  ],
});

/* ---------- terms ---------- */
function term(n, txt) {
  return new Paragraph({
    spacing: { after: 70, line: 240, lineRule: "auto" },
    indent: { left: 300, hanging: 300 },
    children: [new TextRun({ text: n + ".  ", font: FONT, size: 18, bold: true, color: GREEN }), new TextRun({ text: txt, font: FONT, size: 18, color: MUTE })],
  });
}

/* ---------- signature ---------- */
const sigLine = { style: BorderStyle.SINGLE, size: 6, color: "B0B0A6" };
const signTable = new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [4920, 240, 4920],
  borders: NO_BORDERS,
  rows: [
    new TableRow({
      children: [
        cell([
          new Paragraph({ spacing: { before: 360, after: 40 }, border: { bottom: sigLine }, children: [t("", { size: 2 })] }),
          p(t("Accepted for Balga Designs (name & signature)", { size: 16, color: MUTE }), { after: 20 }),
          new Paragraph({ spacing: { before: 300, after: 40 }, border: { bottom: sigLine }, children: [t("", { size: 2 })] }),
          p(t("Date", { size: 16, color: MUTE }), { after: 0 }),
        ], { w: 4920, ml: 0, valign: VerticalAlign.TOP }),
        cell([p(t(""))], { w: 240 }),
        cell([
          new Paragraph({ spacing: { before: 360, after: 40 }, border: { bottom: sigLine }, children: [t("", { size: 2 })] }),
          p(t("Lizelle Jewell — Jewell Projects", { size: 16, color: MUTE }), { after: 20 }),
          new Paragraph({ spacing: { before: 300, after: 40 }, border: { bottom: sigLine }, children: [t("", { size: 2 })] }),
          p(t("Date", { size: 16, color: MUTE }), { after: 0 }),
        ], { w: 4920, mr: 0, valign: VerticalAlign.TOP }),
      ],
    }),
  ],
});

/* ---------- assemble ---------- */
const doc = new Document({
  creator: "Jewell Projects",
  title: "Social Media Services Quotation — Balga Designs",
  styles: { default: { document: { run: { font: FONT, size: 20, color: DARK } } } },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: MARGIN, bottom: 900, left: MARGIN, right: MARGIN } } },
    footers: undefined,
    children: [
      headerTable,
      rule,
      partiesTable,
      p(t(""), { after: 120 }),
      metaTable,
      p(t(""), { after: 140 }),
      p([t("Thank you for the opportunity to support ", { size: 20 }), t("Balga Designs", { size: 20, bold: true }), t(" with its social media presence. This quotation covers an ongoing monthly content plan together with social post and video Reel production, priced below.", { size: 20 })], { after: 200 }),
      itemsTable,
      p(t(""), { after: 80 }),
      totalsTable,
      p(t("Pricing shown in AUD. Amounts marked $[ … ] to be confirmed. GST applied where registered.", { size: 16, italics: true, color: MUTE }), { before: 100, after: 240 }),
      new Paragraph({ spacing: { before: 40, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: KHAKI } }, children: [t("WHAT'S INCLUDED", { size: 22, bold: true, color: DARK, spacing: 30 })] }),
      includedTable,
      new Paragraph({ spacing: { before: 260, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: KHAKI } }, children: [t("TERMS & NOTES", { size: 22, bold: true, color: DARK, spacing: 30 })] }),
      term("1", "This quotation is valid for 30 days from the date shown above."),
      term("2", "The monthly content plan is billed as a recurring monthly fee; either party may cancel with 30 days' written notice."),
      term("3", "Reel/video editing is quoted per deliverable; final volume and rates to be confirmed against the agreed monthly scope."),
      term("4", "Up to two rounds of revisions are included per deliverable; additional revisions are billed at an hourly rate."),
      term("5", "The client provides source photos, video footage and brand assets; stock or additional shoots are quoted separately."),
      term("6", "A deposit may be required to commence; recurring fees are invoiced monthly in advance."),
      term("7", "All original design and edited assets are released to the client on payment of the relevant invoice."),
      p(t(""), { after: 120 }),
      new Paragraph({ spacing: { before: 40, after: 40 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: KHAKI } }, children: [t("ACCEPTANCE", { size: 22, bold: true, color: DARK, spacing: 30 })] }),
      p(t("To proceed, please sign below or reply by email to confirm acceptance of this quotation.", { size: 18, color: MUTE }), { before: 120, after: 0 }),
      signTable,
      p([t("Jewell Projects", { size: 16, bold: true, color: GREEN }), t("   ·   lizelle@jewellprojects.com   ·   jewellprojects.com", { size: 16, color: MUTE })], { before: 360, after: 0, align: AlignmentType.CENTER }),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/user/balga/audit/Balga-Designs-Social-Media-Quotation.docx", buf);
  console.log("written", buf.length, "bytes");
});
