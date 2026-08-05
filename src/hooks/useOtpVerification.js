import { useState, useCallback, useEffect, useRef } from "react";

export const useOtpVerification = ({
  length,
  sendOtp,
  verifyOtp,
  validate,
}) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const [verified, setVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(60);
  const timerRef = useRef(null);

  useEffect(() => {
    if (otpSent && resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [otpSent, resendTimer]);

  const handleSendOtp = useCallback(
    async (value) => {
      setError(null);
      if (validate) {
        const validationError = validate(value);
        if (validationError) {
          setError(validationError);
          throw new Error(validationError);
        }
      }

      setSending(true);
      try {
        const response = await sendOtp(value);
        setOtpSent(true);
        setResendDisabled(true);
        setResendTimer(60);
        return response;
      } catch (err) {
        setError(err.message || "Failed to send OTP");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [sendOtp, validate],
  );

  const handleVerifyOtp = useCallback(
    async (value) => {
      setError(null);
      const otpValue = otp.join("");

      if (otpValue.length !== length) {
        setError(`Please enter all ${length} digits`);
        throw new Error("Incomplete OTP");
      }

      setVerifying(true);
      try {
        const response = await verifyOtp(value, otpValue);

        if (response?.status === 1) {
          setVerified(true);
          setToken(response.token || null);
        }

        return response;
      } catch (err) {
        setError(err.message || "Failed to verify OTP");
        throw err;
      } finally {
        setVerifying(false);
      }
    },
    [otp, length, verifyOtp],
  );

  const handleOtpChange = useCallback(
    (index, value) => {
      if (/^\d*$/.test(value)) {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
      }
    },
    [otp],
  );

  const resetOtp = useCallback(() => {
    setOtp(Array(length).fill(""));
    setVerified(false);
    setOtpSent(false);
    setToken(null);
    setError(null);
    setResendDisabled(true);
    setResendTimer(60);
  }, [length]);

  return {
    otp,
    setOtp,
    verified,
    otpSent,
    token,
    loading,
    sending,
    verifying,
    error,
    resendDisabled,
    resendTimer,
    handleSendOtp,
    handleVerifyOtp,
    handleOtpChange,
    resetOtp,
  };
};
