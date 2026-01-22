import {
  useRoutes,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import config from "../config/config";
import VendorSignIn from "../pages/Vendor/Authentication/SignIn";
import VendorLayout from "../layout/DefaultLayout.jsx";
import NotFoundPage from "../pages/NotFound/index.jsx";

import Dashboard from "../pages/Vendor/Dashboard";
import Product from "../pages/Vendor/Product";
import AddEditProduct from "../pages/Vendor/AddProduct";
import Setting from "../pages/Vendor/Setting";
import Order from "../pages/Vendor/Order";
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
// import CreateInvoice from "../pages/Vendor/Invoice/Create.jsx";

const VendorProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get(`${config.BRAND_NAME}VendorToken`);
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "vendor") {
        navigate("/login", { replace: true });
        return;
      }
      setIsAuthorized(true);
    } catch (error) {
      console.error("Token decode error:", error);
      navigate("/login", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Show loading until authorized
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
        { path: "/invoice", element: <Invoice /> },
        // { path: "/invoice/create", element: <CreateInvoice /> },
        { path: "/coupons", element: <Coupons /> },
        { path: "/report", element: <Report /> },
        { path: "/chat", element: <ChatLayout /> },
        { path: "/influencer", element: <ManageInfluencer /> },
        { path: "/profile", element: <Profile /> },
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
