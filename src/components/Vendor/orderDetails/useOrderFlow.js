import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getOrderByOrderId, cancelOrder } from "../../../services/api.order";
import { getProductById } from "../../../services/api.product";

export const useOrderFlow = (id) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const res = await getOrderByOrderId(id).catch(() => null);
      if (res?.data) {
        const prodId = res.data.products?.[0]?.productId;
        if (prodId) {
          const p = await getProductById(prodId).catch(() => null);
          if (p?.data) {
            res.data.products[0].whats_in_the_box = p.data.whats_in_the_box;
            res.data.products[0].specifications = p.data.specifications;
            res.data.products[0].images = p.data.images || res.data.products[0].images;
          }
        }
        setData(res.data);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleNext = useCallback(async () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      setActLoading(true);
      setTimeout(() => {
        setActLoading(false);
        setStep(3);
      }, 500);
    } else if (step === 3) setStep(4);
    else if (step === 4) {
      setActLoading(true);
      setTimeout(() => {
        setActLoading(false);
        navigate("/orders");
      }, 500);
    }
  }, [step, navigate]);

  const handleBack = useCallback(() => {
    step === 1 ? navigate("/orders") : setStep(prev => prev - 1);
  }, [step, navigate]);

  const handleCancel = useCallback(async () => {
    setActLoading(true);
    setTimeout(() => {
      setActLoading(false);
      navigate("/orders");
    }, 500);
  }, [navigate]);

  return { step, data, loading, actLoading, handleNext, handleBack, handleCancel };
};

