import React from "react";
import { Check } from "lucide-react";

const steps = [
  { label: "Order Details", id: 1 },
  { label: "Invoice", id: 2 },
  { label: "Shipping Label", id: 3 },
  { label: "Mark Shipped", id: 4 },
];

const OrderStepper = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center w-full max-w-[520px] mx-auto py-5 select-none">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 font-bold text-[13px]
                  ${isCompleted ? "bg-[#FF6012] border-[#FF6012] text-white" : ""}
                  ${isActive ? "bg-[#FF6012] border-[#FF6012] text-white" : ""}
                  ${!isCompleted && !isActive ? "bg-white border-gray-300 text-gray-400" : ""}`}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : step.id}
              </div>
              <span
                className={`mt-2 text-[11px] font-semibold text-center transition-colors duration-300 whitespace-nowrap
                  ${isCompleted || isActive ? "text-[#FF6012]" : "text-[#8A94A6]"}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 -mt-6 mx-3 transition-colors duration-300
                  ${currentStep > step.id ? "bg-[#FF6012]" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default React.memo(OrderStepper);
