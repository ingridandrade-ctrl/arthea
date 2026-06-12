// Configuração do Google Ads — todos os secrets em env vars na Vercel.
// Nada é armazenado no banco. O developer_token, refresh_token e
// client_secret nunca aparecem em logs ou JSON enviado pro cliente.

export type GoogleAdsConfig = {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  mccCustomerId: string; // ex: "1234567890" (sem hífens)
};

export function getGoogleAdsConfig(): GoogleAdsConfig {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const mccCustomerId = process.env.GOOGLE_ADS_MCC_CUSTOMER_ID;

  if (!clientId || !clientSecret || !developerToken || !refreshToken || !mccCustomerId) {
    throw new Error(
      "Google Ads não configurado. Defina na Vercel: " +
        "GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, " +
        "GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_REFRESH_TOKEN, " +
        "GOOGLE_ADS_MCC_CUSTOMER_ID.",
    );
  }

  return {
    clientId,
    clientSecret,
    developerToken,
    refreshToken,
    mccCustomerId: stripHyphens(mccCustomerId),
  };
}

/** Remove hífens do customer id ("123-456-7890" → "1234567890"). */
export function stripHyphens(customerId: string): string {
  return customerId.replace(/-/g, "");
}
