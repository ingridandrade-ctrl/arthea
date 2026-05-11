import axios, { AxiosInstance } from "axios";

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export const META_OAUTH_SCOPES = [
  "ads_management",
  "ads_read",
  "business_management",
  "leads_retrieval",
  "pages_show_list",
  "pages_read_engagement",
];

export function getRedirectUri(): string {
  const base = process.env.META_REDIRECT_BASE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/meta/oauth/callback`;
}

export function getOAuthLoginUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID nao configurado");
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: getRedirectUri(),
    state,
    scope: META_OAUTH_SCOPES.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn: number | null;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID/META_APP_SECRET nao configurados");

  const { data } = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: getRedirectUri(),
      code,
    },
  });
  return {
    accessToken: data.access_token,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
  };
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<{
  accessToken: string;
  expiresIn: number | null;
}> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID/META_APP_SECRET nao configurados");

  const { data } = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    },
  });
  return {
    accessToken: data.access_token,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
  };
}

export function createMetaClient(accessToken: string): AxiosInstance {
  const client = axios.create({
    baseURL: GRAPH_BASE,
    timeout: 30_000,
  });
  client.interceptors.request.use((config) => {
    config.params = { ...(config.params || {}), access_token: accessToken };
    return config;
  });
  return client;
}

export interface MetaProfile {
  id: string;
  name?: string;
  email?: string;
}

export async function getMeProfile(accessToken: string): Promise<MetaProfile> {
  const client = createMetaClient(accessToken);
  const { data } = await client.get("/me", { params: { fields: "id,name,email" } });
  return data;
}

export interface MetaAdAccountRaw {
  id: string;
  account_id: string;
  name: string;
  currency?: string;
  timezone_name?: string;
  account_status?: number;
  business?: { id: string; name: string };
}

export async function listAdAccounts(accessToken: string): Promise<MetaAdAccountRaw[]> {
  const client = createMetaClient(accessToken);
  const out: MetaAdAccountRaw[] = [];
  let next: string | null = "/me/adaccounts";
  let params: Record<string, string> | undefined = {
    fields: "id,account_id,name,currency,timezone_name,account_status,business{id,name}",
    limit: "100",
  };
  while (next) {
    const { data }: { data: { data: MetaAdAccountRaw[]; paging?: { next?: string } } } =
      await client.get(next, { params });
    out.push(...(data.data || []));
    if (data.paging?.next) {
      next = data.paging.next.replace(GRAPH_BASE, "");
      params = undefined;
    } else {
      next = null;
    }
  }
  return out;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export async function listCampaigns(accessToken: string, adAccountId: string): Promise<MetaCampaign[]> {
  const client = createMetaClient(accessToken);
  const accountPath = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const { data } = await client.get(`/${accountPath}/campaigns`, {
    params: {
      fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
      limit: "100",
    },
  });
  return data.data || [];
}

export interface MetaInsights {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  actions?: { action_type: string; value: string }[];
  date_start?: string;
  date_stop?: string;
}

export async function getAccountInsights(
  accessToken: string,
  adAccountId: string,
  datePreset: string = "last_30d",
): Promise<MetaInsights | null> {
  const client = createMetaClient(accessToken);
  const accountPath = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const { data } = await client.get(`/${accountPath}/insights`, {
    params: {
      fields: "spend,impressions,reach,clicks,cpm,cpc,ctr,actions",
      date_preset: datePreset,
    },
  });
  return (data.data && data.data[0]) || null;
}

export interface MetaLeadForm {
  id: string;
  name?: string;
  page_id?: string;
  status?: string;
}

export async function listLeadForms(accessToken: string, adAccountId: string): Promise<MetaLeadForm[]> {
  const client = createMetaClient(accessToken);
  const accountPath = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const { data } = await client.get(`/${accountPath}/leadgen_forms`, {
    params: { fields: "id,name,page_id,status", limit: "100" },
  });
  return data.data || [];
}

export interface MetaLeadEntry {
  id: string;
  created_time: string;
  field_data: { name: string; values: string[] }[];
  ad_id?: string;
  campaign_id?: string;
  form_id?: string;
}

export async function getLeadById(accessToken: string, leadgenId: string): Promise<MetaLeadEntry> {
  const client = createMetaClient(accessToken);
  const { data } = await client.get(`/${leadgenId}`, {
    params: { fields: "id,created_time,field_data,ad_id,campaign_id,form_id" },
  });
  return data;
}
