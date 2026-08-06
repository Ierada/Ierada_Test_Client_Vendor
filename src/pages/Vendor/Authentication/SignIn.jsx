

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { CheckCircle2, Eye, EyeOff, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";

import {
  vendorLogin,
  vendorMobileOtpLogin,
  vendorMobileOtpSend,
} from "../../../services/api.auth";
import { setUserCookie } from "../../../utils/userIdentifier";
import { useOtpVerification } from "../../../hooks/useOtpVerification";

import { SellerFormContainer, SellerLeftPanel, SellerRightPanel } from "../../../components/Shared/SellerFormContainer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../components/Shared/Tabs";
import TwoFAModal from "../../../components/Shared/TwoFAModal";

// Define validation schemas
const emailSchema = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Please enter a valid email address",
  password: (value) => value.length >= 1 ? null : "Password is required",
};

const mobileSchema = {
  mobile: (value) => /^\d{10}$/.test(value) ? null : "Please enter a valid mobile number",
};

export default function SellerLoginPage() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState("mobile");

  // Visibility toggle state for password
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Form state
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [mobileForm, setMobileForm] = useState({ mobile: "" });
  const [errors, setErrors] = useState({});

  // Mobile OTP Hook
  const mobileOtp = useOtpVerification({
    length: 6,
    sendOtp: (value) => vendorMobileOtpSend(value),
    verifyOtp: (value, otp) => vendorMobileOtpLogin(value, otp),
    validate: (value) =>
      !/^\d{10}$/.test(value)
        ? "Please enter a valid 10-digit mobile number"
        : null,
  });

  // Detect mobile number changes and reset OTP state if needed
  useEffect(() => {
    if (mobileForm.mobile) {
      mobileOtp.handleValueChange(mobileForm.mobile);
    }
  }, [mobileForm.mobile, mobileOtp.handleValueChange]);

  // Handle Email Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const emailError = emailSchema.email(emailForm.email);
    const passwordError = emailSchema.password(emailForm.password);
    
    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
      });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await vendorLogin({
        email: emailForm.email,
        password: emailForm.password,
        role: "vendor",
      });

      if (response?.status === 1) {
        toast.success("Welcome back! Login successful.");
        setUserCookie(response.token, response.data, "vendor");
        navigate("/dashboard");
      } else if (response?.status === 2) {
        setEmail(emailForm.email);
        setPassword(emailForm.password);
        setShowTwoFAModal(true);
      } else {
        toast.error(response?.message || "Invalid email or password");
      }
    } catch (error) {
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    const cleanMobile = mobileForm.mobile.replace(/[^0-9+]/g, "");
    try {
      const response = await mobileOtp.handleSendOtp(cleanMobile);
      
      // Check if the response indicates an error
      if (response?.status === 0) {
        toast.error(response?.message || "Vendor not found or not approved");
        return;
      }
      
      // Only show success if OTP was actually sent
      if (response?.status === 1) {
        toast.success("OTP sent to your registered mobile number!");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to send OTP");
    }
  };

  // Handle Mobile Submit (Login to Dashboard)
  const handleMobileSubmit = () => {
    if (!mobileOtp.verified) {
      toast.error("Please verify your OTP first");
      return;
    }

    toast.success("Login successful!");

    // Use token from the hook response
    const token =
      mobileOtp.token ||
      document.cookie.match(/IERADAFASHIONVendorToken=([^;]+)/)?.[1];
    navigate(`/dashboard?token=${token || ""}`);
  };

  // Handle 2FA verification from modal
  const handleTwoFAVerify = async (twoFactorCode) => {
    try {
      const res = await vendorLogin({
        email: email,
        password: password,
        role: "vendor",
        two_factor_code: twoFactorCode,
      });

      if (res.status === 1) {
        toast.success("2FA verified successfully!");
        setUserCookie(res.token, res.data, "vendor");
        window.location.href = "/dashboard";
      } else {
        toast.error(res.message || "Invalid 2FA code");
      }
    } catch (error) {
      console.error("2FA error:", error);
      toast.error("2FA verification failed");
    }
  };

  const handleOtpInputChange = (index, value) => {
    mobileOtp.handleOtpChange(index, value);
  };

  return (
    <SellerFormContainer containerHeight="lg:h-[900px]">
      <SellerLeftPanel className="px-6 py-12 lg:pl-14 lg:pr-20 lg:pt-20">
        <div className="w-full max-w-[434px] flex flex-col gap-10">
          {/* Tabs Container */}
          <Tabs
            value={authMethod}
            onValueChange={setAuthMethod}
            className="w-full flex flex-col gap-20"
          >
            {/* Sign-in Method Toggle */}
            <TabsList className="w-full h-12 bg-[#F5F6F8] border border-[#ECECF2] rounded-[12px] p-1 flex flex-row gap-1 select-none">
              <TabsTrigger
                value="email"
                className="flex-1 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer font-lato text-[14px] font-semibold text-[#8181A5] bg-transparent border-none focus-visible:outline-none"
              >
                Email
              </TabsTrigger>
              <TabsTrigger
                value="mobile"
                className="flex-1 h-10 rounded-[8px] flex items-center justify-center transition-all cursor-pointer font-lato text-[14px] font-semibold text-[#8181A5] bg-transparent border-none focus-visible:outline-none"
              >
                Mobile Number
              </TabsTrigger>
            </TabsList>

            {/* Welcome message group */}
            <div className="flex flex-col gap-3">
              <h1 className="text-[32px] font-bold leading-10.5 text-[#1C1D21] font-lato">
                Welcome Back!
              </h1>
              <p className="text-[14px] leading-5.25 text-[#8181A5] font-lato font-normal">
                Please enter your credentials to access your seller account.
              </p>
            </div>

            {/* Email Form Content */}
            <TabsContent value="email" className="flex flex-col gap-6">
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-5">
                {/* Email Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1C1D21] font-lato">
                    Email ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      placeholder="e.g. seller@acme.com"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                      className="w-full h-11 pl-12 pr-4 border-[#ECECF2] rounded-[10px] text-[#1C1D21] placeholder:text-[#C4C4D4] focus-visible:ring-[#FF6B36]/25 focus-visible:border-[#FF6B36] font-lato text-[14px] outline-none"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1C1D21] font-lato">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={emailForm.password}
                      onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                      className="w-full h-11 pl-12 pr-12 border-[#ECECF2] rounded-[10px] text-[#1C1D21] placeholder:text-[#C4C4D4] focus-visible:ring-[#FF6B36]/25 focus-visible:border-[#FF6B36] font-lato text-[14px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end mt-1">
                  <span
                    onClick={() => (window.location.href = "/forgot-password")}
                    className="text-[13px] font-semibold text-[#FF6B36] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11.5 mt-6 bg-[#FF6B36] hover:bg-[#e05928] active:bg-[#c94b1f] rounded-[10px] text-white font-bold text-[14px] font-lato transition-all flex items-center justify-center cursor-pointer shadow-sm shadow-[#FF6B36]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>
            </TabsContent>

            {/* Mobile Form Content */}
            <TabsContent value="mobile" className="flex flex-col gap-6">
              <div className="flex flex-col gap-5">
                {/* Mobile Field */}
                <div className="flex flex-row items-end gap-3 w-full">
                  <div className="flex-1">
                    <div className="flex flex-col gap-2">
                      <label className="text-[14px] font-semibold text-[#1C1D21] font-lato">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="tel"
                          placeholder="Enter the Mobile Number"
                          value={mobileForm.mobile}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setMobileForm({ mobile: value });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !mobileOtp.otpSent && mobileForm.mobile.length === 10) {
                              e.preventDefault();
                              handleSendOtp();
                            }
                          }}
                          className="w-full h-11 pl-12 pr-4 border-[#ECECF2] rounded-[10px] text-[#1C1D21] placeholder:text-[#C4C4D4] focus-visible:ring-[#FF6B36]/25 focus-visible:border-[#FF6B36] font-lato text-[14px] outline-none"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Send OTP Button */}
                  {!mobileOtp.otpSent && (
                    <div className="shrink-0 pb-1">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={mobileOtp.sending || mobileForm.mobile.length !== 10}
                        className="h-10 px-4 bg-[#FF6B36] hover:bg-[#e05928] rounded-[10px] text-white font-bold text-sm font-lato transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                      >
                        {mobileOtp.sending ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                  )}
                </div>

                {/* OTP Input Section */}
                {mobileOtp.otpSent && (
                  <div className="mt-1">
                    {mobileOtp.verified ? (
                      <p className="text-[12px] font-bold text-green-600 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-green-500" />{" "}
                        Mobile number verified
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {/* OTP Input Boxes */}
                        <div className="flex gap-2">
                          {mobileOtp.otp.map((digit, index) => (
                            <input
                              key={index}
                              ref={(el) => (mobileOtp.otpRefs.current[index] = el)}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => mobileOtp.handleOtpChange(e.target.value, index)}
                              onKeyDown={(e) => mobileOtp.handleOtpKeyDown(e, index)}
                              placeholder="-"
                              className="w-12 h-12 border border-[#ECECF2] rounded-[8px] text-center text-[18px] font-bold text-[#1C1D21] focus:border-[#FF6B36] focus:ring-2 focus:ring-[#FF6B36]/20 focus:outline-none transition-all"
                            />
                          ))}
                        </div>

                        {/* Verify OTP Button */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const cleanMobile = mobileForm.mobile.replace(/[^0-9+]/g, "");
                              if (mobileOtp.otp.some((d) => d === "")) {
                                toast.error("Please enter all 6 digits of the OTP");
                                return;
                              }
                              mobileOtp.handleVerifyOtp(cleanMobile);
                            }}
                            disabled={mobileOtp.verifying || mobileOtp.otp.some((d) => d === "")}
                            className="flex-1 h-10 bg-[#FF6B36] hover:bg-[#e05928] rounded-[10px] text-white font-bold text-sm font-lato transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                          >
                            {mobileOtp.verifying ? "Verifying..." : "Verify OTP"}
                          </button>
                          
                          {/* Resend link */}
                          <div className="text-[12px] text-neutral-500">
                            {mobileOtp.resendDisabled ? (
                              <span>
                                Resend in{" "}
                                <span className="font-semibold text-neutral-800">
                                  00:
                                  {mobileOtp.resendTimer < 10
                                    ? `0${mobileOtp.resendTimer}`
                                    : mobileOtp.resendTimer}
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                className="text-[#FF6B36] font-semibold hover:underline cursor-pointer"
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Login Button (shown after verification) */}
                {mobileOtp.verified && (
                  <button
                    onClick={handleMobileSubmit}
                    className="w-full h-11.5 mt-6 bg-[#FF6B36] hover:bg-[#e05928] active:bg-[#c94b1f] rounded-[10px] text-white font-bold text-[14px] font-lato transition-all flex items-center justify-center cursor-pointer shadow-sm shadow-[#FF6B36]/20"
                  >
                    Login
                  </button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Social Login Section */}
          
        </div>
      </SellerLeftPanel>

     <SellerRightPanel
        heroImageSrc="/assets/signin_page/Signin_Img.png"
        heroImageAlt="Seller Login Hero"
        rightSectionBgColor="bg-[#1C1D21]"
        showVectorDeco={true}
      />
    </SellerFormContainer>
  );
}
