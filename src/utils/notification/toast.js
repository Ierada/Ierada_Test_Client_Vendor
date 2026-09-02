import React from "react";
import { toast } from "react-toastify";
import { wasAuthSessionEndedRecently } from "../authSession";

const baseConfig = {
  position: "top-right",
  autoClose: 4200,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: "ierada-toast",
};

const TONE = {
  success: {
    icon: "✓",
    iconBg: "#dcfce7",
    iconColor: "#15803d",
    border: "#22c55e",
    progress: "#22c55e",
    title: "#14532d",
    body: "#166534",
    bg: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 70%)",
    method: toast.success,
    fallbackTitle: "Success",
  },
  error: {
    icon: "!",
    iconBg: "#fee2e2",
    iconColor: "#b91c1c",
    border: "#ef4444",
    progress: "#ef4444",
    title: "#7f1d1d",
    body: "#991b1b",
    bg: "linear-gradient(135deg, #fef2f2 0%, #ffffff 70%)",
    method: toast.error,
    fallbackTitle: "Something went wrong",
  },
  warning: {
    icon: "!",
    iconBg: "#fef3c7",
    iconColor: "#b45309",
    border: "#f59e0b",
    progress: "#f59e0b",
    title: "#78350f",
    body: "#92400e",
    bg: "linear-gradient(135deg, #fffbeb 0%, #ffffff 70%)",
    method: toast.warning,
    fallbackTitle: "Please check",
  },
  info: {
    icon: "i",
    iconBg: "#e0f2fe",
    iconColor: "#0369a1",
    border: "#0ea5e9",
    progress: "#0ea5e9",
    title: "#0c4a6e",
    body: "#075985",
    bg: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 70%)",
    method: toast.info,
    fallbackTitle: "Info",
  },
};

function ToastCard({ tone, title, message }) {
  const t = TONE[tone] || TONE.info;
  return React.createElement(
    "div",
    { style: { display: "flex", gap: 12, alignItems: "flex-start" } },
    React.createElement(
      "div",
      {
        style: {
          width: 28,
          height: 28,
          borderRadius: 999,
          background: t.iconBg,
          color: t.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        },
      },
      t.icon,
    ),
    React.createElement(
      "div",
      { style: { minWidth: 0 } },
      title
        ? React.createElement(
            "div",
            {
              style: {
                fontWeight: 700,
                fontSize: 13,
                color: t.title,
                marginBottom: message ? 2 : 0,
                lineHeight: 1.3,
              },
            },
            title,
          )
        : null,
      message
        ? React.createElement(
            "div",
            {
              style: {
                fontSize: 12.5,
                color: t.body,
                lineHeight: 1.45,
                whiteSpace: "pre-wrap",
              },
            },
            message,
          )
        : null,
    ),
  );
}

function normalizePayload(input, fallbackTitle) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return {
      title: input.title || fallbackTitle,
      message: input.message || input.msg || "",
    };
  }
  return { title: fallbackTitle, message: String(input || "") };
}

function showToast(tone, input) {
  const cfg = TONE[tone] || TONE.info;
  const { title, message } = normalizePayload(input, cfg.fallbackTitle);
  cfg.method(React.createElement(ToastCard, { tone, title, message }), {
    ...baseConfig,
    style: {
      background: cfg.bg,
      borderLeft: `4px solid ${cfg.border}`,
      borderRadius: 14,
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
      padding: "12px 14px",
      minHeight: 64,
    },
    progressStyle: { background: cfg.progress },
  });
}

export const notifyOnSuccess = (message) => showToast("success", message);

export const notifyOnFail = (message) => {
  if (wasAuthSessionEndedRecently()) return;
  showToast("error", message);
};

export const notifyOnWarning = (message) => showToast("warning", message);

export const notifyInfo = (message) => showToast("info", message);
