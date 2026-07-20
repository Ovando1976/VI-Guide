import Image from "next/image";

export function ViBrandMark({
  className = "h-11 w-11",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={`relative inline-block shrink-0 overflow-hidden rounded-full border border-white/70 bg-white shadow-[inset_0_0_0_1px_rgba(4,51,49,.08),0_8px_24px_rgba(0,0,0,.24)] ${className}`}
      aria-hidden="true"
    >
      <Image
        src="/images/usvi-logo.jpeg"
        alt=""
        fill
        priority={priority}
        sizes="56px"
        className="object-cover"
      />
    </span>
  );
}
