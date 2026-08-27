import {
  menuQrUrl,
  type QrCardInput,
  type QrLayout,
} from "@/lib/qr-card";
import { canvasToPngBlob, canvasToPngDataUrl, renderQrCardCanvas } from "@/lib/qr-render";

export function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
}

export async function downloadTablePng(input: QrCardInput) {
  const canvas = await renderQrCardCanvas(input);
  const blob = await canvasToPngBlob(canvas);
  downloadBlob(blob, `${input.restaurantSlug}-table-${input.table}.png`);
}

export async function downloadTablesPdf(
  input: Omit<QrCardInput, "table"> & { tables: number; layout: QrLayout },
  onProgress?: (current: number, total: number) => void,
) {
  if (input.layout === "sticker") {
    await downloadStickerSheet(input, onProgress);
    return;
  }

  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "mm",
    format: "a6",
    orientation: "portrait",
    compress: true,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6;

  for (let table = 1; table <= input.tables; table += 1) {
    onProgress?.(table, input.tables);
    if (table > 1) {
      pdf.addPage();
    }

    const dataUrl = await canvasToPngDataUrl(await renderQrCardCanvas({ ...input, table }));
    const props = pdf.getImageProperties(dataUrl);
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / props.width, maxH / props.height);
    const width = props.width * ratio;
    const height = props.height * ratio;
    pdf.addImage(dataUrl, "PNG", (pageW - width) / 2, (pageH - height) / 2, width, height);
  }

  pdf.save(`${input.restaurantSlug}-qr-tents.pdf`);
}

async function downloadStickerSheet(
  input: Omit<QrCardInput, "table"> & { tables: number },
  onProgress?: (current: number, total: number) => void,
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });
  const cols = 2;
  const rows = 3;
  const perPage = cols * rows;
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const gap = 6;
  const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (pageH - margin * 2 - gap * (rows - 1)) / rows;

  for (let table = 1; table <= input.tables; table += 1) {
    onProgress?.(table, input.tables);
    const index = table - 1;
    const slot = index % perPage;
    if (index > 0 && slot === 0) {
      pdf.addPage();
    }

    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const x = margin + col * (cellW + gap);
    const y = margin + row * (cellH + gap);
    const dataUrl = await canvasToPngDataUrl(await renderQrCardCanvas({ ...input, table }));
    const props = pdf.getImageProperties(dataUrl);
    const ratio = Math.min(cellW / props.width, cellH / props.height);
    const width = props.width * ratio;
    const height = props.height * ratio;
    pdf.addImage(dataUrl, "PNG", x + (cellW - width) / 2, y + (cellH - height) / 2, width, height);
    pdf.setDrawColor(212, 212, 216);
    pdf.setLineDashPattern([1.5, 1.5], 0);
    pdf.rect(x, y, cellW, cellH);
    pdf.setLineDashPattern([], 0);
  }

  pdf.save(`${input.restaurantSlug}-qr-stickers.pdf`);
}

export function previewMenuUrl(origin: string, slug: string, table: number) {
  return menuQrUrl(origin, slug, table);
}
