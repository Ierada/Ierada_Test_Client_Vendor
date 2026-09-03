import {
  useRoutes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { jwtDecode } from "jwt-decode";
import VendorSignIn from "../pages/Vendor/Authentication/SignIn";
import VendorForgotPassword from "../pages/Vendor/ForgotPassword/index";
import VendorLayout from "../layout/DefaultLayout.jsx";
import NotFoundPage from "../pages/NotFound/index.jsx";
import AuthHandoff from "../pages/Vendor/AuthHandoff/index.jsx";

// --- Lazy imports ---
const Dashboard          = lazy(() => import("../pages/Vendor/Dashboard"));
const Product            = lazy(() => import("../pages/Vendor/Product"));
const ProductHub         = lazy(() => import("../pages/Vendor/Product/ProductHub.jsx"));
const AddEditProduct     = lazy(() => import("../pages/Vendor/AddProduct"));
const SmartListing       = lazy(() => import("../pages/Vendor/SmartListing"));
const Setting            = lazy(() => import("../pages/Vendor/Setting"));
const Order              = lazy(() => import("../pages/Vendor/Order"));
const OrderPipeline      = lazy(() => import("../pages/Vendor/Order/OrderPipeline.jsx"));
const SelfShip           = lazy(() => import("../pages/Vendor/Order/SelfShip.jsx"));
const Returns            = lazy(() => import("../pages/Vendor/Order/Returns.jsx"));
const OrderDetail        = lazy(() => import("../pages/Vendor/Order/OrderDetail/index.jsx"));
const Invoice            = lazy(() => import("../pages/Vendor/Invoice"));
const Coupons            = lazy(() => import("../pages/Vendor/Coupons"));
const ReportNew          = lazy(() => import("../pages/Vendor/ReportNew"));
const Profile            = lazy(() => import("../pages/Vendor/Profile"));
const SupportPage        = lazy(() => import("../pages/Vendor/Support/index.jsx"));
const VendorNotification = lazy(() => import("../pages/Vendor/Notification/index.jsx"));
const VendorLogoutPage   = lazy(() => import("../pages/Vendor/Logout/index.jsx"));
const ProductFilesManager = lazy(() => import("../pages/Vendor/Product/ProductFilesManager.jsx"));
const BulkListingManager = lazy(() => import("../pages/Vendor/BulkListingManager"));
const PaymentOverview    = lazy(() => import("../pages/Vendor/Payments/payment-overview/index.jsx"));
const Settlements        = lazy(() => import("../pages/Vendor/Payments/settlements/index.jsx"));
const Transactions       = lazy(() => import("../pages/Vendor/Payments/transactions/index.jsx"));
const PaymentAdvice      = lazy(() => import("../pages/Vendor/Payments/payment-advice/index.jsx"));
const GstTaxCenter       = lazy(() => import("../pages/Vendor/Payments/gst-center/index.jsx"));
const PickupVerification = lazy(() => import("../pages/Vendor/PickupVerification/index.jsx"));

import {
  setUserCookie,
  clearUserSession,
  getUserToken,
} from "../utils/userIdentifier";
import { toast } from "react-toastify";

// Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

// import CreateInvoice from "../pages/Vendor/Invoice/Create.jsx";

const VendorProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const handledQueryTokenRef = useRef(false);

  useEffect(() => {
    const authorizeVendor = () => {
      const searchParams = new URLSearchParams(location.search);

      // Legacy /dashboard?token= — prefer /auth/handoff for new website flows
      const queryToken = (searchParams.get("token") || "").trim();

      if (queryToken) {
        if (handledQueryTokenRef.current) return;
        handledQueryTokenRef.current = true;

        try {
          const decoded = jwtDecode(queryToken);

          if (decoded.role !== "vendor") {
            throw new Error("Invalid vendor role");
          }

          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            throw new Error("Token expired");
          }

          setUserCookie(queryToken, decoded, "vendor");
          localStorage.setItem("user", JSON.stringify(decoded));

          // Hard navigation to a clean URL (same as /auth/handoff).
          searchParams.delete("token");
          const cleanSearch = searchParams.toString();
          const cleanUrl = `${location.pathname}${
            cleanSearch ? `?${cleanSearch}` : ""
          }`;
          window.location.replace(cleanUrl || "/dashboard");
          return;
        } catch (error) {
          console.error("Invalid query token:", error);
          clearUserSession("vendor");
          toast.error("Invalid or expired login link. Please sign in again.");
          navigate("/login", { replace: true });
          return;
        }
      }

      const token = getUserToken("vendor");

      if (!token) {
        setIsAuthorized(false);
        navigate("/login", {
          replace: true,
          state: { from: location.pathname },
        });
        return;
      }

      try {
        const decoded = jwtDecode(token);
        localStorage.setItem("user", JSON.stringify(decoded));

        if (decoded.role !== "vendor") {
          clearUserSession("vendor");
          toast.error("Invalid session. Please sign in again.");
          navigate("/login", { replace: true });
          return;
        }

        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          clearUserSession("vendor");
          toast.error("Your session has expired. Please sign in again.");
          navigate("/login", { replace: true });
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Token decode error:", error);
        clearUserSession("vendor");
        toast.error("Invalid session. Please sign in again.");
        navigate("/login", { replace: true });
      }
    };

    authorizeVendor();
  }, [location.pathname, location.search, navigate]);

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return children;
};

const VendorRoutes = () => {
  return useRoutes([
    { path: "/login", element: <VendorSignIn /> },
    { path: "/forgot-password", element: <VendorForgotPassword /> },
    { path: "/auth/handoff", element: <AuthHandoff /> },
    {
      path: "/",
      element: (
        <VendorProtectedRoute>
          <VendorLayout />
        </VendorProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/dashboard" replace /> },
        { path: "/dashboard", element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
        { path: "/product", element: <Suspense fallback={<PageLoader />}><ProductHub /></Suspense> },
        { path: "/product/list", element: <Suspense fallback={<PageLoader />}><Product /></Suspense> },
        { path: "/product/add", element: <Suspense fallback={<PageLoader />}><SmartListing mode="vendor" /></Suspense> },
        { path: "/product/add-classic", element: <Suspense fallback={<PageLoader />}><AddEditProduct /></Suspense> },
        { path: "/product/edit/:id", element: <Suspense fallback={<PageLoader />}><SmartListing mode="vendor" /></Suspense> },
        { path: "/product/edit-classic/:id", element: <Suspense fallback={<PageLoader />}><AddEditProduct /></Suspense> },
        { path: "/bulk-upload", element: <Suspense fallback={<PageLoader />}><BulkListingManager mode="vendor" /></Suspense> },
        { path: "/bulk-upload/media", element: <Suspense fallback={<PageLoader />}><ProductFilesManager /></Suspense> },
        { path: "/settings", element: <Suspense fallback={<PageLoader />}><Setting /></Suspense> },
        { path: "/pickup-verification", element: <Suspense fallback={<PageLoader />}><PickupVerification /></Suspense> },
        { path: "/orders", element: <Suspense fallback={<PageLoader />}><Order /></Suspense> },
        { path: "/orders/pipeline", element: <Suspense fallback={<PageLoader />}><OrderPipeline /></Suspense> },
        { path: "/orders/self-ship", element: <Suspense fallback={<PageLoader />}><SelfShip /></Suspense> },
        { path: "/orders/returns", element: <Suspense fallback={<PageLoader />}><Returns /></Suspense> },
        { path: "/orders/:id", element: <Suspense fallback={<PageLoader />}><OrderDetail /></Suspense> },
        { path: "/invoice", element: <Suspense fallback={<PageLoader />}><Invoice /></Suspense> },
        // { path: "/invoice/create", element: <Suspense fallback={<PageLoader />}><CreateInvoice /></Suspense> },
        { path: "/coupons", element: <Suspense fallback={<PageLoader />}><Coupons /></Suspense> },
        { path: "/report", element: <Suspense fallback={<PageLoader />}><ReportNew /></Suspense> },
        { path: "/profile", element: <Suspense fallback={<PageLoader />}><Profile /></Suspense> },
        { path: "/payments", element: <Suspense fallback={<PageLoader />}><PaymentOverview /></Suspense> },
        { path: "/payments/settlements", element: <Suspense fallback={<PageLoader />}><Settlements /></Suspense> },
        { path: "/payments/transactions", element: <Suspense fallback={<PageLoader />}><Transactions /></Suspense> },
        { path: "/payments/payment-advice", element: <Suspense fallback={<PageLoader />}><PaymentAdvice /></Suspense> },
        { path: "/payments/gst-center", element: <Suspense fallback={<PageLoader />}><GstTaxCenter /></Suspense> },
        { path: "/support", element: <Suspense fallback={<PageLoader />}><SupportPage /></Suspense> },
        { path: "/notifications", element: <Suspense fallback={<PageLoader />}><VendorNotification /></Suspense> },
        { path: "/logout", element: <Suspense fallback={<PageLoader />}><VendorLogoutPage /></Suspense> },
        { path: "/chat", element: <Navigate to="/support" replace /> },
        { path: "/influencer", element: <Navigate to="/dashboard" replace /> },
        { path: "/influencer/campaign/create", element: <Navigate to="/dashboard" replace /> },
        { path: "/trackorders", element: <Navigate to="/orders" replace /> },
        { path: "/subcription", element: <Navigate to="/settings" replace /> },
        { path: "/review", element: <Navigate to="/dashboard" replace /> },
        { path: "/training", element: <Navigate to="/dashboard" replace /> },
        { path: "/ads/history", element: <Navigate to="/dashboard" replace /> },
        { path: "/ads/add", element: <Navigate to="/dashboard" replace /> },
        { path: "/orders/logistics", element: <Navigate to="/orders" replace /> },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ]);
};

export default VendorRoutes;
