import React from "react";
import OrderTableRow from "./OrderTableRow";
import EmptyOrders from "./EmptyOrders";

const HEADERS = ["Order", "Product", "Customer", "Courier", "Payment", "Status", "SLA", "Risk", "Amount", "Actions"];

const OrderTable = ({ orders, isLoading, selectedOrders, onSelectOrder, onSelectAll, onViewOrder, onOrderUpdate, onAcceptSuccess }) => {
  if (isLoading) return <div className="p-12 text-center text-gray-500 font-semibold bg-white rounded-xl border border-gray-100">Loading orders...</div>;
  if (!orders || orders.length === 0) return <EmptyOrders />;

  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4 w-12">
                <input type="checkbox" checked={allSelected} onChange={onSelectAll} className="rounded border-gray-300 text-[#FF6012] focus:ring-[#FF6012] w-4 h-4 cursor-pointer" />
              </th>
              {HEADERS.map((h) => (
                <th key={h} className="px-6 py-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {orders.map((order, index) => (
              <OrderTableRow
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={() => onSelectOrder(order.id)}
                onView={() => onViewOrder(order)}
                onOrderUpdate={onOrderUpdate}
                index={index}
                total={orders.length}
                onAcceptSuccess={onAcceptSuccess}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
