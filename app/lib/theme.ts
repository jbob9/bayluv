/** Accent theme options a creator can pick for their page. */
export const THEME_COLORS = [
  { id: "primary", label: "Coral", swatch: "#ff5c39" },
  { id: "mint", label: "Mint", swatch: "#2fd2a8" },
  { id: "sky", label: "Sky", swatch: "#4fb0ff" },
  { id: "grape", label: "Grape", swatch: "#9b6cff" },
  { id: "sunny", label: "Sunny", swatch: "#ffc83d" },
] as const;

export type ThemeId = (typeof THEME_COLORS)[number]["id"];

/** Tailwind classes per accent token, used to theme the public page. */
export const themeClasses: Record<
  string,
  { bg: string; text: string; soft: string; ring: string; coverFrom: string }
> = {
  primary: {
    bg: "bg-primary",
    text: "text-primary",
    soft: "bg-primary-100 text-primary-700",
    ring: "ring-primary",
    coverFrom: "from-primary-300 to-primary",
  },
  mint: {
    bg: "bg-mint",
    text: "text-mint",
    soft: "bg-mint-soft text-mint",
    ring: "ring-mint",
    coverFrom: "from-mint-soft to-mint",
  },
  sky: {
    bg: "bg-sky",
    text: "text-sky",
    soft: "bg-sky-soft text-sky",
    ring: "ring-sky",
    coverFrom: "from-sky-soft to-sky",
  },
  grape: {
    bg: "bg-grape",
    text: "text-grape",
    soft: "bg-grape-soft text-grape",
    ring: "ring-grape",
    coverFrom: "from-grape-soft to-grape",
  },
  sunny: {
    bg: "bg-sunny",
    text: "text-[#946100]",
    soft: "bg-sunny-soft text-[#946100]",
    ring: "ring-sunny",
    coverFrom: "from-sunny-soft to-sunny",
  },
};

export function getTheme(id?: string | null) {
  return themeClasses[id ?? "primary"] ?? themeClasses.primary;
}
