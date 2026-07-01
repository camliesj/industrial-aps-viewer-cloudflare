const APS_AUTH_URL = "https://developer.api.autodesk.com/authentication/v2/token";
const APS_OSS_URL = "https://developer.api.autodesk.com/oss/v2";
const APS_DERIVATIVE_URL = "https://developer.api.autodesk.com/modelderivative/v2/designdata";

export class ApsClient {
  constructor(env) { this.env = env; }

  async getViewerToken() {
    const payload = await this.getToken("viewables:read", true);
    return { access_token: payload.access_token, expires_in: payload.expires_in };
  }

  async getInternalToken() {
    return this.getToken("data:read data:write data:create bucket:create bucket:read viewables:read");
  }

  async getToken(scope, fullPayload = false) {
    if (!this.env.APS_CLIENT_ID || !this.env.APS_CLIENT_SECRET) throw new Error("Missing APS secrets");
    const response = await fetch(APS_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${this.env.APS_CLIENT_ID}:${this.env.APS_CLIENT_SECRET}`)}`
      },
      body: new URLSearchParams({ grant_type: "client_credentials", scope })
    });
    const payload = await readApsJson(response);
    return fullPayload ? payload : payload.access_token;
  }

  async ensureBucket() {
    const token = await this.getInternalToken();
    const bucketKey = this.bucketKey();
    const details = await fetch(`${APS_OSS_URL}/buckets/${bucketKey}/details`, { headers: { Authorization: `Bearer ${token}` } });
    if (details.ok) return readApsJson(details);
    if (details.status !== 404) return readApsJson(details);
    return readApsJson(await fetch(`${APS_OSS_URL}/buckets`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-ads-region": this.env.APS_REGION || "US" },
      body: JSON.stringify({ bucketKey, policyKey: "transient" })
    }));
  }

  async createSignedUpload(objectName) {
    await this.ensureBucket();
    const token = await this.getInternalToken();
    return readApsJson(await fetch(this.signedUploadUrl(objectName), { headers: { Authorization: `Bearer ${token}` } }));
  }

  async completeSignedUpload(objectName, uploadKey) {
    const token = await this.getInternalToken();
    return readApsJson(await fetch(this.signedUploadUrl(objectName), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uploadKey })
    }));
  }

  async translate(urn) {
    const token = await this.getInternalToken();
    return readApsJson(await fetch(`${APS_DERIVATIVE_URL}/job`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "x-ads-force": "true" },
      body: JSON.stringify({ input: { urn }, output: { formats: [{ type: "svf2", views: ["2d", "3d"] }] } })
    }));
  }

  async getManifest(urn) {
    const token = await this.getInternalToken();
    const response = await fetch(`${APS_DERIVATIVE_URL}/${urn}/manifest`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 404) return { status: "not_started", progress: "0%" };
    return readApsJson(response);
  }

  async getThumbnail(urn, size = 1000) {
    const token = await this.getInternalToken();
    const imageSize = Math.min(Math.max(Number(size) || 1000, 200), 1000);
    const response = await fetch(`${APS_DERIVATIVE_URL}/${urn}/thumbnail?width=${imageSize}&height=${imageSize}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`APS thumbnail request failed (${response.status}): ${text || response.statusText}`);
    }
    return { body: response.body, contentType: response.headers.get("Content-Type") };
  }

  toUrn(objectId) { return btoa(objectId).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }
  signedUploadUrl(objectName) { return `${APS_OSS_URL}/buckets/${this.bucketKey()}/objects/${encodeURIComponent(objectName)}/signeds3upload`; }
  bucketKey() {
    if (!this.env.APS_BUCKET_KEY) throw new Error("Missing APS_BUCKET_KEY");
    return this.env.APS_BUCKET_KEY.toLowerCase();
  }
}

async function readApsJson(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new Error(`APS request failed (${response.status}): ${payload.developerMessage || payload.reason || payload.message || payload.error || response.statusText}`);
  return payload;
}
