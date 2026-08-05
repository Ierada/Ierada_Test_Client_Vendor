import React, { useState, useEffect, useRef } from "react";
import {
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  Loader2,
  Key,
  ShieldCheck,
} from "lucide-react";
import { SellerFormContainer, SellerLeftPanel, SellerRightPanel } from "../../../components/Shared/SellerFormContainer";
import {
  vendorSendResetOTP,
  vendorVerifyResetOTP,
  vendorResetPassword,
  vendorResendResetOTP,
} from "../../../services/api.auth";
import { toast } from "react-toastify";

const RULES = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  {
    label: "One special character",
    test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
  },
];

export default function ResetPasswordPage() {
  const [step, setStep] = useState(1); // 1: Identifier, 2: OTP, 3: New Password
  const [identifier, setIdentifier] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [counter, setCounter] = useState(60);
  const [resetToken, setResetToken] = useState(""); // Store reset token from step 2

  const otpRefs = useRef([]);

  useEffect(() => {
    if (step === 2 && counter > 0) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [counter, step]);

  const identifierType = identifier
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
      ? "email"
      : /^\d{10}$/.test(identifier)
        ? "mobile"
        : ""
    : "";

  const rulesPassed = RULES.every((rule) => rule.test(newPassword));
  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValid = rulesPassed && passwordsMatch;

  // Step 1: Send OTP
  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    if (identifierType === "") return;
    setError("");
    setIsSendingOTP(true);

    try {
      const response = await vendorSendResetOTP(identifier);

      if (response.status === 1) {
        setStep(2);
        setCounter(60);
        toast.success(
          `OTP sent to your ${identifierType === "email" ? "email" : "mobile number"}`,
        );
        // Reset OTP inputs
        setOtpDigits(["", "", "", ""]);
        // Focus on first OTP input after state update
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(response.message || `Failed to send OTP to ${identifierType}`);
      }
    } catch (err) {
      setError(err?.message || `Failed to send OTP to ${identifierType}`);
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const next = [...otpDigits];
      next[index] = value;
      setOtpDigits(next);

      if (value && index < 3) {
        otpRefs.current[index + 1]?.focus();
      } else if (!value && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste for OTP
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtpDigits(digits);
      // Auto submit after paste
      setTimeout(() => {
        const form = e.currentTarget.closest("form");
        if (form) form.requestSubmit();
      }, 100);
    }
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otpDigits.join("");
    if (otpValue.length < 4) {
      setError("Please enter the complete 4-digit OTP");
      return;
    }
    setError("");
    setIsVerifyingOTP(true);

    try {
      const response = await vendorVerifyResetOTP(identifier, otpValue);

      if (response.status === 1) {
        // Store the reset token
        setResetToken(response.data.resetToken);
        setEmail(identifier);
        setStep(3);
        toast.success("Verification successful! Please set your new password.");
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err?.message || "Invalid OTP");
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Step 3: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError("Please meet all password requirements");
      return;
    }
    if (!resetToken) {
      setError("Session expired. Please start over.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await vendorResetPassword(
        resetToken,
        newPassword,
        confirmPassword,
      );

      if (response.status === 1) {
        toast.success(
          "Password changed successfully! Please login with your new password.",
        );
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setError(response.message || "Failed to reset password");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reset password",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    if (counter > 0) return;
    setError("");
    setOtpDigits(["", "", "", ""]);
    setIsSendingOTP(true);

    try {
      const response = await vendorResendResetOTP(identifier);

      if (response.status === 1) {
        setCounter(60);
        toast.success(`New OTP sent to your ${identifierType}`);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(response.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err?.message || "Failed to resend OTP");
    } finally {
      setIsSendingOTP(false);
    }
  };

  return (
    <SellerFormContainer containerHeight="lg:h-[900px]">
      <SellerLeftPanel className="px-6 py-12 lg:pl-14 lg:pr-20 lg:pt-20">
        <div className="w-full max-w-[434px] flex flex-col gap-8">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-sm font-medium rounded-2xl border border-red-100 font-lato">
              {error}
            </div>
          )}

          {/* Step 1: Identifier Input */}
          {step === 1 && (
            <>
              <div className="flex flex-col gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-2">
                  <Key className="h-6 w-6" />
                </div>
                <h1 className="text-[32px] font-bold leading-10.5 text-[#1C1D21] font-lato">
                  Reset Password
                </h1>
                <p className="text-[14px] leading-5.25 text-[#8181A5] font-lato font-normal">
                  Enter your mobile number to reset your seller account password.
                </p>
              </div>

              <form
                onSubmit={handleIdentifierSubmit}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-normal leading-5 text-[#8181A5] font-lato">
                    Mobile Number*
                  </label>
                  <input
                    type="text"
                    placeholder="Enter 10-digit mobile number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.trim())}
                    className="h-11 border-[#ECECF2] rounded-[10px] text-[#1C1D21] placeholder:text-[#C4C4D4] focus-visible:ring-[#FF6B36]/25 focus-visible:border-[#FF6B36] font-lato text-[14px] outline-none px-4"
                    autoFocus
                  />
                  {identifier && !identifierType && (
                    <p className="text-red-500 text-xs font-medium pl-1 font-lato">
                      Please enter a valid 10-digit mobile number
                    </p>
                  )}
                  {identifierType === "mobile" && (
                    <p className="text-green-600 text-xs font-semibold pl-1 font-lato">
                      We'll send an OTP to this mobile number.
                    </p>
                  )}
                  {identifierType === "email" && (
                    <p className="text-amber-600 text-xs font-semibold pl-1 font-lato">
                      Please use mobile number for vendor password reset.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={identifierType !== "mobile" || isSendingOTP}
                  className="w-full h-11.5 mt-2 bg-[#FF6B36] hover:bg-[#e05928] active:bg-[#c94b1f] rounded-[10px] text-white font-bold text-[14px] font-lato transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#FF6B36]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingOTP ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-2 text-[14px] text-gray-600 font-lato">
                <span>Remember your password?</span>
                <span
                  onClick={() => (window.location.href = "/login")}
                  className="font-semibold text-[#1C1D21] hover:underline cursor-pointer"
                >
                  Sign in
                </span>
              </div>
            </>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <>
              <div className="flex flex-col gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-2">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h1 className="text-[32px] font-bold leading-10.5 text-[#1C1D21] font-lato">
                  Verify OTP
                </h1>
                <p className="text-[14px] leading-5.25 text-[#8181A5] font-lato font-normal">
                  We sent a 4-digit code to{" "}
                  <span className="font-semibold text-slate-700">
                    +91 {identifier}
                  </span>
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1C1D21] font-lato">
                    Enter OTP
                  </label>
                  <div className="flex justify-between gap-2">
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onPaste={handleOtpPaste}
                        className="w-12 h-12 text-center border border-[#ECECF2] rounded-lg focus:ring-2 focus:ring-[#FF6B36]/25 focus:border-[#FF6B36] outline-none text-xl font-semibold"
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={resendOTP}
                    disabled={counter > 0 || isSendingOTP}
                    className={`text-sm font-lato ${
                      counter > 0
                        ? "text-slate-400 cursor-not-allowed"
                        : "text-[#FF6B36] hover:text-[#e05928] cursor-pointer"
                    }`}
                  >
                    {isSendingOTP ? "Sending..." : "Resend OTP"}
                  </button>
                  {counter > 0 && (
                    <span className="text-slate-500 font-medium">
                      {`${Math.floor(counter / 60)}:${(counter % 60)
                        .toString()
                        .padStart(2, "0")}`}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otpDigits.some((d) => !d) || isVerifyingOTP}
                  className="w-full h-11.5 mt-2 bg-[#FF6B36] hover:bg-[#e05928] active:bg-[#c94b1f] rounded-[10px] text-white font-bold text-[14px] font-lato transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#FF6B36]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingOTP ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => setStep(1)}
                className="text-sm text-[#1C1D21] hover:underline font-lato"
              >
                Change mobile number/email
              </button>
            </>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <>
              <div className="flex flex-col gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-2">
                  <Key className="h-6 w-6" />
                </div>
                <h1 className="text-[32px] font-bold leading-10.5 text-[#1C1D21] font-lato">
                  Set New Password
                </h1>
                <p className="text-[14px] leading-5.25 text-[#8181A5] font-lato font-normal">
                  Create a strong, secure password for{" "}
                  <span className="font-semibold text-slate-700">
                    +91 {identifier}
                  </span>
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1C1D21] font-lato">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-4 pr-12 border-[#ECECF2] rounded-[10px] text-[#1C1D21] placeholder:text-[#C4C4D4] focus-visible:ring-[#FF6B36]/25 focus-visible:border-[#FF6B36] font-lato text-[14px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Rules */}
                <div className="space-y-2">
                  {RULES.map((rule, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {rule.test(newPassword) ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={rule.test(newPassword) ? "text-green-600" : "text-gray-500"}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1C1D21] font-lato">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 px-4 pr-12 border-[#ECECF2] rounded-[10px] text-[#1C1D21] placeholder:text-[#C4C4D4] focus-visible:ring-[#FF6B36]/25 focus-visible:border-[#FF6B36] font-lato text-[14px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2 text-sm">
                      {passwordsMatch ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <span className={passwordsMatch ? "text-green-600" : "text-red-600"}>
                        {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid}
                  className="w-full h-11.5 mt-2 bg-[#FF6B36] hover:bg-[#e05928] active:bg-[#c94b1f] rounded-[10px] text-white font-bold text-[14px] font-lato transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-[#FF6B36]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Resetting...</span>
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </SellerLeftPanel>

      <SellerRightPanel
        heroImageSrc="/assets/signin_page/Signin_Img.png"
        heroImageAlt="Password Reset Illustration"
        rightSectionBgColor="bg-[#1C1D21]"
        showVectorDeco={true}
      />
    </SellerFormContainer>
  );
}
