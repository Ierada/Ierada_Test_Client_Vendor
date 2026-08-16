import { toast } from "react-toastify";
import { wasAuthSessionEndedRecently } from "../authSession";

// Custom toast styling configuration
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  className: "ecommerce-toast",
};

// Success notification with custom styling
export const notifyOnSuccess = (message) => {
  toast.success(message, {
    ...toastConfig,
    style: {
      background: "#effaf5",
      color: "#257953",
      borderLeft: "4px solid #23d160",
      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
    },
    progressStyle: {
      background: "#23d160",
    },
  });
};

// Error notification with custom styling
export const notifyOnFail = (message) => {
  const text = String(message || "");
  // After DEVICE_REVOKED / password-change, leftover catch() blocks must stay silent.
  if (wasAuthSessionEndedRecently()) {
    return;
  }

  toast.error(text, {
    ...toastConfig,
    style: {
      background: "#feecf0",
      color: "#cc0f35",
      borderLeft: "4px solid #f14668",
      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
    },
    progressStyle: {
      background: "#f14668",
    },
  });
};

// Warning notification with custom styling
export const notifyOnWarning = (message) => {
  toast.warning(message, {
    ...toastConfig,
    style: {
      background: "#fff5eb",
      color: "#945600",
      borderLeft: "4px solid #ffdd57",
      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
    },
    progressStyle: {
      background: "#ffdd57",
    },
  });
};

// Info notification with custom styling
export const notifyInfo = (message) => {
  toast.info(message, {
    ...toastConfig,
    style: {
      background: "#ebf8ff",
      color: "#2b6cb0",
      borderLeft: "4px solid #3182ce",
      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.1)",
    },
    progressStyle: {
      background: "#3182ce",
    },
  });
};
