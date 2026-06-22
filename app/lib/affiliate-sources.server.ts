/**
 * Pluggable affiliate catalog import sources.
 *
 * Each source can search a network's product API and return normalized items
 * the admin can one-click add to the catalog. Real integrations (Amazon
 * PA-API, Awin, CJ, …) plug in here once API credentials exist — same pattern
 * as the Stripe / Resend / R2 stubs. Until then, sources report "not
 * configured" and admins add catalog products manually.
 */
export type CatalogSearchResult = {
  title: string;
  description?: string;
  imageUrl?: string;
  priceCents?: number;
  currency?: string;
  category?: string;
  productUrl: string;
  externalId?: string;
};

export type ImportResult =
  | { ok: true; items: CatalogSearchResult[] }
  | { ok: false; reason: string };

export interface AffiliateSource {
  network: string;
  label: string;
  configured: boolean;
  search(query: string): Promise<ImportResult>;
}

/** A source that isn't wired to a real API yet. */
function stubSource(network: string, label: string, envHint: string): AffiliateSource {
  return {
    network,
    label,
    configured: false,
    async search() {
      return {
        ok: false,
        reason: `${label} import isn't configured. Set ${envHint} to enable API import, or add products manually.`,
      };
    },
  };
}

export const AFFILIATE_SOURCES: AffiliateSource[] = [
  stubSource("amazon", "Amazon Associates", "AMAZON_PAAPI_* keys"),
  stubSource("awin", "Awin", "AWIN_API_TOKEN"),
  stubSource("cj", "CJ Affiliate", "CJ_API_TOKEN"),
];

export function getSource(network: string): AffiliateSource | undefined {
  return AFFILIATE_SOURCES.find((s) => s.network === network);
}
