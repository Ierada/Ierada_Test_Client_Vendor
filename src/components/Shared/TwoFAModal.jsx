import React, { useState, useEffect, useRef, useCallback } from "react";
import { vendorLogin } from "../../services/api.auth";
import { setUserCookie } from "../../utils/userIdentifier";
import { toast } from "react-toastify";

const TwoFAModal = ({ isOpen, onClose, formData, twoFactorType, onSuccess }) => {
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
      if (isLoading) return;

      if (!formData.email || !formData.password) {
        setErrors({ two_factor: "Email or password is missing" });
        return;
      }

      if (!code || code.length !== otp.length) {
        return;
      }

      setIsLoading(true);
      setErrors({});
      try {
        const res = await vendorLogin({
          email: formData.email,
          password: formData.password,
          role: "vendor",
          two_factor_code: code,
        });

        if (res.status === 1) {
          if (!res.token) {
            setErrors({
              two_factor:
                "2FA succeeded but session token is missing. Please try again.",
            });
            return;
          }

          toast.success("2FA verified successfully!");

          if (typeof onSuccess === "function") {
            onSuccess(res.token, res.data);
            return;
          }

          // Fallback when caller does not pass onSuccess (cookie + hard nav).
          setUserCookie(res.token, res.data, "vendor");
          if (res.data) {
            localStorage.setItem("user", JSON.stringify(res.data));
          }
          window.location.replace("/dashboard");
        } else {
          const message = res.message || "Invalid 2FA code";
          setErrors({ two_factor: message });
          toast.error(message);
          setOtp(
            twoFactorType === "otp" || twoFactorType === ""
              ? ["", "", "", ""]
              : ["", "", "", "", "", ""],
          );
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to verify 2FA code";
        setErrors({ two_factor: message });
        toast.error(message);
        setOtp(
          twoFactorType === "otp" || twoFactorType === ""
            ? ["", "", "", ""]
            : ["", "", "", "", "", ""],
        );
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onSuccess, isLoading, otp.length, twoFactorType],
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
            if (value && index === newOtp.length - 1 && newOtp.every((d) => d !== "")) {
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
        role: "vendor",
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

          <div className="flex justify-between gap-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, index)}
                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                className="w-14 h-14 text-center border rounded-lg focus:ring-2 focus:ring-black text-xl font-semibold"
                maxLength={1}
              />
            ))}
          </div>

          {errors.two_factor && (
            <div className="text-red-600 text-sm text-center">
              {errors.two_factor}
            </div>
          )}

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

          <button
            onClick={onClose}
            className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFAModal;
