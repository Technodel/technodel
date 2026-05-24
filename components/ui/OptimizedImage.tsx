"use client";
import { useEffect, useState } from "react";
import NextImage from "next/image";

// Route external images through our proxy to bypass hotlink blocking.
function proxyUrl(src: string): string {
  if (!src || src.startsWith("/") || src.startsWith("data:")) return src;
  return `/new/api/img-proxy?url=${encodeURIComponent(src)}`;
}

function isExternalUrl(src: string): boolean {
  return !!src && !src.startsWith("/") && !src.startsWith("data:");
}

function normalizeSourceUrl(src: string): string {
  if (!isExternalUrl(src)) return src;

  try {
    const u = new URL(src);
    if (u.hostname.toLowerCase() === "cdn11.bigcommerce.com") {
      // Upgrade tiny stencil variants to a high-res rendition for sharper cards.
      u.pathname = u.pathname.replace(/\/stencil\/\d+x\d+\//i, "/stencil/1280x1280/");
      return u.toString();
    }
  } catch {
    return src;
  }

  return src;
}

const FALLBACK_LOGO_SRC = "/new/logo.png?v=2";

type ImageAttempt = "proxy" | "direct" | "fallback";

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
  const [attempt, setAttempt] = useState<ImageAttempt>("proxy");

  useEffect(() => {
    setAttempt("proxy");
    setLoaded(false);
  }, [src]);

  const normalizedSrc = normalizeSourceUrl(src);
  const isExternal = isExternalUrl(normalizedSrc);

  const resolvedSrc =
    attempt === "fallback"
      ? FALLBACK_LOGO_SRC
      : attempt === "direct"
        ? normalizedSrc
        : proxyUrl(normalizedSrc);

  // Immediate fallback when source is missing.
  if (!src || src === "/placeholder.png") {
    return (
      <div
        className={className}
        style={{
          width: width || "100%",
          height: height || "100%",
          background: "var(--c-surface2)",
          borderRadius: "var(--r-sm)",
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
      >
        <NextImage
          src={FALLBACK_LOGO_SRC}
          alt={alt}
          width={fill ? undefined : (width || 400)}
          height={fill ? undefined : (height || 400)}
          fill={fill}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={className}
          style={{ objectFit: "contain", ...style }}
        />
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
        src={resolvedSrc}
        alt={alt}
        unoptimized={isExternal}
        width={fill ? undefined : (width || 400)}
        height={fill ? undefined : (height || 400)}
        fill={fill}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        placeholder={priority ? "blur" : "empty"}
        blurDataURL={priority ? `data:image/svg+xml;base64,${toBase64(shimmer(400, 400))}` : undefined}
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
          if (!isExternal || attempt === "fallback") {
            setAttempt("fallback");
          } else if (attempt === "proxy") {
            setAttempt("direct");
          } else {
            setAttempt("fallback");
          }
          setLoaded(false);
        }}
      />
    </div>
  );
}
