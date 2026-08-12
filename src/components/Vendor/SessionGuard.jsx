import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { endVendorSessionAndRedirect, getUserToken } from "../../utils/userIdentifier";
import { startIdleWatcher } from "../../utils/idleTimeout";
import { markAuthSessionEnded } from "../../utils/authSession";

const SessionGuard = () => {
  const handledRef = useRef(false);

  useEffect(() => {
    const isLoggedIn = () => !!getUserToken("vendor");

    const stop = startIdleWatcher({
      isActive: isLoggedIn,
      onIdle: () => {
        if (handledRef.current) return;
        handledRef.current = true;

        markAuthSessionEnded();
        toast.info("You were logged out due to inactivity.", {
          toastId: "session-idle",
          autoClose: 4000,
        });

        setTimeout(() => {
          handledRef.current = false;
          endVendorSessionAndRedirect({ redirect: true, replace: true });
        }, 1500);
      },
    });

    return stop;
  }, []);

  return null;
};

export default SessionGuard;
