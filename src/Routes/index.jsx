import {
  useRoutes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import VendorSignIn from "../pages/Vendor/Authentication/SignIn";
import VendorForgotPassword from "../pages/Vendor/ForgotPassword/index";
import VendorLayout from "../layout/DefaultLayout.jsx";
import NotFoundPage from "../pages/NotFound/index.jsx";

import Dashboard from "../pages/Vendor/Dashboard";
import Product from "../pages/Vendor/Product";
import AddEditProduct from "../pages/Vendor/AddProduct";
import Setting from "../pages/Vendor/Setting";
import Order from "../pages/Vendor/Order";
import OrderPipeline from "../pages/Vendor/Order/OrderPipeline.jsx";
import SelfShip from "../pages/Vendor/Order/SelfShip.jsx";
import Returns from "../pages/Vendor/Order/Returns.jsx";
import OrderDetail from "../pages/Vendor/Order/OrderDetail/index.jsx";
import Invoice from "../pages/Vendor/Invoice";
import Coupons from "../pages/Vendor/Coupons";
import Report from "../pages/Vendor/Report";
import Profile from "../pages/Vendor/Profile";
import TrackCustomerOrders from "../pages/Vendor/TrackOrder";
import CreateCampaign from "../components/Vendor/CreateCampaign";
import Review from "../pages/Vendor/Review";
import Subcriptions from "../pages/Vendor/Subcriptions";
import ManageInfluencer from "../pages/Vendor/ManageInfluencer";
import ChatLayout from "../pages/Vendor/Chat";
import TutorialPage from "../pages/Vendor/Tutorial/index.jsx";
import SupportPage from "../pages/Vendor/Support/index.jsx";
import VendorNotification from "../pages/Vendor/Notification/index.jsx";
import VendorLogoutPage from "../pages/Vendor/Logout/index.jsx";
import VendorAdlist from "../pages/Vendor/AdList/index.jsx";
import CreateAdPage from "../pages/Vendor/AddAdvertisement/index.jsx";
import ProductFilesManager from "../pages/Vendor/Product/ProductFilesManager.jsx";
import AuthHandoff from "../pages/Vendor/AuthHandoff/index.jsx";
import Payments from "../pages/Vendor/Payments/index.jsx";
import {
  setUserCookie,
  clearUserSession,
  getUserToken,
} from "../utils/userIdentifier";
import { toast } from "react-toastify";

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
        { path: "/dashboard", element: <Dashboard /> },
        { path: "/product", element: <Product /> },
        { path: "/product/add", element: <AddEditProduct /> },
        { path: "/product/edit/:id", element: <AddEditProduct /> },
        { path: "/bulk-upload", element: <ProductFilesManager /> },
        { path: "/settings", element: <Setting /> },
        { path: "/orders", element: <Order /> },
        { path: "/orders/pipeline", element: <OrderPipeline /> },
        { path: "/orders/self-ship", element: <SelfShip /> },
        { path: "/orders/returns", element: <Returns /> },
        { path: "/orders/logistics", element: <Order /> },
        { path: "/orders/:id", element: <OrderDetail /> },
        { path: "/invoice", element: <Invoice /> },
        // { path: "/invoice/create", element: <CreateInvoice /> },
        { path: "/coupons", element: <Coupons /> },
        { path: "/report", element: <Report /> },
        { path: "/chat", element: <ChatLayout /> },
        { path: "/influencer", element: <ManageInfluencer /> },
        { path: "/profile", element: <Profile /> },
        { path: "/payments", element: <Payments /> },
        { path: "/trackorders", element: <TrackCustomerOrders /> },
        { path: "/influencer/campaign/create", element: <CreateCampaign /> },
        { path: "/subcription", element: <Subcriptions /> },
        { path: "/review", element: <Review /> },
        { path: "/support", element: <SupportPage /> },
        { path: "/training", element: <TutorialPage /> },
        { path: "/notifications", element: <VendorNotification /> },
        { path: "/logout", element: <VendorLogoutPage /> },
        { path: "/ads/history", element: <VendorAdlist /> },
        { path: "/ads/add", element: <CreateAdPage /> },
      ],
    },
    { path: "*", element: <NotFoundPage /> },
  ]);
};

export default VendorRoutes;
