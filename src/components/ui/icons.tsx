import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconBookmark({
  size = 18,
  marked = false,
  className,
  ...rest
}: IconProps & { marked?: boolean }) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      {marked ? (
        <path
          fill="currentColor"
          stroke="none"
          d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
        />
      ) : (
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
      )}
    </svg>
  );
}

export function IconFilter({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function IconPlus({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconUserPlus({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export function IconUser({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconSend({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export function IconX({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconCheck({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconChevronLeft({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconGripVertical({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Vertical ellipsis — friend card overflow menu, etc. */
export function IconDotsVertical({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <circle cx="12" cy="5" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconExternalLink({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

export function IconPencil({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

export function IconRefreshCw({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
}

export function IconClipboard({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

export function IconBan({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 14.14 14.14" />
    </svg>
  );
}

export function IconEraser({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  );
}

export function IconCloudUpload({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M12 13v8" />
      <path d="m4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="m8 17 4-4 4 4" />
    </svg>
  );
}

export function IconLogOut({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export function IconTrash2({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

export function IconShoppingBag({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function IconClock({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconAlertTriangle({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function IconMessage({ size = 18, className, ...rest }: IconProps) {
  return (
    <svg {...base(size)} className={className} aria-hidden {...rest}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
