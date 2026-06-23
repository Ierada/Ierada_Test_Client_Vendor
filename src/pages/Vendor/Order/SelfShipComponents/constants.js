export const SELF_SHIP_STAGES = [
  { id: "new", name: "New Order", color: "blue", bgClass: "bg-blue-600 border-blue-600 text-white" },
  { id: "accept", name: "Accept Order", color: "orange", bgClass: "bg-orange-500 border-orange-500 text-white" },
  { id: "invoice", name: "Generate Invoice", color: "purple", bgClass: "bg-purple-600 border-purple-600 text-white" },
  { id: "courier", name: "Add Courier Partner", color: "pink", bgClass: "bg-pink-500 border-pink-500 text-white" },
  { id: "awb", name: "Enter AWB Number", color: "pink", bgClass: "bg-pink-500 border-pink-500 text-white" },
  { id: "tracking", name: "Upload Tracking", color: "blue", bgClass: "bg-blue-600 border-blue-600 text-white" },
  { id: "shipped", name: "Mark as Shipped", color: "green", bgClass: "bg-green-600 border-green-600 text-white" },
  { id: "delivered", name: "Delivery Confirmed", color: "green", bgClass: "bg-green-600 border-green-600 text-white" },
];

export const INITIAL_ORDERS = [
  { id: "SS-4821", sku: "LLB-BRN-15", qty: 2, productName: "Leather Laptop Bag", customer: "Rahul Mehta, Mumbai", price: 4499, courier: "BlueDart", trackingId: "", activeIndex: 3, created_at: "2026-06-16T11:20:00Z" },
  { id: "SS-4819", sku: "VEP-BLK-001", qty: 1, productName: "Wireless Earbuds Pro", customer: "Anita Joshi, Pune", price: 2999, courier: "", trackingId: "", activeIndex: 1, created_at: "2026-06-16T14:10:00Z" },
  { id: "SS-4815", sku: "YM-PSP-GRY", qty: 3, productName: "Yoga Mat Non-Slip", customer: "Kiran Shah, Ahmedabad", price: 1799, courier: "DTDC", trackingId: "", activeIndex: 2, created_at: "2026-06-16T09:45:00Z" }
];
