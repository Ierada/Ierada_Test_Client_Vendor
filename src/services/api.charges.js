import apiClient from "../axios.config";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast";
import { getApiErrorMessage } from "../utils/apiError";



export const getAllCharges =  () => {
   try {
    const data = [
        {
          id: 1,
          charge_name: "MRP",
          charge_type: "Shipping",
          description: "Additional fees for faster delivery options",
          hsn_code: "123456", 
          charges_price: "150",
        },
        {
          id: 2,
          charge_name: "GST",
          charge_type: "Tax",
          description: "Goods and Services Tax applicable on products",
          hsn_code: "234567",
          charges_price: "18",
        },
        {
          id: 3,
          charge_name: "Packaging Fee",
          charge_type: "Shipping",
          description: "Cost for packaging materials",
          hsn_code: "345678",
          charges_price: "50",
        },
        {
          id: 4,
          charge_name: "Handling Fee",
          charge_type: "Service",
          description: "Fee for handling and processing orders",
          hsn_code: "456789",
          charges_price: "75",
        },
        {
          id: 5,
          charge_name: "Late Fee",
          charge_type: "Penalty",
          description: "Charge for delayed payments",
          hsn_code: "567890",
          charges_price: "100",
        },
        {
          id: 6,
          charge_name: "Insurance Fee",
          charge_type: "Service",
          description: "Fee for insuring goods during shipping",
          hsn_code: "678901",
          charges_price: "200",
        },
        {
          id: 7,
          charge_name: "Bulk Discount",
          charge_type: "Discount",
          description: "Discount provided for bulk purchases",
          hsn_code: "789012",
          charges_price: "120", 
        },
        {
          id: 8,
          charge_name: "Express Shipping",
          charge_type: "Shipping",
          description: "Additional charge for express delivery service",
          hsn_code: "890123",
          charges_price: "300",
        },
        {
          id: 9,
          charge_name: "Return Processing Fee",
          charge_type: "Service",
          description: "Fee for processing returned items",
          hsn_code: "901234",
          charges_price: "50",
        },
        {
          id: 10,
          charge_name: "Fuel Surcharge",
          charge_type: "Shipping",
          description: "Additional charge based on fuel prices",
          hsn_code: "012345",
          charges_price: "30",
        },
      ];
      
    return data;
    } catch (error) {
      notifyOnFail('Error reaching the server');
      console.log(error);
      return
    }  
}


export const updateCharge = async (id, chargeData) => {
  try {
    const response = await apiClient.put(`/charges/edit/${id}`, chargeData);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error updating the Charge"));
    console.error(error);
  }
};


export const deleteCharge = async (id) => {
  try {
    const response = await apiClient.delete(`/charges/delete/${id}`);
    if (response.data.status === 1) {
      notifyOnSuccess(response.data.message);
      return response.data;
    } else {
      notifyOnFail(response.data.message);
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error deleting the Charge"));
    console.error(error);
  }
};
