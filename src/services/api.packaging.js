import apiClient from "../axios.config";

function unwrap(res) {
  const body = res?.data;
  if (!body || body.status !== 1) {
    const err = new Error(body?.message || "Could not complete that packaging request");
    err.refunded = Boolean(body?.refunded);
    throw err;
  }
  return body;
}

function messageFrom(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

export async function packagingShop() {
  try {
    return unwrap(await apiClient.get("/packaging/shop"));
  } catch (error) {
    throw new Error(messageFrom(error, "Could not load packaging"));
  }
}

export async function packagingCheckout(payload) {
  try {
    return unwrap(await apiClient.post("/packaging/checkout", payload));
  } catch (error) {
    throw new Error(messageFrom(error, "Could not start payment"));
  }
}

export async function packagingVerify(payload) {
  try {
    return unwrap(await apiClient.post("/packaging/verify", payload));
  } catch (error) {
    throw new Error(messageFrom(error, "Payment could not be confirmed"));
  }
}

export async function packagingOrders() {
  try {
    return unwrap(await apiClient.get("/packaging/orders"));
  } catch (error) {
    throw new Error(messageFrom(error, "Could not load your packaging orders"));
  }
}

export async function packagingOrder(id) {
  try {
    return unwrap(await apiClient.get(`/packaging/orders/${id}`));
  } catch (error) {
    throw new Error(messageFrom(error, "Could not load that packaging order"));
  }
}

export async function packagingReceived(id) {
  try {
    return unwrap(await apiClient.post(`/packaging/orders/${id}/received`));
  } catch (error) {
    throw new Error(messageFrom(error, "Could not mark this order received"));
  }
}

export async function packagingQuery(id, form) {
  try {
    return unwrap(await apiClient.post(`/packaging/orders/${id}/query`, form));
  } catch (error) {
    throw new Error(messageFrom(error, "Could not send that query"));
  }
}

export function packagingImageSrc(file) {
  if (!file) return "";
  const base = String(import.meta.env.VITE_API_URL || "").replace(/\/?$/, "/");
  return `${base}assets/packaging/${encodeURIComponent(file)}`;
}

export async function packagingPhotoUrl(file) {
  if (!file) return "";
  const res = await apiClient.get(`/packaging/media/${encodeURIComponent(file)}`, { responseType: "blob" });
  return URL.createObjectURL(res.data);
}
