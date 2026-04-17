import React, { useState, useEffect, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { vendorLogin } from "../../../services/api.auth";
import PasswordResetModal from "../../../components/Vendor/Models/PasswordResetModal";
import config from "../../../config/config";
import { useAppContext } from "../../../context/AppContext";
import { setUserCookie } from "../../../utils/userIdentifier";
import {
  notifyOnFail,
  notifyOnWarning,
} from "../../../utils/notification/toast";
import { getSettings } from "../../../services/api.settings";

const OtpInput = React.memo(
  ({ otp, handleOtpChange, handleOtpKeyDown, otpRefs }) => {
    const handleFocus = (input) => {};

    return (
      <div className="flex justify-between gap-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (otpRefs.current[index] = el)}
            type="text"
            value={digit}
            onChange={(e) => handleOtpChange(e.target.value, index)}
            onKeyDown={(e) => handleOtpKeyDown(e, index)}
            onFocus={(e) => handleFocus(e.target)}
            className="w-14 h-14 text-center border rounded-lg focus:ring-2 focus:ring-black text-xl font-semibold"
            maxLength={1}
          />
        ))}
      </div>
    );
  },
);

const OtpTimer = React.memo(
  ({ timerState, isLoading, handleResendOtp, formatCountdown }) => {
    return (
      <div className="flex justify-between text-sm">
        <button
          disabled={isLoading || timerState.isResendDisabled}
          onClick={handleResendOtp}
          className={`${
            timerState.isResendDisabled ? "text-gray-400" : "text-gray-900"
          }`}
        >
          Resend OTP{" "}
          {timerState.isResendDisabled ? `(${formatCountdown()})` : ""}
        </button>
      </div>
    );
  },
);

const TwoFAModal = ({ isOpen, onClose, formData, twoFactorType }) => {
  const [otp, setOtp] = useState(
    twoFactorType === "otp" || twoFactorType === ""
      ? ["", "", "", ""]
      : ["", "", "", "", "", ""],
  );
  const [timerState, setTimerState] = useState({
    countdown: 60,
    isResendDisabled: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const otpRefs = useRef([]);
  const { setUser } = useAppContext();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const startOtpTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setTimerState({
      countdown: 60,
      isResendDisabled: true,
    });

    timerRef.current = setInterval(() => {
      setTimerState((prevState) => {
        if (prevState.countdown <= 1) {
          clearInterval(timerRef.current);
          return {
            countdown: 0,
            isResendDisabled: false,
          };
        }
        return {
          ...prevState,
          countdown: prevState.countdown - 1,
        };
      });
    }, 1000);
  }, []);

  const formatCountdown = useCallback(() => {
    return `00:${
      timerState.countdown < 10
        ? "0" + timerState.countdown
        : timerState.countdown
    }`;
  }, [timerState.countdown]);

  const handleVerify2FA = useCallback(
    async (code) => {
      if (!formData.email || !formData.password) {
        setErrors({ two_factor: "Email or password is missing" });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await vendorLogin({
          email: formData.email,
          password: formData.password,
          two_factor_code: code,
        });

        if (res.status === 1) {
          setUserCookie(res.token, res.data, "vendor");
          setUser(res.data);
          navigate("/dashboard");
        } else {
          setErrors({ two_factor: res.message || "Invalid 2FA code" });
        }
      } catch (error) {
        setErrors({
          two_factor:
            error.response?.data?.message || "Failed to verify 2FA code",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, setUser, navigate],
  );

  const handleOtpChange = useCallback(
    (value, index) => {
      if (/^\d*$/.test(value)) {
        setOtp((prevOtp) => {
          const newOtp = [...prevOtp];
          if (value.length > 1) {
            const digits = value.split("");
            for (let i = 0; i < digits.length; i++) {
              if (index + i < newOtp.length) {
                newOtp[index + i] = digits[i];
              }
            }
            const nextIndex = Math.min(
              index + digits.length,
              newOtp.length - 1,
            );
            setTimeout(() => {
              otpRefs.current[nextIndex]?.focus();
              if (
                nextIndex === newOtp.length - 1 &&
                digits.length === newOtp.length
              ) {
                const otpCode = newOtp.join("");
                handleVerify2FA(otpCode);
              }
            }, 0);
            return newOtp;
          } else {
            newOtp[index] = value;
            if (value && index < newOtp.length - 1) {
              setTimeout(() => {
                otpRefs.current[index + 1]?.focus();
              }, 0);
            }
            if (value && index === newOtp.length - 1) {
              const otpCode = newOtp.join("");
              setTimeout(() => {
                handleVerify2FA(otpCode);
              }, 100);
            }
            return newOtp;
          }
        });
      }
    },
    [handleVerify2FA],
  );

  const handleOtpKeyDown = useCallback(
    (e, index) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        setOtp((prevOtp) => {
          const newOtp = [...prevOtp];
          newOtp[index - 1] = "";
          return newOtp;
        });
        setTimeout(() => {
          otpRefs.current[index - 1]?.focus();
        }, 0);
      }
    },
    [otp],
  );

  const handleResendOtp = useCallback(async () => {
    if (!formData.email || !formData.password) {
      setErrors({ two_factor: "Email or password is missing" });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setOtp(
      twoFactorType === "otp" ? ["", "", "", ""] : ["", "", "", "", "", ""],
    );

    try {
      const res = await vendorLogin({
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 2) {
        startOtpTimer();
      } else {
        setErrors({ two_factor: res.message || "Failed to send OTP" });
      }
    } catch (error) {
      setErrors({
        two_factor: error.response?.data?.message || "Failed to send OTP",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, startOtpTimer, twoFactorType]);

  useEffect(() => {
    if (isOpen && twoFactorType === "otp") {
      startOtpTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, twoFactorType, startOtpTimer]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold">
              {twoFactorType === "otp" ? "Enter OTP" : "Enter 2FA Code"}
            </h2>
            <p className="text-base text-gray-600">
              {twoFactorType === "otp"
                ? `OTP sent to ${formData.email || "your email"}`
                : "Enter the code from Google Authenticator"}
            </p>
          </div>

          <OtpInput
            otp={otp}
            handleOtpChange={handleOtpChange}
            handleOtpKeyDown={handleOtpKeyDown}
            otpRefs={otpRefs}
          />

          {twoFactorType === "otp" && (
            <OtpTimer
              timerState={timerState}
              isLoading={isLoading}
              handleResendOtp={handleResendOtp}
              formatCountdown={formatCountdown}
            />
          )}

          {errors.two_factor && (
            <p className="text-red-500 text-sm text-center">
              {errors.two_factor}
            </p>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setOtp(
                  twoFactorType === "otp"
                    ? ["", "", "", ""]
                    : ["", "", "", "", "", ""],
                );
                setErrors({});
                onClose();
              }}
              className="w-1/2 border border-gray-300 text-gray-700 py-3 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => handleVerify2FA(otp.join(""))}
              disabled={otp.some((digit) => !digit) || isLoading}
              className="w-1/2 bg-[#737A6C] text-white py-3 rounded-lg disabled:bg-gray-300"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorSignIn = () => {
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showTwoFAModal, setShowTwoFAModal] = useState(false);
  const [twoFactorType, setTwoFactorType] = useState("");
  const { setUser } = useAppContext();
  const [settingsData, setSettingsData] = useState({});
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "visible";
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await getSettings();
      if (response.status === 1) {
        setSettingsData(response.data);
      }
    } catch (error) {
      notifyOnFail("Error fetching settings");
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleSignIn = useCallback(
    async (e) => {
      e.preventDefault();

      if (!formData.email || !formData.password) {
        notifyOnWarning("Please fill all required fields");
        return;
      }

      try {
        setLoading(true);
        const res = await vendorLogin({
          email: formData.email,
          password: formData.password,
        });

        if (res.status === 1) {
          setUserCookie(res.token, res.data, "vendor");
          setUser(res.data);
          const decoded = jwtDecode(res.token);
          navigate("/dashboard");
        } else if (res.status === 2) {
          setTwoFactorType(res.two_factor_type || "otp");
          setShowTwoFAModal(true);
        } else {
          notifyOnFail(res.message || "Invalid email or password");
        }
      } catch (error) {
        console.error("Login error:", error);
        notifyOnFail("An error occurred during login, please try again.");
      } finally {
        setLoading(false);
      }
    },
    [formData, setUser, navigate],
  );

  return (
    <div className="min-h-screen bg-[white]">
      <div className="container mx-auto flex min-h-screen items-center justify-center">
        <div className="w-full max-w-[1200px] bg-white shadow-xl">
          <div className="flex flex-col lg:flex-row lg:justify-center border">
            <div className="relative hidden w-full lg:block lg:w-1/2">
              {!isImageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                  <div className="w-16 h-16 border-4 border-t-4 border-gray-400 border-solid rounded-full animate-spin border-t-[#000000]"></div>
                </div>
              )}
              <img
                src={settingsData?.vendor_login_banner}
                alt="Vendor Login Banner"
                className={`w-full h-full ${
                  isImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                onError={() => setIsImageLoaded(true)}
              />
            </div>

            <div className="w-full lg:w-1/2 p-20">
              <div className="max-w-md mx-auto">
                <h2 className="text-3xl text-[black] mb-12">Sign In</h2>

                <form className="space-y-6" onSubmit={handleSignIn}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email*
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-[#6B705C] focus:outline-none"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password*
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Password"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800 focus:border-[#6B705C] focus:outline-none"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
                          <svg
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-5 w-5 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    By proceeding, you agree to our{" "}
                    <a
                      href={settingsData?.seller_terms_condition_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Terms and Conditions
                    </a>
                    .
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[#0164CE] py-3 px-12 text-sm font-medium text-white hover:bg-[#0148A4] focus:outline-none focus:ring-2 focus:ring-[#6B705C] focus:ring-offset-2 disabled:bg-gray-400"
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </button>
                  <div className="flex flex-row-reverse items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setIsPasswordModalOpen(true)}
                      className="text-sm font-medium text-[black] hover:text-[#6B705C]"
                    >
                      Forgot password?
                    </button>

                    <button
                      onClick={() =>
                        window.open(
                          `${config.VITE_BASE_WEBSITE_URL}/become-a-seller`,
                          "_blank",
                        )
                      }
                      className="text-sm font-medium text-[black] hover:text-[#6B705C]"
                    >
                      Sign-Up as a Selling Partner
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PasswordResetModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
      <TwoFAModal
        isOpen={showTwoFAModal}
        onClose={() => setShowTwoFAModal(false)}
        formData={formData}
        twoFactorType={twoFactorType}
      />
    </div>
  );
};

export default VendorSignIn;
