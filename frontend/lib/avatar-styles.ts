/** Marco visual compartido para avatares (borde blanco + anillo azul claro + sombra). */
export const avatarFallbackClass = "bg-[#95C9FC] font-semibold text-[#10314F]";

export const avatarFrameBySize = {
  xs: "border-2 border-white shadow-[0_6px_16px_rgba(37,99,235,0.12)] ring-2 ring-[#C6E2FE]/50",
  sm: "border-2 border-white shadow-[0_8px_20px_rgba(37,99,235,0.12)] ring-2 ring-[#C6E2FE]/50",
  md: "border-2 border-white shadow-[0_10px_24px_rgba(37,99,235,0.13)] ring-[3px] ring-[#C6E2FE]/50",
  lg: "border-[3px] border-white shadow-[0_12px_28px_rgba(37,99,235,0.14)] ring-[3px] ring-[#C6E2FE]/50",
  xl: "border-4 border-white shadow-[0_12px_28px_rgba(37,99,235,0.14)] ring-4 ring-[#C6E2FE]/50",
} as const;

export type AvatarFrameSize = keyof typeof avatarFrameBySize;

export function avatarFrameClass(size: AvatarFrameSize = "md") {
  return avatarFrameBySize[size];
}

/** Clases para `<img>` circulares fuera del componente Avatar (p. ej. mapa). */
export function avatarImageFrameClass(size: AvatarFrameSize = "sm") {
  return `rounded-full object-cover ${avatarFrameBySize[size]}`;
}
