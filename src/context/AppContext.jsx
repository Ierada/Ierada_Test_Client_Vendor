import { useState, useEffect } from "react";
import { createContext, useContext } from "react";
import config from "../config/config";
import { getCategories } from "../services/api.category";
import { getAllDesigners } from "../services/api.user";
import { useAuth } from "./AuthContext";
import { useLocation } from "react-router";
import { getRoleFromPath, getUserStorageKey } from "../utils/userIdentifier";

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [allDesigners, setAllDesigners] = useState([]);
  const [productsUpdated, setProductsUpdated] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(
    JSON.parse(localStorage.getItem(`${config.BRAND_NAME}appliedcoupon`)) || 0
  );
  const [orderSummary, setOrderSummary] = useState(
    JSON.parse(localStorage.getItem(`${config.BRAND_NAME}orderSummary`)) || {}
  );
  // const [triggerUnreadNotification, setTriggerUnreadNotification] =
  //   useState(false);
  // const [triggerWishlistCount, setTriggerWishlistCount] = useState(false);
  // const [triggerCartCount, setTriggerCartCount] = useState(false);

  const [triggerHeaderCounts, setTriggerHeaderCounts] = useState(false);

  const location = useLocation();

useEffect(() => {
  try {
    const key = getUserStorageKey("vendor");

    const primaryStoredUser = localStorage.getItem(key);
    const redirectedStoredUser = localStorage.getItem("user");

    if (redirectedStoredUser) {
      const parsedUser = JSON.parse(redirectedStoredUser);
      setUser(parsedUser);
      return;
    }

    if (primaryStoredUser) {
      const parsedUser = JSON.parse(primaryStoredUser);
      setUser(parsedUser);
      return;
    }

    setUser(null);
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);

    localStorage.removeItem("user");
    localStorage.removeItem(getUserStorageKey("vendor"));

    setUser(null);
  }
}, [location.pathname]);

  const handleProductUpdates = () => setProductsUpdated((prev) => !prev);

  // useEffect(() => {
  //   if (!loggedIn) return;
  //   const user = localStorage.getItem(`${config.BRAND_NAME}user`);
  //   setUser(user);
  // }, [loggedIn]);

  // const fetchProducts = async () => {
  //   const res = await getProductsByDesignerId(user.id);
  //   setProducts(res.data);
  // };

  const fetchWebCategories = async () => {
    const res = await getCategories();
    setAllCategories(res.data);
  };

  const fetchAllDesigners = async () => {
    const res = await getAllDesigners();
    setAllDesigners(res.data);
  };

  const customModalStyles = {
    overlay: {
      backgroundColor: "#303D438C",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        handleProductUpdates,
        allCategories,
        setAllCategories,
        fetchWebCategories,
        allDesigners,
        setAllDesigners,
        fetchAllDesigners,
        appliedCoupon,
        setAppliedCoupon,
        orderSummary,
        setOrderSummary,
        customModalStyles,
        // triggerUnreadNotification,
        // setTriggerUnreadNotification,
        // triggerWishlistCount,
        // setTriggerWishlistCount,
        // triggerCartCount,
        // setTriggerCartCount,
        triggerHeaderCounts,
        setTriggerHeaderCounts,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
