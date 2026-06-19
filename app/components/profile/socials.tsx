import { brandIcons, WebsiteIcon } from "./brand-icons";

export const SOCIAL_PLATFORMS = [
  "x",
  "youtube",
  "instagram",
  "tiktok",
  "twitch",
  "github",
  "facebook",
  "linkedin",
  "website",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export function socialIcon(platform: string) {
  return brandIcons[platform.toLowerCase()] ?? WebsiteIcon;
}

export function SocialRow({
  links,
}: {
  links: { id: string; platform: string; url: string }[];
}) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((s) => {
        const Icon = socialIcon(s.platform);
        return (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            aria-label={s.platform}
            className="grid h-10 w-10 place-items-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Icon className="h-5 w-5" />
          </a>
        );
      })}
    </div>
  );
}
