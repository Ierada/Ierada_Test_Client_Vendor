import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import VendorRoutes from "./Routes/index";
import { ToastContainer } from "react-toastify";
import { HelmetProvider } from "react-helmet-async";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import SessionGuard from "./components/Vendor/SessionGuard";
import ErrorBoundary from "./components/Common/ErrorBoundary";

const App = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AuthProvider>
      <AppProvider>
        <ToastContainer />
        <SessionGuard />
        <HelmetProvider>
          <ErrorBoundary key={location.pathname}>
            <VendorRoutes />
          </ErrorBoundary>
        </HelmetProvider>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
