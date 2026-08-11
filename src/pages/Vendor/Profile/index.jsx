import { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import {
  getVendorDetails,
  updateVendor,
  requestDeactivation,
  toggleVendor2FA,
  verifyVendor2FA,
} from "../../../services/api.vendor";
import { Edit, X, Eye, MapPin, ImagePlus, ChevronDown } from "lucide-react";
import LocationMapModal from "../../../components/Vendor/Models/LocationMapModal";
import DefaultImg from "/assets/user/person-circle.png";
import {
  notifyOnFail,
  notifyOnSuccess,
  notifyOnWarning,
} from "../../../utils/notification/toast";

const INITIAL_STATE = {
  firstName: "",
  lastName: "",
  dob: "",
  email: "",
  phone: "",
  vendor_address: "",
  vendor_city: "",
  vendor_state: "",
  vendor_country: "India",
  vendor_zipCode: "",
  userAvatar: "",
  shop_name: "",
  gst: "",
  pan_number: "",
  adhaar_number: "",
  brand_name: "",
  adhaarCardFile: "",
  panCardFile: "",
  gstFile: "",
  businessRegistrationFile: "",
  cancelledChequeFile: "",
  shop_logo: "",
  shop_banner: "",
  shop_address: "",
  shop_city: "",
  shop_state: "",
  shop_country: "India",
  shop_zipCode: "",
  shop_latitude: "",
  shop_longitude: "",
  // Main Seller KYC (separate from the vendor's own personal details above)
  kyc_pan_number: "",
  kyc_adhaar_number: "",
  kyc_full_name: "",
  kyc_dob: "",
  kyc_address: "",
  deactivation_requested: false,
  // Vendor 2FA on by default until explicitly disabled in profile
  is_2fa_enabled: true,
  two_factor_type: "otp",
};

const DOCUMENT_ROWS = [
  { key: "gstFile", label: "GST Certificate" },
  { key: "panCardFile", label: "PAN Card" },
  { key: "adhaarCardFile", label: "Aadhaar Card" },
  { key: "businessRegistrationFile", label: "Business Registration" },
  { key: "cancelledChequeFile", label: "Cancelled Cheque" },
];

const calculateProfileCompletion = (userData) => {
  const requiredFields = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "vendor_address",
    "shop_name",
    "gst",
    "pan_number",
    "adhaar_number",
  ];
  const filledFields = requiredFields.filter((field) =>
    userData[field]?.trim(),
  );
  return Math.round((filledFields.length / requiredFields.length) * 100);
};

const maskSensitive = (value) => {
  if (!value) return "-";
  const str = value.toString();
  if (str.length <= 4) return str;
  const last4 = str.slice(-4);
  const masked = str.slice(0, -4).replace(/./g, '*');
  return `${masked}${last4}`;
};

const getFileNameFromValue = (value) => {
  if (!value) return "—";
  if (value.startsWith("data:")) return "New file selected";
  const parts = value.split("/");
  return parts[parts.length - 1] || "Uploaded file";
};

// ---- shared field styling helpers ----
const fieldLabel = "block text-xs font-medium text-gray-500 mb-1.5";
const fieldView =
  "px-3 py-2.5 rounded-lg bg-gray-50 text-sm text-gray-800 border border-transparent min-h-[42px] flex items-center";
const fieldInput =
  "w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors";

const Card = ({ title, subtitle, right, children }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
    <div className="flex items-start justify-between mb-5 gap-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Profile = () => {
  const { user } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(INITIAL_STATE);
  const [originalUserData, setOriginalUserData] = useState(INITIAL_STATE);
  const [previews, setPreviews] = useState({});
  const [docDates, setDocDates] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    document: null,
    title: "",
    type: "image", // 'image' or 'pdf'
  });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if ((name === "dob" || name === "kyc_dob") && value) {
      const [year, month, day] = value.split("-");
      formattedValue = `${day}-${month}-${year}`;
    }
    setUserData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleFullNameChange = (e) => {
    const value = e.target.value;
    const [first, ...rest] = value.split(" ");
    setUserData((prev) => ({
      ...prev,
      firstName: first || "",
      lastName: rest.join(" "),
    }));
  };

  const handlePreview = (field, dataUrl) => {
    setPreviews((prev) => ({ ...prev, [field]: dataUrl }));
    setUserData((prev) => ({ ...prev, [field]: dataUrl }));
  };

  const handleImageFieldChange = (fieldKey) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handlePreview(fieldKey, reader.result);
    reader.readAsDataURL(file);
  };

  const handleDocumentFile = (fieldKey) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handlePreview(fieldKey, reader.result);
      setDocDates((prev) => ({
        ...prev,
        [fieldKey]: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSetLiveLocation = () => {
    if (!navigator.geolocation) {
      notifyOnFail("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserData((prev) => ({
          ...prev,
          shop_latitude: position.coords.latitude.toFixed(6),
          shop_longitude: position.coords.longitude.toFixed(6),
        }));
        notifyOnSuccess("Live location pinned");
      },
      () => {
        notifyOnFail("Unable to fetch your current location");
      },
    );
  };

  const handleLocationSelect = (locationData) => {
    setUserData((prev) => ({
      ...prev,
      shop_latitude: locationData.lat.toFixed(6),
      shop_longitude: locationData.lng.toFixed(6),
      shop_address: locationData.fullAddress || prev.shop_address,
      shop_city: locationData.city || prev.shop_city,
      shop_state: locationData.state || prev.shop_state,
      shop_country: locationData.country || prev.shop_country,
      shop_zipCode: locationData.zipCode || prev.shop_zipCode,
    }));
    setShowLocationModal(false);
    notifyOnSuccess("Location selected successfully");
  };

  const openDocumentViewer = (document, title) => {
    const isPdf = document?.toLowerCase().endsWith('.pdf');
    setViewerModal({ 
      isOpen: true, 
      document, 
      title,
      type: isPdf ? 'pdf' : 'image'
    });
  };

  const closeDocumentViewer = () => {
    setViewerModal({ isOpen: false, document: null, title: "", type: "image" });
  };

  const fetchUserDetails = async (id) => {
    try {
      setIsLoading(true);
      const response = await getVendorDetails(id);

      if (!response) {
        notifyOnFail("Failed to fetch your details");
        return;
      }

      const vendorData = response;

      const formatDOB = (isoDate) => {
        if (!isoDate) return "";
        const date = new Date(isoDate);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const newUserData = {
        firstName: vendorData?.data?.vendor?.first_name || "",
        lastName: vendorData?.data?.vendor?.last_name || "",
        dob: formatDOB(vendorData?.data?.vendor?.dob) || "",
        email: vendorData?.data?.email || "",
        phone: vendorData?.data?.phone?.replace("+91", "") || "",
        vendor_address: vendorData?.data?.vendor?.address || "",
        vendor_city: vendorData?.data?.vendor?.city || "",
        vendor_state: vendorData?.data?.vendor?.state || "",
        vendor_country: vendorData?.data?.vendor?.country || "India",
        vendor_zipCode: vendorData?.data?.vendor?.zip_code || "",
        userAvatar: vendorData?.data?.vendor?.avatar || "",
        shop_name: vendorData?.data?.vendor?.shop_name || "",
        gst: vendorData?.data?.vendor?.gstin || "",
        pan_number: vendorData?.data?.vendor?.pan_number || "",
        adhaar_number: vendorData?.data?.vendor?.adhaar_number || "",
        brand_name: vendorData?.data?.vendor?.brand_name || "",
        adhaarCardFile: vendorData?.data?.vendor?.documents?.adhaarcard || "",
        panCardFile: vendorData?.data?.vendor?.documents?.pancard || "",
        gstFile: vendorData?.data?.vendor?.documents?.gst_file || "",
        businessRegistrationFile:
          vendorData?.data?.vendor?.documents?.business_registration || "",
        cancelledChequeFile:
          vendorData?.data?.vendor?.documents?.cancelled_cheque || "",
        shop_logo: vendorData?.data?.vendor?.shop_logo || "",
        shop_banner: vendorData?.data?.vendor?.shop_banner || "",
        shop_address: vendorData?.data?.vendor?.shop_address || "",
        shop_city: vendorData?.data?.vendor?.shop_city || "",
        shop_state: vendorData?.data?.vendor?.shop_state || "",
        shop_country: vendorData?.data?.vendor?.shop_country || "India",
        shop_zipCode: vendorData?.data?.vendor?.shop_zip_code || "",
        shop_latitude: vendorData?.data?.vendor?.shop_latitude || "",
        shop_longitude: vendorData?.data?.vendor?.shop_longitude || "",
        kyc_pan_number: vendorData?.data?.vendor?.kyc?.pan_number || "",
        kyc_adhaar_number: vendorData?.data?.vendor?.kyc?.adhaar_number || "",
        kyc_full_name: vendorData?.data?.vendor?.kyc?.full_name || "",
        kyc_dob: formatDOB(vendorData?.data?.vendor?.kyc?.dob) || "",
        kyc_address: vendorData?.data?.vendor?.kyc?.address || "",
        deactivation_requested:
          vendorData?.data?.deactivation_requested || false,
        // null/undefined → enabled; explicit false stays disabled
        is_2fa_enabled: vendorData?.data?.is_2fa_enabled !== false,
        two_factor_type:
          vendorData?.data?.is_2fa_enabled === false
            ? "none"
            : vendorData?.data?.two_factor_type &&
                vendorData.data.two_factor_type !== "none"
              ? vendorData.data.two_factor_type
              : "otp",
      };

      setUserData(newUserData);
      setOriginalUserData(newUserData);
      setPreviews(newUserData);
      setCompletionPercentage(calculateProfileCompletion(newUserData));
    } catch (error) {
      console.error("Error fetching vendor details:", error);
      notifyOnFail("Sorry! Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserDetails(user.id);
    }
  }, [user?.id]);

  const calculateAge = (dob) => {
    const [day, month, year] = dob.split("-").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const isValidDOB = (dob) => {
    if (!dob) return false;
    const age = calculateAge(dob);
    return age >= 18;
  };

  const handleProfileUpdate = async () => {
    if (!isValidDOB(userData.dob)) {
      notifyOnFail("You must be at least 18 years old.");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();

      Object.entries(userData).forEach(([key, value]) => {
        if (
          value &&
          ![
            "adhaarCardFile",
            "panCardFile",
            "gstFile",
            "businessRegistrationFile",
            "cancelledChequeFile",
            "shop_logo",
            "shop_banner",
            "userAvatar",
            "deactivation_requested",
            "is_2fa_enabled",
            "two_factor_type",
            "kyc_pan_number",
            "kyc_adhaar_number",
            "kyc_full_name",
            "kyc_dob",
            "kyc_address",
            "pan_number",
            "adhaar_number",
          ].includes(key) &&
          !value.toString().includes("data:")
        ) {
          // Handle date conversion for dob field
          if (key === "dob" && value) {
            const parts = value.split("-");
            if (parts.length === 3) {
              const [day, month, year] = parts;
              formData.append(key, `${year}-${month}-${day}`);
            } else {
              formData.append(key, value);
            }
          } else {
            formData.append(key, value);
          }
        }
      });

      const fileUpdates = {
        adhaarCardFile: "adhaarcard_file",
        panCardFile: "pancard_file",
        gstFile: "gst_file",
        businessRegistrationFile: "businessRegistrationFile",
        cancelledChequeFile: "cancelledChequeFile",
        shop_logo: "shop_logo",
        shop_banner: "shop_banner",
        userAvatar: "avatar",
      };

      for (const [frontendKey, backendKey] of Object.entries(fileUpdates)) {
        const fileData = userData[frontendKey];

        if (fileData && fileData.toString().includes("data:")) {
          const base64Response = await fetch(fileData);
          const blob = await base64Response.blob();
          const mimeType =
            base64Response.headers.get("content-type") || blob.type;
          const extension = mimeType.split("/")[1];
          const file = new File([blob], `${backendKey}.${extension}`, {
            type: mimeType,
          });
          formData.append(frontendKey, file);
        }
      }

      // Add KYC fields
      if (userData.kyc_dob) {
        // Convert DD-MM-YYYY to YYYY-MM-DD for backend
        const parts = userData.kyc_dob.split("-");
        if (parts.length === 3) {
          const [day, month, year] = parts;
          formData.append("kyc_dob", `${year}-${month}-${day}`);
        } else {
          formData.append("kyc_dob", userData.kyc_dob);
        }
      }

      const response = await updateVendor(user.id, formData);

      if (response?.status === 1) {
        await fetchUserDetails(user.id);
        setIsEditing(false);
        notifyOnSuccess("Profile updated successfully");
      } else {
        notifyOnFail(response?.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      notifyOnFail("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivation = async () => {
    try {
      setIsLoading(true);
      const response = await requestDeactivation(user.id);
      if (response?.status === 1) {
        notifyOnSuccess(
          response.message || "Deactivation request submitted successfully",
        );
        setShowDeactivationModal(false);
        await fetchUserDetails(user.id);
      } else {
        notifyOnFail(
          response?.message || "Failed to submit deactivation request",
        );
      }
    } catch (error) {
      console.error("Error requesting deactivation:", error);
      notifyOnFail("Error submitting deactivation request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    const enabling = !userData.is_2fa_enabled;
    // Disable requires OTP confirm in modal; first click requests OTP, second submits it
    if (!enabling && show2FAModal && !otp) {
      notifyOnFail("Please enter the OTP");
      return;
    }

    try {
      setIsLoading(true);
      const data = enabling
        ? { enable: true }
        : show2FAModal && otp
          ? { enable: false, otp }
          : { enable: false };

      const response = await toggleVendor2FA(user.id, data);
      if (response.status === 1) {
        if (response.requires_otp) {
          setShow2FAModal(true);
          notifyOnWarning(response.message);
        } else {
          notifyOnSuccess(response.message);
          await fetchUserDetails(user.id);
          setOtp("");
          setShow2FAModal(false);
        }
      } else {
        notifyOnFail(response.message || "Failed to toggle 2FA");
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      notifyOnFail("Failed to toggle 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!otp) {
      notifyOnFail("Please enter the OTP");
      return;
    }
    try {
      setIsLoading(true);
      const response = await verifyVendor2FA(user.id, { otp });
      if (response.status === 1) {
        notifyOnSuccess(response.message);
        await fetchUserDetails(user.id);
        setOtp("");
        setShow2FAModal(false);
      } else {
        notifyOnFail(response.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying 2FA:", error);
      notifyOnFail("Failed to verify 2FA");
    } finally {
      setIsLoading(false);
    }
  };

  // ---- field renderers ----
  const renderField = (label, name, type = "text", masked = false) => {
    const value = userData[name] || "";
    const locked = name === "email" || name === "phone";

    if (!isEditing || locked) {
      return (
        <div className="flex flex-col">
          <label className={fieldLabel}>{label}</label>
          <p className={fieldView}>{masked ? maskSensitive(value) : value || "-"}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        <label className={fieldLabel}>{label}</label>
        <input
          className={fieldInput}
          type={type}
          name={name}
          value={
            name === "dob" || name === "kyc_dob"
              ? (userData[name] || "").split("-").reverse().join("-")
              : value
          }
          onChange={handleChange}
        />
      </div>
    );
  };

  const renderFullNameField = () => {
    const fullName = `${userData.firstName} ${userData.lastName}`.trim();
    if (!isEditing) {
      return (
        <div className="flex flex-col">
          <label className={fieldLabel}>Full Name</label>
          <p className={fieldView}>{fullName || "-"}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col">
        <label className={fieldLabel}>Full Name</label>
        <input
          className={fieldInput}
          type="text"
          value={fullName}
          onChange={handleFullNameChange}
        />
      </div>
    );
  };

  const renderReadOnlyField = (label, value) => (
    <div className="flex flex-col">
      <label className={fieldLabel}>{label}</label>
      <p className={fieldView}>{value || "—"}</p>
    </div>
  );

  const renderDocumentRow = (row) => {
    const value = userData[row.key];
    return (
      <tr key={row.key} className="border-b border-gray-100 last:border-0">
        <td className="py-3.5 px-4 text-sm font-medium text-gray-800">
          {row.label}
        </td>
        <td className="py-3.5 px-4 text-sm text-gray-500">
          {docDates[row.key] || "—"}
        </td>
        <td className="py-3.5 px-4 text-sm text-gray-500">
          {getFileNameFromValue(value)}
        </td>
        <td className="py-3.5 px-4 text-sm text-right whitespace-nowrap">
          {value && (
            <button
              type="button"
              onClick={() => openDocumentViewer(value, row.label)}
              className="text-blue-600 hover:underline font-medium"
            >
              View
            </button>
          )}
          {isEditing && (
            <>
              {value && <span className="text-gray-300 mx-2">|</span>}
              <label
                htmlFor={`upload-${row.key}`}
                className="text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Upload
              </label>
              <input
                id={`upload-${row.key}`}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleDocumentFile(row.key)}
              />
            </>
          )}
        </td>
      </tr>
    );
  };

  if (isLoading && !userData.firstName) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fa8b4b]">
      {/* Top bar */}
<div className="bg-white border-b border-gray-200">
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
    <div>
      <h1 className="text-lg font-semibold text-gray-900">Seller Profile</h1>
      <p className="text-xs text-gray-500 mt-0.5">
        Manage your shop settings, billing, and credentials
      </p>
    </div>

    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Active Vendor
      </span>
      <button className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        {userData.shop_name || "Your Shop"}
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  </div>
</div>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow">
              <img
                src={userData.userAvatar || DefaultImg}
                alt="Profile"
                className="object-cover w-full h-full"
              />
              {isEditing && (
                <label
                  htmlFor="upload-avatar"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition-opacity"
                >
                  <Edit className="w-4 h-4 text-white" />
                </label>
              )}
              <input
                id="upload-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFieldChange("userAvatar")}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {userData.firstName} {userData.lastName}
              </h1>
              <p className="text-xs text-gray-500">
                Profile ID: {user?.vendorId} · Profile {completionPercentage}%
                complete
              </p>
            </div>
          </div> */}
<div></div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-blue-600 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-colors text-sm font-medium shadow-sm"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Personal Details */}
        <Card
          title="Personal Details"
          subtitle="Basic identity and contact information for the seller account"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {renderFullNameField()}
            {renderField("Phone Number", "phone", "tel")}
            {renderField("Email ID", "email", "email")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            {renderReadOnlyField("PAN Number", userData.pan_number)}
            {renderReadOnlyField("Aadhaar Number", maskSensitive(userData.adhaar_number))}
            {renderField("Date of Birth (DOB)", "dob", "date")}
          </div>
        </Card>

        {/* Documents */}
        <Card
          title="Documents"
          subtitle="Documents uploaded during registration"
        >
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide bg-gray-50">
                  <th className="py-2.5 px-4">Document Type</th>
                  <th className="py-2.5 px-4">Upload Date</th>
                  <th className="py-2.5 px-4">File Name</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>{DOCUMENT_ROWS.map(renderDocumentRow)}</tbody>
            </table>
          </div>
        </Card>

        {/* Shop Information */}
        <Card
          title="Shop Information"
          subtitle="Update public-facing storefront settings and inventory distribution parameters"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-5">
              {renderField("Shop Name", "shop_name")}
              <div>
                {renderField("Pickup Address", "shop_address")}
                <p className="text-xs text-gray-400 mt-1">
                  This is the pickup address for orders. Courier agents will
                  dispatch vehicles here.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {renderField("City", "shop_city")}
                {renderField("State", "shop_state")}
                {renderField("Country", "shop_country")}
                {renderField("ZIP Code", "shop_zipCode")}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={fieldLabel}>Live Pickup Location</label>
                <div
                  className="relative h-28 w-full rounded-lg border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, #eef1f4 0 1px, transparent 1px 22px), repeating-linear-gradient(90deg, #eef1f4 0 1px, transparent 1px 22px)",
                  }}
                  onClick={() => isEditing && setShowLocationModal(true)}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <span className="text-[11px] font-medium text-gray-600">
                      {userData.shop_latitude
                        ? "Pinned Live Location"
                        : isEditing
                        ? "Click to choose location"
                        : "No location set"}
                    </span>
                    {userData.shop_latitude && (
                      <span className="text-[10px] text-gray-400">
                        {userData.shop_latitude}, {userData.shop_longitude}
                      </span>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <p className="mt-2 text-xs text-blue-600 font-medium">
                    Edit profile to choose location
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 items-start">
                <div>
                  <label className={fieldLabel}>Upload Logo</label>
                  <label
                    htmlFor="upload-shop-logo"
                    className={`h-20 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-blue-500 border-blue-200 bg-blue-50/50 ${
                      isEditing ? "cursor-pointer hover:bg-blue-50" : ""
                    } overflow-hidden`}
                  >
                    {userData.shop_logo ? (
                      <img
                        src={userData.shop_logo}
                        alt="Shop logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-[11px] font-medium">
                          Upload Logo
                        </span>
                      </>
                    )}
                  </label>
                  <input
                    id="upload-shop-logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={!isEditing}
                    onChange={handleImageFieldChange("shop_logo")}
                  />
                </div>
                {/* {renderField("Brand Name", "brand_name")} */}
              </div>

              <div>
                <label className={fieldLabel}>Shop Banner</label>
                <label
                  htmlFor="upload-shop-banner"
                  className={`h-16 w-full rounded-lg border-2 border-dashed flex items-center justify-center gap-2 text-gray-500 border-gray-200 ${
                    isEditing ? "cursor-pointer hover:bg-gray-50" : ""
                  } overflow-hidden`}
                >
                  {userData.shop_banner ? (
                    <img
                      src={userData.shop_banner}
                      alt="Shop banner"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] font-medium">
                      Upload Banner
                    </span>
                  )}
                </label>
                <input
                  id="upload-shop-banner"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={!isEditing}
                  onChange={handleImageFieldChange("shop_banner")}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Main Seller KYC Details */}
        <Card
          title="Main Seller KYC Details"
          subtitle="Primary KYC verification details for the main seller"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            {renderReadOnlyField("PAN Number", userData.kyc_pan_number)}
            {renderReadOnlyField("Aadhaar Number", maskSensitive(userData.kyc_adhaar_number))}
            {renderField("Full Name (as per KYC)", "kyc_full_name")}
            {renderField("Date of Birth", "kyc_dob", "date")}
            {renderField("Address", "kyc_address")}
          </div>
        </Card>

        {/* Two-Factor Authentication */}
        <Card title="Two-Factor Authentication">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-600">
              Two Factor Authentication is currently{" "}
              <span
                className={
                  userData.is_2fa_enabled ? "text-green-600" : "text-red-500"
                }
              >
                {userData.is_2fa_enabled ? "Enabled" : "Disabled"}
              </span>
            </p>
            <button
              onClick={handleToggle2FA}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                userData.is_2fa_enabled
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 transition-colors`}
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : userData.is_2fa_enabled
                  ? "Disable 2FA"
                  : "Enable 2FA"}
            </button>
          </div>
        </Card>

        {/* Deactivate Account */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-base font-semibold text-red-500">
                Deactivate Account
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {userData.deactivation_requested
                  ? "Your deactivation request is pending approval. You will be notified once it is processed."
                  : "Once you deactivate your account, there is no going back. Please be certain."}
              </p>
            </div>
            {!userData.deactivation_requested ? (
              <button
                className="px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50"
                onClick={() => setShowDeactivationModal(true)}
                disabled={isLoading}
              >
                Request To Deactivate
              </button>
            ) : (
              <button
                className="px-4 py-2 text-white bg-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
                disabled
              >
                Request Pending
              </button>
            )}
          </div>
        </section>

        {/* Bottom action bar */}
        {isEditing && (
          <div className="flex justify-end gap-4 pb-4">
            <button
              onClick={() => {
                setIsEditing(false);
                setUserData(originalUserData);
                fetchUserDetails(user.id);
              }}
              className="px-5 py-2.5 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors text-sm font-medium"
              disabled={isLoading}
            >
              <X className="w-4 h-4" />
              <span>Discard Changes</span>
            </button>
            <button
              onClick={handleProfileUpdate}
              className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors text-sm font-medium"
              disabled={isLoading}
            >
              {isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              )}
              <span>{isLoading ? "Processing..." : "Save Changes"}</span>
            </button>
          </div>
        )}

        {/* Document Viewer Modal */}
        {viewerModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-screen flex flex-col">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">
                  {viewerModal.title}
                </h3>
                <button
                  onClick={closeDocumentViewer}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-4 flex-grow overflow-auto flex items-center justify-center bg-gray-100">
                {viewerModal.type === 'pdf' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <iframe
                      src={viewerModal.document}
                      title={viewerModal.title}
                      className="w-full h-full border-0"
                      style={{ minHeight: '500px' }}
                      onError={() => {
                        // Fallback if iframe fails to load
                        console.error('Failed to load PDF in iframe');
                      }}
                    />
                    <p className="mt-4 text-sm text-gray-600">
                      If the PDF doesn't display properly, please use the Download button below.
                    </p>
                  </div>
                ) : (
                  <img
                    src={viewerModal.document}
                    alt={viewerModal.title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <div className="p-4 border-t flex justify-between">
                {viewerModal.type === 'pdf' && (
                  <a
                    href={viewerModal.document}
                    download
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Download
                  </a>
                )}
                <button
                  onClick={closeDocumentViewer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivation Modal */}
        {showDeactivationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-500">
                  Confirm Account Deactivation
                </h3>
                <button
                  onClick={() => setShowDeactivationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Deactivating your account is permanent and cannot be undone.
                This will:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
                <li>
                  Remove your Selling Partner profile and all associated data
                </li>
                <li>Cancel any active listings or services</li>
                <li>Prevent you from accessing Selling Partner features</li>
              </ul>
              <p className="text-sm text-gray-600 mb-6">
                Are you absolutely sure you want to proceed?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeactivationModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivation}
                  className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    "Deactivate Account"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2FA Modal */}
        {show2FAModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {userData.is_2fa_enabled ? "Disable 2FA" : "Enable 2FA"}
                </h3>
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {userData.is_2fa_enabled
                  ? "An OTP has been sent to your " +
                    (userData.email ? "email" : "phone") +
                    ". Enter it below to disable Two-Factor Authentication."
                  : "An OTP has been sent to your " +
                    (userData.email ? "email" : "phone") +
                    ". Please enter the OTP below."}
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={
                    userData.is_2fa_enabled
                      ? handleToggle2FA
                      : handleVerify2FA
                  }
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Map Modal */}
        <LocationMapModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSave={handleLocationSelect}
        />

      </main>
    </div>
  );
};

export default Profile;