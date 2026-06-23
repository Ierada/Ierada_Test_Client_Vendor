export const MOCK_RETURNS = [
  { id: "RET-3841", orderId: "ORD-82125", productName: "Fossil Gen 6 Watch", reason: "Product damaged", stage: 1, status: "QC Pending", price: 21999, action: "Start QC" },
  { id: "RET-3839", orderId: "ORD-82089", productName: "Nike Air Max 270", reason: "Wrong size delivered", stage: 2, status: "Pickup Scheduled", price: 12499, action: "View" },
  { id: "RET-3835", orderId: "ORD-81990", productName: "Boat Rockerz 450", reason: "Not as described", stage: 3, status: "Item Received", price: 1799, action: "Approve Refund" },
  { id: "RET-3830", orderId: "ORD-81872", productName: "Mamaearth Set", reason: "Changed mind", stage: 4, status: "Refund Approved", price: 899, action: "View" },
  { id: "RET-3826", orderId: "ORD-81784", productName: "Wildcraft Backpack", reason: "Defective zipper", stage: 2, status: "QC Failed", price: 3499, action: "View" }
];

export const MOCK_NDR = [
  { id: "NDR-8821", orderId: "ORD-82401", productName: "OnePlus Buds Z2", courier: "Delhivery", attempt: "2/3", reason: "Door locked", nextAttempt: "Tomorrow 10 AM", status: "Reattempt Scheduled", action: "Reschedule/RTO" },
  { id: "NDR-8818", orderId: "ORD-82388", productName: "USB-C Hub 7-in-1", courier: "BlueDart", attempt: "1/3", reason: "Customer requested reschedule", nextAttempt: "Jun 16 2 PM", status: "Rescheduled", action: "Reschedule/RTO" },
  { id: "NDR-8812", orderId: "ORD-82301", productName: "Notebook Set (Pack of 5)", courier: "Shadowfax", attempt: "3/3", reason: "No response", nextAttempt: "—", status: "RTO Initiated", action: "Reschedule/RTO" }
];

export const MOCK_RTO = [
  { id: "RTO-1205", orderId: "ORD-81192", productName: "Fossil Gen 6 Watch", courier: "Delhivery", reason: "Refused by customer", status: "In Transit to Seller", price: 21999 },
  { id: "RTO-1202", orderId: "ORD-81120", productName: "Wildcraft Backpack", courier: "Shadowfax", reason: "Incorrect shipping address", status: "Returned to Warehouse", price: 3499 }
];

export const TABLE_HEADERS = {
  returns: ["RETURN ID", "ORDER", "PRODUCT", "REASON", "STAGE", "STATUS", "AMOUNT", "ACTION"],
  rto: ["RTO ID", "ORDER", "PRODUCT", "COURIER", "REASON", "STATUS", "AMOUNT", "ACTION"],
  ndr: ["NDR ID", "ORDER", "PRODUCT", "COURIER", "ATTEMPT #", "REASON", "NEXT ATTEMPT", "STATUS", "ACTION"]
};

