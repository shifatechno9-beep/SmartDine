import QRCode from "qrcode";
import {
  QR_BRASS,
  QR_CARD_HEIGHT,
  QR_CARD_WIDTH,
  QR_INK,
  QR_LINE,
  QR_MUTED,
  QR_SCAN_AR,
  QR_SCAN_FR,
  cssFont,
  menuQrUrl,
  type QrCardInput,
} from "@/lib/qr-card";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

async function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const brand = await loadImage("/brand-mark.png");
  if (brand) {
    const pad = Math.round(size * 0.06);
    ctx.drawImage(brand, x + pad, y + pad, size - pad * 2, size - pad * 2);
    return;
  }

  roundRect(ctx, x, y, size, size, 22);
  ctx.fillStyle = QR_INK;
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = QR_BRASS;
  ctx.arc(x + size / 2, y + size / 2, 10, 0, Math.PI * 2);
  ctx.fill();
}

export async function renderQrCardCanvas(input: QrCardInput): Promise<HTMLCanvasElement> {
  if (typeof document !== "undefined") {
    await document.fonts.ready;
  }

  const canvas = document.createElement("canvas");
  canvas.width = QR_CARD_WIDTH;
  canvas.height = QR_CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is not available.");
  }

  const sans = cssFont("--font-geist-sans", "ui-sans-serif");
  const arabic = cssFont("--font-arabic", "Noto Sans Arabic");
  const url = menuQrUrl(input.origin, input.restaurantSlug, input.table);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, QR_CARD_WIDTH, QR_CARD_HEIGHT);

  ctx.fillStyle = QR_BRASS;
  ctx.fillRect(0, 0, QR_CARD_WIDTH, 22);

  ctx.strokeStyle = QR_LINE;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, QR_CARD_WIDTH - 4, QR_CARD_HEIGHT - 4);

  const markX = 72;
  const markY = 72;
  const markSize = 96;
  const logo = input.logoUrl ? await loadImage(input.logoUrl) : null;
  if (logo) {
    ctx.save();
    roundRect(ctx, markX, markY, markSize, markSize, 22);
    ctx.clip();
    ctx.drawImage(logo, markX, markY, markSize, markSize);
    ctx.restore();
    ctx.strokeStyle = QR_LINE;
    ctx.lineWidth = 3;
    roundRect(ctx, markX, markY, markSize, markSize, 22);
    ctx.stroke();
  } else {
    await drawMark(ctx, markX, markY, markSize);
  }

  ctx.fillStyle = QR_INK;
  ctx.font = `600 42px ${sans}, ui-sans-serif, system-ui`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(input.restaurantName, markX + markSize + 28, markY + 48, 900);
  ctx.fillStyle = QR_MUTED;
  ctx.font = `500 22px ${sans}, ui-sans-serif, system-ui`;
  ctx.fillText("SAVYDINE", markX + markSize + 28, markY + 82);

  ctx.textAlign = "center";
  ctx.fillStyle = QR_INK;
  ctx.font = `700 56px ${arabic}, ${sans}, sans-serif`;
  ctx.direction = "rtl";
  ctx.fillText(`الطاولة ${input.table}`, QR_CARD_WIDTH / 2, 280);
  ctx.direction = "ltr";
  ctx.fillStyle = QR_MUTED;
  ctx.font = `500 36px ${sans}, ui-sans-serif, system-ui`;
  ctx.fillText(`Table ${input.table}`, QR_CARD_WIDTH / 2, 332);

  const qrSize = 720;
  const qrX = (QR_CARD_WIDTH - qrSize) / 2;
  const qrY = 400;
  roundRect(ctx, qrX - 28, qrY - 28, qrSize + 56, qrSize + 56, 36);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = QR_LINE;
  ctx.lineWidth = 3;
  ctx.stroke();

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: qrSize,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: QR_INK, light: "#ffffff" },
  });
  const qrImage = await loadImage(qrDataUrl);
  if (!qrImage) {
    throw new Error("Could not render the QR matrix.");
  }
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = QR_INK;
  ctx.font = `700 48px ${arabic}, ${sans}, sans-serif`;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillText(QR_SCAN_AR, QR_CARD_WIDTH / 2, 1288);
  ctx.direction = "ltr";
  ctx.fillStyle = QR_MUTED;
  ctx.font = `500 34px ${sans}, ui-sans-serif, system-ui`;
  ctx.fillText(QR_SCAN_FR, QR_CARD_WIDTH / 2, 1348);

  ctx.fillStyle = QR_LINE;
  ctx.fillRect(360, 1410, 480, 2);
  ctx.fillStyle = QR_MUTED;
  ctx.font = `400 22px ${sans}, ui-sans-serif, system-ui`;
  ctx.fillText(url.replace(/^https?:\/\//, ""), QR_CARD_WIDTH / 2, 1470, 980);

  return canvas;
}

export async function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/png");
  });
  if (!blob) {
    throw new Error("Could not encode PNG.");
  }
  return blob;
}

export async function canvasToPngDataUrl(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL("image/png");
}
