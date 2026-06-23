import { useMemo } from "react";

const useDiscountPercentage = (originalPrice, discountedPrice) => {
  return useMemo(() => {
    const original = Number(originalPrice || 0);
    const discounted = Number(discountedPrice || 0);

    if (!original || discounted >= original) return 0;

    return Math.round(((original - discounted) / original) * 100);
  }, [originalPrice, discountedPrice]);
};

export default useDiscountPercentage;