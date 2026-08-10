import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import { setUserCookie } from "../../../utils/userIdentifier";

/**
 * Public route: accepts ?token= from website become-a-seller (or other origins),
 * stores vendor session on this host, then lands on dashboard with a clean URL.
 */
export default function AuthHandoff() {
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = (params.get("token") || "").trim();

    if (!token) {
      toast.error("Missing login token. Please sign in again.");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.role !== "vendor") {
        throw new Error("Invalid vendor role");
      }

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        throw new Error("Token expired");
      }

      setUserCookie(token, decoded, "vendor");
      localStorage.setItem("user", JSON.stringify(decoded));

      // Full navigation so ProtectedRoute reads a fresh cookie (avoids SPA race).
      window.location.replace("/dashboard");
    } catch (error) {
      console.error("Auth handoff failed:", error);
      toast.error("Invalid or expired login link. Please sign in again.");
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen text-slate-600">
      Signing you in…
    </div>
  );
}
