import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

/**
 * Add item to cart
 * @param {string} userId - User ID
 * @param {object} cartData - Cart item data
 */
export const addToCart = async (userId, cartData) => {
  try {
    const res = await apiClient.post(`/cart/add/${userId}`, cartData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const buyNow = async (userId, cartData) => {
  try {
    const res = await apiClient.post(`/cart/buy/${userId}`, cartData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const addComboToCart = async (userId, cartData) => {
  try {
    const res = await apiClient.post(`/cart/addtocombo/${userId}`, cartData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

/**
 * Get cart items for a user
 * @param {string} userId - User ID
 * @param {array} selectedItems - Array of cart item IDs
 */
export const getCart = async (userId, selectedItems = [], params) => {
  try {
    const res = await apiClient.post(
      `/cart/get/${userId}?${new URLSearchParams(params)}`,
      { selectedItems }
    );

    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

/**
 * Get cart items for a user
 * @param {string} userId - User ID
 */
export const getCheckout = async (userId, selectedItems, couponCode = null) => {
  try {
    const cartItemIds = selectedItems.join(",");
    const queryParams = new URLSearchParams();
    if (couponCode) queryParams.append("couponCode", couponCode);
    queryParams.append("cartItemIds", cartItemIds);

    const res = await apiClient.get(`/checkout/get/${userId}?${queryParams}`);

    if (res.data.status === 1) {
      return {
        checkoutItems: res.data.data.checkoutItems || [],
        paymentDetails: res.data.data.paymentDetails || {
          subtotal: 0,
          discount: 0,
          shippingCharges: 0,
          total: 0,
        },
        couponDetails: res.data.data.couponDetails,
        shippingAddress: res.data.data.shippingAddress,
      };
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.error("Checkout fetch error:", error);
  }
};

/**
 * Delete item from cart
 * @param {string} userId - User ID
 * @param {object} data - Cart deletion data containing cart_id
 */
export const deleteFromCart = async (userId, data) => {
  try {
    const res = await apiClient.delete(`/cart/delete/${userId}`, { data });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

/**
 * Update cart item quantity
 * @param {string} userId - User ID
 * @param {object} data - Cart update data containing cart_id and qty
 */
export const updateCartQuantity = async (userId, data) => {
  try {
    const res = await apiClient.post(`/cart/qtyUpdate/${userId}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
  }
};

export const updateCartItemChecked = async (cart_item_id, checked) => {
  try {
    const res = await apiClient.put(
      `/cart/update-item-checked/${cart_item_id}?checked=${checked}`
    );
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return res.data.data;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return false;
  }
};

export const updateInstantReturnChecked = async (cart_item_id, type, value) => {
  try {
    const res = await apiClient.put(
      `/cart/update-return-checked/${cart_item_id}?type=${type}&value=${value}`
    );
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data.data;
    } else {
      notifyOnFail(res.data.message);
      return res.data.data;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return false;
  }
};
