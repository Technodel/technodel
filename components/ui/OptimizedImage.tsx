"use client";
import { useState } from "react";
import NextImage from "next/image";

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

  if (!src || src === "/placeholder.png") {
    return (
      <div
        className={className || "skeleton"}
        style={{
          width: width || "100%",
          height: height || "100%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--c-surface2)",
          borderRadius: "var(--r-sm)",
          ...style,
        }}
      >
        <span style={{ fontSize: 32 }}>📦</span>
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
        src={src}
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
      />
    </div>
  );
}
