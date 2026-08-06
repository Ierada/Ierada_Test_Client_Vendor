import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { clearUserSession, getUserToken } from "../../utils/userIdentifier";
import { startIdleWatcher } from "../../utils/idleTimeout";

const SessionGuard = () => {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    const isLoggedIn = () => !!getUserToken("vendor");

    const stop = startIdleWatcher({
      isActive: isLoggedIn,
      onIdle: () => {
        if (handledRef.current) return;
        handledRef.current = true;

        clearUserSession("vendor");

        toast.info("You were logged out due to inactivity.", {
          toastId: "session-idle",
          autoClose: 4000,
        });

        setTimeout(() => {
          handledRef.current = false;
          navigate("/login", { replace: true });
        }, 1500);
      },
    });

    return stop;
  }, [navigate]);

  return null;
};

export default SessionGuard;
