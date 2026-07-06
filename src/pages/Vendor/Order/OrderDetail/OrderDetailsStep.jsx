import React from "react";
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Tag,
  RotateCcw,
} from "lucide-react";

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white rounded-2xl border border-[#EDF0F4] overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#EDF0F4]">
      <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#0164CE]" />
      </div>
      <h3 className="text-sm font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── Field ─────────────────────────────────────────────────────────────────────
const Field = ({ label, value, mono = false, highlight }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
      {label}
    </p>
    <p
      className={`text-sm font-semibold ${mono ? "font-mono" : ""} ${
        highlight === "green"
          ? "text-green-600"
          : highlight === "red"
          ? "text-red-500"
          : highlight === "amber"
          ? "text-amber-600"
          : highlight === "blue"
          ? "text-[#0164CE]"
          : "text-gray-900"
      }`}
    >
      {value ?? "—"}
    </p>
  </div>
);

const OrderDetailsStep = ({ orderData }) => {
  if (!orderData) return null;

  const { product, orderInfo, customer } = orderData;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-4">
      {/* Product */}
      <Section icon={Package} title="Product Details">
        <div className="flex gap-4">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
            />
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
            <Field label="Product Name" value={product.name} />
            <Field label="SKU" value={product.sku} mono />
            <Field label="Quantity" value={orderData.product?.quantity || 1} />
            {product.color && <Field label="Color" value={product.color} />}
            {product.size && <Field label="Size" value={product.size} />}
          </div>
        </div>
      </Section>

      {/* Order Info */}
      <Section icon={Tag} title="Order Information">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Order ID" value={`#${orderData.id}`} mono />
          <Field label="Order Date" value={orderInfo.orderedDate} />
          <Field label="Order Time" value={orderInfo.orderedTime} />
          <Field label="Payment Type" value={orderInfo.paymentType} />
          <Field label="Price" value={orderInfo.price} highlight="blue" />
          <Field
            label="Order Total"
            value={orderInfo.orderTotal}
            highlight="green"
          />
          {orderInfo.discount && (
            <Field
              label="Discount"
              value={orderInfo.discount}
              highlight="amber"
            />
          )}
        </div>
      </Section>

      {/* Customer */}
      <Section icon={User} title="Customer Details">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Customer Name" value={customer.name} />
          <Field label="Phone" value={customer.phone} />
          <Field label="Email" value={customer.email} />
        </div>
        {(customer.stats?.orders || customer.stats?.totalSpend) && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">
                {customer.stats.orders}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">
                Orders
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">
                {customer.stats.totalSpend}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">
                Spent
              </p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl">
              <p className="text-lg font-bold text-gray-900">
                {customer.stats.rating}
              </p>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">
                Rating
              </p>
            </div>
          </div>
        )}
      </Section>

      {/* Shipping Address */}
      <Section icon={MapPin} title="Shipping Address">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Address
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {customer.address.line1 || "—"}
            </p>
            <p className="text-sm text-gray-600">
              {customer.address.line2 || ""}
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default OrderDetailsStep;
