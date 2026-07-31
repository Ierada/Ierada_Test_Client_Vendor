/**
 * getVendorStatus
 * 
 * Determines the vendor status based on order status and shipping provider
 * without requiring additional database columns.
 */

export const getVendorStatus = (order) => {
  const { order_status, shipping_provider } = order;

  if (order_status === 'rejected') {
    if (shipping_provider) {
      return { 
        status: 'Rejected by Shipping Partner', 
        type: 'shipping',
        originalStatus: order_status
      };
    } else {
      return { 
        status: 'Rejected by Vendor', 
        type: 'vendor',
        originalStatus: order_status
      };
    }
  }

  if (order_status === 'cancelled') {
    return { 
      status: 'Cancelled by Customer', 
      type: 'customer',
      originalStatus: order_status
    };
  }

  if (order_status === 'placed' || order_status === 'pending') {
    return { 
      status: 'Awaiting Vendor Action', 
      type: 'pending',
      originalStatus: order_status
    };
  }

  if (order_status === 'accepted' || order_status === 'packed') {
    return { 
      status: 'Vendor Accepted', 
      type: 'vendor',
      originalStatus: order_status
    };
  }

  if (order_status === 'shipped' || order_status === 'intransit' || order_status === 'outfordelivery') {
    return { 
      status: 'Shipped', 
      type: 'shipping',
      originalStatus: order_status
    };
  }

  if (order_status === 'delivered') {
    return { 
      status: 'Delivered', 
      type: 'system',
      originalStatus: order_status
    };
  }

  if (order_status === 'returned') {
    return { 
      status: 'Returned', 
      type: 'system',
      originalStatus: order_status
    };
  }

  // Default fallback
  return { 
    status: order_status || 'Unknown', 
    type: 'system',
    originalStatus: order_status
  };
};

export const getStatusColorClass = (statusType) => {
  switch (statusType) {
    case 'vendor':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'shipping':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'customer':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'pending':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'system':
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};
