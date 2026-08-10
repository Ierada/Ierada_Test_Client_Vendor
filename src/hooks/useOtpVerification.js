import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "react-toastify";

export const useOtpVerification = ({
  length = 6,
  resendSeconds = 60,
  sendOtp,
  verifyOtp,
  validate,
}) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const [verified, setVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [token, setToken] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(resendSeconds);

  const timerRef = useRef(null);
  const otpRefs = useRef([]);
  const valueRef = useRef("");
  const verifyingRef = useRef(false);
  const autoVerifyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (autoVerifyTimeoutRef.current)
        clearTimeout(autoVerifyTimeoutRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setResendTimer(resendSeconds);
    setResendDisabled(true);

    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [resendSeconds]);

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

      valueRef.current = value;
      setSending(true);
      try {
        const response = await sendOtp(value);

        // Only proceed with OTP flow if status is 1 (success)
        if (response?.status === 1) {
          setOtpSent(true);
          setResendDisabled(true);
          setResendTimer(resendSeconds);
          setOtp(Array(length).fill(""));
          startTimer();
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }

        return response;
      } catch (err) {
        setError(err.message || "Failed to send OTP");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [sendOtp, validate, length, startTimer, resendSeconds],
  );

  const handleVerifyOtp = useCallback(
    async (otpCode) => {
      if (verifyingRef.current) {
        return;
      }

      if (verified) {
        return;
      }

      verifyingRef.current = true;
      setVerifying(true);

      try {
        const response = await verifyOtp(valueRef.current, otpCode);

        if (response?.status === 1) {
          setVerified(true);
          setToken(response.token || null);
          setResponseData(response.data || null);
          toast.success("OTP verified successfully!");
          return response;
        } else if (response?.status === 2) {
          setVerified(false);
          return response;
        } else {
          toast.error(response?.message || "Invalid OTP. Please try again.");
          setOtp(Array(length).fill(""));
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
          return response;
        }
      } catch (err) {
        toast.error("OTP verification failed. Please try again.");
        setOtp(Array(length).fill(""));
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        throw err;
      } finally {
        setVerifying(false);
        verifyingRef.current = false;
      }
    },
    [verifyOtp, length, verified],
  );

  const handleOtpChange = useCallback(
    (value, index) => {
      if (isNaN(Number(value)) && value !== "") return;

      setOtp((prev) => {
        const newOtp = [...prev];
        newOtp[index] = value.substring(value.length - 1);
        return newOtp;
      });

      // Move to next input if value is entered
      if (value && index < length - 1) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [length],
  );

  // Auto-verify when all digits are filled
  useEffect(() => {
    if (autoVerifyTimeoutRef.current) {
      clearTimeout(autoVerifyTimeoutRef.current);
      autoVerifyTimeoutRef.current = null;
    }

    const allFilled = otp.every((digit) => digit !== "");

    if (allFilled && otpSent && !verified && !verifying) {
      autoVerifyTimeoutRef.current = setTimeout(() => {
        const otpCode = otp.join("");
        handleVerifyOtp(otpCode);
      }, 300);
    }

    return () => {
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
        autoVerifyTimeoutRef.current = null;
      }
    };
  }, [otp, otpSent, verified, verifying, handleVerifyOtp]);

  const handleOtpKeyDown = useCallback(
    (e, index) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp],
  );

  const resetOtp = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoVerifyTimeoutRef.current)
      clearTimeout(autoVerifyTimeoutRef.current);
    setOtp(Array(length).fill(""));
    setVerified(false);
    setOtpSent(false);
    setToken(null);
    setResponseData(null);
    setError(null);
    setResendDisabled(true);
    setResendTimer(resendSeconds);
  }, [length, resendSeconds]);

  // Handle value change - reset OTP if value changes after OTP was sent
  const handleValueChange = useCallback(
    (newValue) => {
      if (otpSent && valueRef.current && valueRef.current !== newValue) {
        // Value changed after OTP was sent, reset OTP state
        resetOtp();
      } else if (otpSent) {
        // Any edit to the number after OTP sent clears the resend timer
        // allowing immediate resend to the same number
        if (timerRef.current) clearInterval(timerRef.current);
        setResendDisabled(false);
        setResendTimer(0);
      }
      valueRef.current = newValue;
    },
    [otpSent, resetOtp],
  );

  return {
    otp,
    setOtp,
    verified,
    otpSent,
    token,
    responseData,
    loading,
    sending,
    verifying,
    error,
    resendDisabled,
    resendTimer,
    otpRefs,
    handleSendOtp,
    handleVerifyOtp,
    handleOtpChange,
    handleOtpKeyDown,
    resetOtp,
    handleValueChange,
  };
};
