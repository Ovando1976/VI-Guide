"use client";

import Image from "next/image";

export function SocialAvatar({
  src,
  name,
  size = 44,
}: {
  src?: string | null;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "I";

  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#063d45] to-[#129a98] font-black text-white shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized={src.startsWith("data:")} />
      ) : (
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.28)) }}>{initials}</span>
      )}
    </span>
  );
}
