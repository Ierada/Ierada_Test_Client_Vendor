// import apiClient from "../axios.config";
// import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";

// export const getBalance = async user_id => {
//   try {
//     const res = await apiClient.get(`/wallet-coin/balance/${user_id}`);
//     if (res.data.status === 1) {
//       //   notifyOnSuccess(res.data.message);
//       return res.data;
//     } else {
//       notifyOnFail(res.data.message);
//     }
//   } catch (error) {
//     notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
//     console.log(error);
//     // return error.response || error;
//   }
// };

// export const getTransactions = async userId => {
//   try {
//     const res = await apiClient.get(`/wallet-coin/get-transactions/${userId}`);
//     if (res.data.status === 1) {
//       // notifyOnSuccess(res.data.message);
//       return res.data;
//     } else {
//       notifyOnFail(res.data.message);
//     }
//   } catch (error) {
//     notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
//     console.log(error);
//     // return error.response || error;
//   }
// };

// export const addMoneyToWalletOrCoins = async (userId, transactionData) => {
//   try {
//     const res = await apiClient.post(
//       `/wallet-coin/make-transaction/${userId}`,
//       transactionData
//     );
//     if (res.data.status === 1) {
//       notifyOnSuccess(res.data.message);
//       return res.data;
//     } else {
//       notifyOnFail(res.data.message);
//     }
//   } catch (error) {
//     notifyOnFail(getApiErrorMessage(error, "Error processing transaction"));
//     console.log(error);
//   }
// };

// export const redeemCoinsToWallet = async (userId, amount) => {
//   try {
//     const res = await apiClient.post(`/wallet-coin/redeem-coins`, {
//       userId,
//       amount,
//     });
//     if (res.data.status === 1) {
//       return res.data;
//     } else {
//       notifyOnFail(res.data.message);
//     }
//   } catch (error) {
//     notifyOnFail(getApiErrorMessage(error, "Error processing redemption"));
//     console.log(error);
//   }
// };

// export const deductMoneyFromWalletOrCoins = async ({
//   userId,
//   amount,
//   description,
//   amount_type,
// }) => {
//   try {
//     const res = await apiClient.post(`/wallet-coin/deduct-money`, {
//       userId,
//       amount,
//       description,
//       amount_type,
//     });

//     // Validate response
//     if (!res?.data) {
//       throw new Error("No response from server");
//     }

//     // Check if deduction was successful
//     if (res.data.status === 1) {
//       notifyOnSuccess(res.data.message);
//       return res.data;
//     } else {
//       throw new Error(res.data.message || "Deduction failed");
//     }
//   } catch (error) {
//     console.error("Deduction failed:", error);
//     notifyOnFail(error.message || "Error reaching the server");
//     throw error; // Re-throw the error for handling in the calling function
//   }
// };

import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";

export const getBalance = async (user_id) => {
  try {
    const res = await apiClient.get(`/wallet-coin/balance/${user_id}`);
    if (res.data.status === 1) {
      //   notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const getTransactions = async (userId) => {
  try {
    const res = await apiClient.get(`/wallet-coin/get-transactions/${userId}`);
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    // return error.response || error;
  }
};

export const addMoneyToWalletOrCoins = async (userId, transactionData) => {
  try {
    const res = await apiClient.post(
      `/wallet-coin/make-transaction/${userId}`,
      transactionData
    );
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error processing transaction"));
    console.log(error);
  }
};

export const redeemCoinsToWallet = async (userId, amount) => {
  try {
    const res = await apiClient.post(`/wallet-coin/redeem`, {
      userId,
      amount,
    });
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error processing redemption"));
    console.log(error);
  }
};

export const deductMoneyFromWalletOrCoins = async ({
  userId,
  amount,
  description,
  amount_type,
}) => {
  try {
    const res = await apiClient.post(`/wallet-coin/deduct-money`, {
      userId,
      amount,
      description,
      amount_type,
    });

    // Validate response
    if (!res?.data) {
      throw new Error("No response from server");
    }

    // Check if deduction was successful
    if (res.data.status === 1) {
      // notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      throw new Error(res.data.message || "Deduction failed");
    }
  } catch (error) {
    console.error("Deduction failed:", error);
    notifyOnFail(error.message || "Error reaching the server");
    throw error; // Re-throw the error for handling in the calling function
  }
};
