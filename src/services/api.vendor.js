import apiClient from "../axios.config";
import Cookies from "js-cookie";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import config from "../config/config";

export const registervendor = async (userData) => {
  try {
    const res = await apiClient.post("/auth/registerUser", userData);
    return res;
    // if (res.status === 201) {
    //can show noificatons accordingly
    // }
  } catch (error) {
    // if (error.response && error.response.status === 400)
    // return notifyOnFail(error.response.data.message);  can show noificatons accordingly

    //default fallback for error
    notifyOnFail("Error reaching the server");
  }
};

export const vendorLogin = async (userData) => {
  try {
    const res = await apiClient.post("/auth/userLogin", userData);
    if (res.data.status === 1) {
      // Cookies.set(`${config.BRAND_NAME}userToken`, res.data.token, {
      //   expires: 30,
      //   path: "/",
      //   secure: true,
      //   sameSite: "strict",
      // });
      // localStorage.setItem(`${config.BRAND_NAME}user`, JSON.stringify(res.data.data));
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};
export const requestDeactivation = async (id) => {
  try {
    const res = await apiClient.put(`/vendor/deactivate/${id}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getAllvendors = async () => {
  try {
    const res = await apiClient.get("/vendor/getAll");
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getVendorDetails = async (userId) => {
  try {
    const res = await apiClient.get(`/vendor/getById/${userId}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getVendorById = async (userId) => {
  try {
    const res = await apiClient.get(`/vendor/get/${userId}`);
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const updateVendor = async (id, userData) => {
  try {
    const res = await apiClient.put(`/vendor/edit/${id}`, userData);
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const toggleVendor2FA = async (userId, data) => {
  try {
    const res = await apiClient.post(`/vendor/2fa/toggle/${userId}`, data);
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const verifyVendor2FA = async (userId, data) => {
  try {
    const res = await apiClient.post(`/vendor/2fa/verify/${userId}`, data);
    // if (res.data.status === 1) {
    //   notifyOnSuccess(res.data.message);
    // } else {
    //   notifyOnFail(res.data.message);
    // }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const updateVendorStatus = async (id, status) => {
  try {
    const res = await apiClient.put(`/vendor/update/status/${id}`, status);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const updateVendorActive = async (id, is_active) => {
  try {
    const res = await apiClient.put(`/vendor/update/isactive/${id}`, {
      is_active,
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const editvendor = async (id, userData) => {
  try {
    const res = await apiClient.put(`/vendor/editvendorUser/${id}`, userData);

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const addvendor = async (userData) => {
  try {
    const res = await apiClient.post("/vendor/addvendorUser", userData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const deletevendor = async (id) => {
  try {
    const res = await apiClient.delete(`/vendor/deletevendorUser/${id}`);
    console.log(res.data);

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
  }
};

export const getVendorPerformance = () => {
  try {
    const data = [
      {
        id: 1,
        vendor_id: "MXI9JS",
        brand_name: "ZARA",
        total_orders: 22100,
        total_sales: 1000000,
        commission: 10000,
        joined_date: "2021-06-24",
      },
      {
        id: 2,
        vendor_id: "LQW8KP",
        brand_name: "H&M",
        total_orders: 18500,
        total_sales: 750000,
        commission: 7500,
        joined_date: "2020-10-15",
      },
      {
        id: 3,
        vendor_id: "ABX5TN",
        brand_name: "Uniqlo",
        total_orders: 15000,
        total_sales: 600000,
        commission: 6000,
        joined_date: "2022-01-10",
      },
      {
        id: 4,
        vendor_id: "GVU3YD",
        brand_name: "Forever 21",
        total_orders: 12000,
        total_sales: 500000,
        commission: 5000,
        joined_date: "2021-12-05",
      },
      {
        id: 5,
        vendor_id: "PKH4MW",
        brand_name: "Levi's",
        total_orders: 10000,
        total_sales: 450000,
        commission: 4500,
        joined_date: "2020-05-20",
      },
      {
        id: 6,
        vendor_id: "NRB7XZ",
        brand_name: "Nike",
        total_orders: 30000,
        total_sales: 1500000,
        commission: 15000,
        joined_date: "2019-08-15",
      },
      {
        id: 7,
        vendor_id: "XME2QR",
        brand_name: "Adidas",
        total_orders: 25000,
        total_sales: 1300000,
        commission: 13000,
        joined_date: "2020-11-30",
      },
      {
        id: 8,
        vendor_id: "KTL6VU",
        brand_name: "Puma",
        total_orders: 17000,
        total_sales: 800000,
        commission: 8000,
        joined_date: "2022-07-19",
      },
      {
        id: 9,
        vendor_id: "ZXP4LM",
        brand_name: "Reebok",
        total_orders: 14000,
        total_sales: 650000,
        commission: 6500,
        joined_date: "2021-03-10",
      },
      {
        id: 10,
        vendor_id: "VNF8YT",
        brand_name: "Gap",
        total_orders: 11000,
        total_sales: 550000,
        commission: 5500,
        joined_date: "2020-09-12",
      },
      {
        id: 11,
        vendor_id: "MTY3RC",
        brand_name: "Under Armour",
        total_orders: 16000,
        total_sales: 700000,
        commission: 7000,
        joined_date: "2019-05-28",
      },
      {
        id: 12,
        vendor_id: "YJK9FB",
        brand_name: "Calvin Klein",
        total_orders: 13000,
        total_sales: 600000,
        commission: 6000,
        joined_date: "2022-04-22",
      },
      {
        id: 13,
        vendor_id: "PLK5VG",
        brand_name: "Tommy Hilfiger",
        total_orders: 18000,
        total_sales: 900000,
        commission: 9000,
        joined_date: "2021-11-03",
      },
    ];
    return data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return null;
  }
};

export const getVendorTransactions = () => {
  try {
    const data = [
      {
        id: 1,
        transaction_number: "TRXN001",
        transaction_date: "2023-04-13",
        payment_method: "Direct Transfer",
        vendor_data: {
          company_name: "Techsaint Pvt Ltd",
          account_number: "1234567890",
          bank_name: "Bank of America",
          ifsc_code: "BOA123",
        },
      },
      {
        id: 2,
        transaction_number: "TRXN002",
        transaction_date: "2023-05-21",
        payment_method: "UPI",
        vendor_data: {
          company_name: "NextGen Solutions",
          account_number: "9876543210",
          bank_name: "Chase Bank",
          ifsc_code: "CHB456",
        },
      },
      {
        id: 3,
        transaction_number: "TRXN003",
        transaction_date: "2023-06-01",
        payment_method: "Cheque",
        vendor_data: {
          company_name: "Infowise Corp",
          account_number: "5678901234",
          bank_name: "Wells Fargo",
          ifsc_code: "WFB789",
        },
      },
      {
        id: 4,
        transaction_number: "TRXN004",
        transaction_date: "2023-07-15",
        payment_method: "Credit Card",
        vendor_data: {
          company_name: "BlueSky Enterprises",
          account_number: "1230984567",
          bank_name: "Citibank",
          ifsc_code: "CTB234",
        },
      },
      {
        id: 5,
        transaction_number: "TRXN005",
        transaction_date: "2023-08-10",
        payment_method: "Net Banking",
        vendor_data: {
          company_name: "GreenTech Innovations",
          account_number: "0987654321",
          bank_name: "HSBC",
          ifsc_code: "HSBC567",
        },
      },
      {
        id: 6,
        transaction_number: "TRXN006",
        transaction_date: "2023-09-05",
        payment_method: "Direct Transfer",
        vendor_data: {
          company_name: "PrimeTech Solutions",
          account_number: "2345678901",
          bank_name: "Standard Chartered",
          ifsc_code: "STC890",
        },
      },
      {
        id: 7,
        transaction_number: "TRXN007",
        transaction_date: "2023-10-22",
        payment_method: "UPI",
        vendor_data: {
          company_name: "Optima Tech",
          account_number: "8765432109",
          bank_name: "ICICI Bank",
          ifsc_code: "ICICI123",
        },
      },
      {
        id: 8,
        transaction_number: "TRXN008",
        transaction_date: "2023-11-11",
        payment_method: "Cheque",
        vendor_data: {
          company_name: "EcoSolutions Pvt Ltd",
          account_number: "3456789012",
          bank_name: "HDFC Bank",
          ifsc_code: "HDFC456",
        },
      },
      {
        id: 9,
        transaction_number: "TRXN009",
        transaction_date: "2023-12-01",
        payment_method: "Credit Card",
        vendor_data: {
          company_name: "NeoTech Services",
          account_number: "2109876543",
          bank_name: "Axis Bank",
          ifsc_code: "AXIS789",
        },
      },
      {
        id: 10,
        transaction_number: "TRXN010",
        transaction_date: "2023-12-25",
        payment_method: "Net Banking",
        vendor_data: {
          company_name: "FusionWare Ltd",
          account_number: "5432109876",
          bank_name: "Yes Bank",
          ifsc_code: "YES123",
        },
      },
    ];

    return data;
  } catch (error) {
    notifyOnFail("Error reaching the server");
    console.log(error);
    return;
  }
};
