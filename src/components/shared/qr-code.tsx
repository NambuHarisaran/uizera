"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

/** Renders a scannable QR for `value` onto a canvas. Regenerates whenever the
 * value or size changes (e.g. the join link isn't known until the quizId is). */
export function QrCode({ value, size = 200, className }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    setError(false);
    QRCode.toCanvas(
      canvasRef.current,
      value,
      { width: size, margin: 1, color: { dark: "#000000", light: "#ffffff" } },
      (err) => {
        if (err) setError(true);
      }
    );
  }, [value, size]);

  if (error) {
    return (
      <div
        className={className}
        style={{ width: size, height: size }}
        role="img"
        aria-label="QR code unavailable"
      />
    );
  }

  return <canvas ref={canvasRef} width={size} height={size} className={className} />;
}
