import React, { useEffect, useState } from "react";
import CardDataStatus from "../../../components/Vendor/Tables/CardDataStatus";
import DonutPieChart from "../../../components/Vendor/Tables/DonutPieChart";
import Map from "../../../components/Vendor/Tables/Map";
import TopProductsTable from "../../../components/Vendor/Tables/TopProductsTable";
import {
  FaBox,
  FaPercentage,
  FaRupeeSign,
  FaUserPlus,
  FaCheckCircle,
  FaUndo,
  FaTimesCircle,
  FaUsers,
} from "react-icons/fa";
import { Plus } from "lucide-react";

import { getDesignerDashboard } from "../../../services/api.dashboard";
import { useAppContext } from "../../../context/AppContext";
import CustomerRetention from "../../../components/Vendor/Tables/CustomerRetention.jsx";
import config from "../../../config/config";
import { useNavigate } from "react-router-dom";

export default function ECommerce() {
  const navigate = useNavigate();

  const { user } = useAppContext();
  const [dashboardData, setDashboardData] = useState({
    total_products: 0,
    total_sales: 0,
    completed_order: 0,
    return_order: 0,
    cancelled_order: 0,
    total_revenue: 0,
    total_users: 0,
    new_users: 0,
    donutChartData: [],
    stateData: [],
    topSellingProducts: [],
    topRentingProducts: [],
    customerRetentionData: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const response = await getDesignerDashboard(user.id);
      setDashboardData(response.data.dashboardData);
    };

    fetchDashboardData();
  }, []);

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className=" text-[black]">
      <div className="flex justify-between mt-4">
        <h2 className="text-3xl font-semibold font-satoshi ">
          Welcome Selling Partner
        </h2>

        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 bg-white text-[#0164CE] border-[#0164CE] border px-6 py-2 rounded   text-lg transition-colors"
            onClick={() => navigate(`${config.VITE_BASE_VENDOR_URL}/ads/add`)}
          >
            <Plus /> Create Add
          </button>
          <button
            className="flex items-center gap-2 bg-[#0164CE] text-white px-6 rounded py-2  border text-lg transition-colors"
            onClick={() => navigate(`${config.VITE_BASE_VENDOR_URL}/product`)}
          >
            <Plus /> Add Product
          </button>
        </div>
      </div>
      <p className=" leading-1 text-base font-satoshi font-medium text-textGray">
        We are happy to see you here{" "}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 lg:gap-4 mt-5 lg:mt-10 mb-2">
        {dashboardData ? (
          <>
            <CardDataStatus
              icon={
                <div className="p-4 bg-[#F6DDA391] text-[#FFDB89] rounded-md">
                  <FaBox />
                </div>
              }
              title="Total Products"
              value={dashboardData.total_products}
            />
            <CardDataStatus
              icon={
                <div className="p-4 bg-[#FFE3D0] text-[#F48031] rounded-md">
                  <FaPercentage />
                </div>
              }
              title="Total Sale"
              value={`${dashboardData.total_sales}`}
            />
            <CardDataStatus
              icon={
                <div className="p-4 bg-[#CED6FF] text-[#3A5BFF] rounded-md">
                  <FaRupeeSign />
                </div>
              }
              title="Total Revenue"
              value={`${dashboardData.total_revenue}`}
            />
            <CardDataStatus
              icon={
                <div className="p-4 bg-[#EBEBFF] text-[#C2C0FF] rounded-md">
                  <FaUserPlus />
                </div>
              }
              title="New User"
              value={dashboardData.new_users}
            />

            <CardDataStatus
              icon={
                <div className="p-4 bg-[#D1FFE1] text-[#39C568] rounded-md">
                  <FaCheckCircle />
                </div>
              }
              title="Order Completed"
              value={`${dashboardData.completed_order}`}
            />

            <CardDataStatus
              icon={
                <div className="p-4 bg-[#DEFDFF] text-[#51D3DB] rounded-md">
                  <FaUndo />
                </div>
              }
              title="Order Return"
              value={`${dashboardData.return_order}`}
            />
            <CardDataStatus
              icon={
                <div className="p-4 bg-[#FFDEDE] text-[#DF4C4C] rounded-md">
                  <FaTimesCircle />
                </div>
              }
              title="Order Canceled"
              value={`${dashboardData.cancelled_order}`}
            />
            <CardDataStatus
              icon={
                <div className="p-4 bg-[#E1D9FF] text-[#7C6ABB] rounded-md">
                  <FaUsers />
                </div>
              }
              title="Total User"
              value={`${dashboardData.total_users}`}
            />
          </>
        ) : (
          <>
            <CardDataStatus
              title="Total Products"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="Total Sale"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="Total Revenue"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="New User"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="Order Completed"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="Order Return"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="Order Canceled"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
            <CardDataStatus
              title="Total User"
              value={<div className="h-6 w-24 bg-gray-200 animate-pulse"></div>}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="w-full">
          <div className="flex items-center">
            <h2 className="inline-block text-[26px] font-semibold font-satoshi text-txtPage my-6">
              Revenue
            </h2>
          </div>
          {dashboardData.donutChartData.length === 0 ? (
            // 🎨 Empty State UI
            <div className="flex flex-col items-center h-full w-full">
              <svg
                className="w-20 h-20 text-gray-300"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10M2 12A10 10 0 0 1 12 2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <p className="text-gray-500 text-sm mt-2">No data available</p>
            </div>
          ) : (
            <DonutPieChart data={dashboardData.donutChartData} />
          )}
        </div>

        <div className="w-full">
          {dashboardData ? (
            <Map data={dashboardData.stateData} />
          ) : (
            <div className="h-64 w-full bg-gray-200 animate-pulse"></div>
          )}
        </div>

        <div className="col-span-1">
          {dashboardData ? (
            <TopProductsTable
              title={"Top Selling Products"}
              products={dashboardData.topSellingProducts}
            />
          ) : (
            <div className="h-64 w-full bg-gray-200 animate-pulse"></div>
          )}
        </div>

        <div className="col-span-1">
          {dashboardData && (
            <CustomerRetention
              customerRetentionData={dashboardData.customerRetentionData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
