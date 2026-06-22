/**
 * Affiliate network registry. Each network knows the query param used to carry
 * the affiliate tag, so we can rewrite a canonical product URL with a creator's
 * own tag at click time (the creator earns the commission).
 */
export const NETWORKS: Record<string, { label: string; tagParam: string }> = {
  amazon: { label: "Amazon Associates", tagParam: "tag" },
  awin: { label: "Awin", tagParam: "awinaffid" },
  cj: { label: "CJ Affiliate", tagParam: "PID" },
  impact: { label: "Impact", tagParam: "irclickid" },
  other: { label: "Other / custom", tagParam: "ref" },
};

export const NETWORK_KEYS = Object.keys(NETWORKS);

export function networkLabel(network: string): string {
  return NETWORKS[network]?.label ?? network;
}

/**
 * Returns the product URL with the creator's affiliate tag injected for the
 * given network. If no tag is set, returns the URL unchanged (no commission).
 */
export function buildAffiliateUrl(
  productUrl: string,
  network: string,
  creatorTag?: string | null,
): string {
  if (!creatorTag) return productUrl;
  const cfg = NETWORKS[network];
  if (!cfg) return productUrl;
  try {
    const url = new URL(productUrl);
    url.searchParams.set(cfg.tagParam, creatorTag);
    return url.toString();
  } catch {
    return productUrl;
  }
}
