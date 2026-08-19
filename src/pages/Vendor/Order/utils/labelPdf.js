export const saveShippingLabel = (apiData) => {
  const url = apiData?.shippingLabelUrl;
  if (!url) return null;
  window.open(url, "_blank", "noopener,noreferrer");
  return "url";
};
