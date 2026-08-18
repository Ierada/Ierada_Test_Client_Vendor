import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Phone,
  MapPin,
  Send,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getMyShipeaseStatus,
  sendMyShipeaseOtp,
  verifyMyShipeaseOtp,
} from "../../../services/api.warehouse";

const PickupVerification = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("idle"); // idle -> sent
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const res = await getMyShipeaseStatus();
    if (res?.status === 1) setStatus(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const handleSendOtp = async () => {
    setBusy(true);
    try {
      const res = await sendMyShipeaseOtp();
      if (res?.status === 1) {
        toast.success(res.message || "OTP sent");
        setStep("sent");
        setResendIn(30);
      } else {
        toast.error(res?.message || "Failed to send OTP");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.trim().length < 4) {
      toast.error("Enter the OTP sent to your phone");
      return;
    }
    setBusy(true);
    try {
      const res = await verifyMyShipeaseOtp(otp.trim());
      if (res?.status === 1) {
        toast.success(res.message || "Verified successfully");
        setOtp("");
        setStep("idle");
        loadStatus();
      } else {
        toast.error(res?.message || "Verification failed");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // Nothing pending right now — we run multiple couriers, so there's no
  // reason to call out any single one's status to the vendor.
  if (!status?.active) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Pickup Phone Verification
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        We need your pickup contact phone OTP-verified before a courier can
        pick up orders from your warehouse. This takes under a minute and you
        only need to do it once.
      </p>

      {status?.active && !status?.hasAddress && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          {status.message ||
            "Please add your shop address in your profile first."}
        </div>
      )}

      {status?.active && status?.hasAddress && status?.verified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Your pickup phone is verified
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              Your pickup point is ready. Nothing else to do here.
            </p>
          </div>
        </div>
      )}

      {status?.active && status?.hasAddress && !status?.verified && (
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                Not verified yet
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Pickup can't be scheduled from your warehouse until you
                verify this phone. Your other pickup options are unaffected.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 space-y-1.5">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{status.phone}</span>
            </p>
            <p className="text-xs text-gray-500 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              {status.address}
            </p>
          </div>

          {step === "idle" && (
            <button
              onClick={handleSendOtp}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send OTP to my phone
            </button>
          )}

          {step === "sent" && (
            <div className="space-y-3">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                autoFocus
                className="w-full text-center tracking-widest text-lg font-semibold px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              <button
                onClick={handleVerify}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Verify
              </button>
              <button
                onClick={handleSendOtp}
                disabled={busy || resendIn > 0}
                className="w-full text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed py-1"
              >
                {resendIn > 0 ? `Resend OTP in ${resendIn}s` : "Resend OTP"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PickupVerification;
