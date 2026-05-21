"use client";
import { useState } from "react";
import NextImage from "next/image";

// Route external images through our proxy to bypass hotlink blocking.
function proxyUrl(src: string): string {
  if (!src || src.startsWith("/") || src.startsWith("data:")) return src;
  return `/new/api/img-proxy?url=${encodeURIComponent(src)}`;
}

interface Props {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  priority?: boolean;
  objectFit?: "contain" | "cover" | "fill";
  onLoad?: () => void;
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#0d1a2d"/>
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0d1a2d" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="#1a2e4a" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0d1a2d" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
</svg>`;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

export default function OptimizedImage({
  src, alt, width, height, className, style, fill = false,
  priority = false, objectFit = "contain", onLoad,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Route external images through proxy to bypass hotlink blocking
  const resolvedSrc = errored ? "" : proxyUrl(src);

  // Better fallback for missing images — show branded placeholder
  if (!src || src === "/placeholder.png" || errored) {
    // Extract initials from alt text
    const initials = alt
      ? alt.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase().substring(0, 2)
      : "?";
    const colors = [
      "linear-gradient(135deg, #0d1a2d, #1a2e4a)",
      "linear-gradient(135deg, #1a0d2d, #2e1a4a)",
      "linear-gradient(135deg, #0d2d1a, #1a4a2e)",
      "linear-gradient(135deg, #2d1a0d, #4a2e1a)",
      "linear-gradient(135deg, #1a1a2d, #2e2e4a)",
      "linear-gradient(135deg, #0d2d2d, #1a4a4a)",
    ];
    const colorIdx = alt.length % colors.length;
    return (
      <div
        className={className || "skeleton"}
        style={{
          width: width || "100%",
          height: height || "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
          gap: 6,
          background: colors[colorIdx],
          borderRadius: "var(--r-sm)",
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
      >
        {/* Subtle pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(255,255,255,0.03) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(255,255,255,0.02) 0%, transparent 50%)
          `,
        }} />
        {/* Initials */}
        <span style={{
          fontSize: 28, fontWeight: 800,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: "1px",
          position: "relative",
          zIndex: 1,
          lineHeight: 1,
        }}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: fill ? "100%" : width,
        height: fill ? "100%" : height,
        overflow: "hidden",
        ...(fill ? {} : {}),
        ...style,
      }}
    >
      {!loaded && (
        <div
          className="skeleton"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            zIndex: 0,
          }}
        />
      )}
      <NextImage
        src={resolvedSrc || "/placeholder.png"}
        alt={alt}
        width={fill ? undefined : (width || 400)}
        height={fill ? undefined : (height || 400)}
        fill={fill}
        priority={priority}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        placeholder={`data:image/svg+xml;base64,${toBase64(shimmer(400, 400))}`}
        className={className}
        style={{
          objectFit,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.3s ease",
          ...style,
        }}
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          setErrored(true);
          setLoaded(false);
        }}
      />
    </div>
  );
}
