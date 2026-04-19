import { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import {
  getVendorDetails,
  updateVendor,
  requestDeactivation,
  toggleVendor2FA,
  verifyVendor2FA,
} from "../../../services/api.vendor";
import { addBankDetails } from "../../../services/api.kyc";
import FileUpload from "../../../components/Vendor/FileUpload";
import { Edit, X, Eye } from "lucide-react";
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
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  shop_address: "",
  shop_city: "",
  shop_state: "",
  shop_country: "India",
  shop_zipCode: "",
  adhaarCardFile: "",
  panCardFile: "",
  gstFile: "",
  shop_logo: "",
  shop_banner: "",
  deactivation_requested: false,
  is_2fa_enabled: false,
  two_factor_type: "none",
  isBankVerified: false,
};

const INITIAL_BANK_STATE = {
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  name_at_bank: "",
};

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
    "bank_name",
  ];
  const filledFields = requiredFields.filter((field) =>
    userData[field]?.trim(),
  );
  return Math.round((filledFields.length / requiredFields.length) * 100);
};

const Profile = () => {
  const { user } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(INITIAL_STATE);
  const [originalUserData, setOriginalUserData] = useState(INITIAL_STATE);
  const [previews, setPreviews] = useState({});
  const [showPreviews, setShowPreviews] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [viewerModal, setViewerModal] = useState({
    isOpen: false,
    document: null,
    title: "",
  });
  const [hoveredDocument, setHoveredDocument] = useState(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [showBankVerificationModal, setShowBankVerificationModal] =
    useState(false);
  const [bankData, setBankData] = useState(INITIAL_BANK_STATE);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "dob" && value) {
      const [year, month, day] = value.split("-");
      formattedValue = `${day}-${month}-${year}`;
    }
    setUserData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setBankData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreview = (field, dataUrl) => {
    setPreviews((prev) => ({ ...prev, [field]: dataUrl }));
    setUserData((prev) => ({ ...prev, [field]: dataUrl }));
  };

  const togglePreview = (field) => {
    setShowPreviews((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const openDocumentViewer = (document, title) => {
    setViewerModal({
      isOpen: true,
      document,
      title,
    });
  };

  const closeDocumentViewer = () => {
    setViewerModal({
      isOpen: false,
      document: null,
      title: "",
    });
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
        bank_name: vendorData?.data?.vendor?.bank_name || "",
        account_number: vendorData?.data?.vendor?.account_number || "",
        ifsc_code: vendorData?.data?.vendor?.ifsc_code || "",
        shop_address: vendorData?.data?.vendor?.shop_address || "",
        shop_city: vendorData?.data?.vendor?.shop_city || "",
        shop_state: vendorData?.data?.vendor?.shop_state || "",
        shop_country: vendorData?.data?.vendor?.shop_country || "India",
        shop_zipCode: vendorData?.data?.vendor?.shop_zip_code || "",
        adhaarCardFile: vendorData?.data?.vendor?.documents?.adhaarcard || "",
        panCardFile: vendorData?.data?.vendor?.documents?.pancard || "",
        gstFile: vendorData?.data?.vendor?.documents?.gst_file || "",
        shop_logo: vendorData?.data?.vendor?.shop_logo || "",
        shop_banner: vendorData?.data?.vendor?.shop_banner || "",
        deactivation_requested:
          vendorData?.data?.deactivation_requested || false,
        is_2fa_enabled: vendorData?.data?.is_2fa_enabled || false,
        two_factor_type: vendorData?.data?.two_factor_type || "none",
        isBankVerified: vendorData?.data?.vendor?.account_number ? true : false,
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

  const handleAddBank = async () => {
    try {
      setIsLoading(true);
      const response = await addBankDetails({
        bank_name: bankData.bank_name,
        account_number: bankData.account_number,
        ifsc_code: bankData.ifsc_code,
        name_at_bank: bankData.name_at_bank,
      });

      if (response.status === 1) {
        setShowBankVerificationModal(false);
        setBankData(INITIAL_BANK_STATE);
        await fetchUserDetails(user.id);
      }
    } catch (error) {
      notifyOnFail("Failed to add bank details");
    } finally {
      setIsLoading(false);
    }
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
            "shop_logo",
            "shop_banner",
            "userAvatar",
            "deactivation_requested",
            "is_2fa_enabled",
            "two_factor_type",
            "isBankVerified",
            "bank_name",
            "account_number",
            "ifsc_code",
          ].includes(key) &&
          !value.toString().includes("data:")
        ) {
          formData.append(key, value);
        }
      });

      const fileUpdates = {
        adhaarCardFile: "adhaarcard_file",
        panCardFile: "pancard_file",
        gstFile: "gst_file",
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
    if (userData.is_2fa_enabled) {
      setShow2FAModal(true);
      notifyOnWarning(
        "Disabling Two-Factor Authentication will reduce the security of your account. You will no longer receive OTP verification for sensitive actions. Are you sure you want to proceed?",
      );
      return;
    }

    try {
      setIsLoading(true);
      const data = { enable: !userData.is_2fa_enabled };
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

  const renderField = (label, name, type = "text") => {
    const value = userData[name] || "";

    if (!isEditing || name === "email" || name === "phone") {
      return (
        <div className="flex flex-col text-sm w-full">
          <label className="text-gray-600 mb-1">{label}</label>
          <p className="p-2 bg-gray-50 rounded-md text-gray-800">
            {value || "-"}
          </p>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col text-sm w-full">
          <label className="text-gray-600 mb-1">{label}</label>
          <input
            className="border border-gray-200 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            type={type}
            name={name}
            value={
              name === "dob"
                ? userData.dob.split("-").reverse().join("-")
                : value
            }
            onChange={handleChange}
          />
        </div>
      );
    }
  };

  const renderDocument = (label, docKey) => {
    const documentUrl = userData[docKey];

    return (
      <div className="flex flex-col text-sm">
        <label className="text-gray-600 mb-1">{label}</label>
        {documentUrl ? (
          <div
            className="relative h-32 w-full"
            onMouseEnter={() => setHoveredDocument(docKey)}
            onMouseLeave={() => setHoveredDocument(null)}
          >
            <img
              src={documentUrl}
              alt={label}
              className="h-32 w-full object-contain rounded-md border border-gray-200"
            />
            {hoveredDocument === docKey && (
              <button
                onClick={() => openDocumentViewer(documentUrl, label)}
                className="absolute top-2 right-2 p-2 bg-white bg-opacity-80 rounded-full shadow-md hover:bg-opacity-100 transition-all duration-200"
                title="View full document"
              >
                <Eye className="w-5 h-5 text-blue-600" />
              </button>
            )}
          </div>
        ) : (
          <p className="p-2 bg-gray-50 rounded-md text-gray-500">
            No document uploaded
          </p>
        )}
      </div>
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b pb-6 gap-4">
            <div className="flex items-center space-x-2 md:space-x-8">
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={userData.userAvatar || DefaultImg}
                    alt="Profile"
                    className="object-contain w-full h-full"
                  />
                  {isEditing && (
                    <label
                      htmlFor="upload-avatar"
                      className="absolute bottom-2 right-2 bg-gray-100 p-1 rounded-full shadow cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <Edit className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </label>
                  )}
                  <input
                    id="upload-avatar"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () =>
                          handlePreview("userAvatar", reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>

                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    {userData.firstName} {userData.lastName}
                  </h2>
                  <p className="text-xs md:text-sm text-gray-500">
                    Profile ID: {user?.vendorId}
                  </p>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setUserData(originalUserData);
                    fetchUserDetails(user.id);
                  }}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : null}
                  <span>{isLoading ? "Processing..." : "Save Changes"}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center space-x-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          <div className="space-y-8">
            <section>
              <div className="flex items-center justify-between -mt-10">
                <h3 className="text-lg font-semibold text-gray-800">
                  Personal Information
                </h3>
                <div className="relative h-24 w-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="#E5E7EB"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="#3B82F6"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${completionPercentage * 2.26}, 226`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute top-14 left-10 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-xs font-semibold text-blue-600">
                      {completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderField("First Name", "firstName")}
                {renderField("Last Name", "lastName")}
                {renderField("Date of Birth", "dob", "date")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {renderField("Email", "email", "email")}
                {renderField("Phone Number", "phone", "tel")}
              </div>
              <div className="mt-6">
                {renderField("Address", "vendor_address")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                {renderField("City", "vendor_city")}
                {renderField("State", "vendor_state")}
                {renderField("Country", "vendor_country")}
                {renderField("ZIP Code", "vendor_zipCode")}
              </div>
            </section>

            <section className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Shop Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {renderField("Shop Name", "shop_name")}
                {renderField("GSTIN", "gst")}
                {renderField("PAN Number", "pan_number")}
                {renderField("Adhaar Number", "adhaar_number")}
              </div>
              <div className="mt-6">
                {renderField("Shop Address", "shop_address")}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                {renderField("Shop City", "shop_city")}
                {renderField("Shop State", "shop_state")}
                {renderField("Shop Country", "shop_country")}
                {renderField("Shop ZIP Code", "shop_zipCode")}
              </div>
            </section>

            <section className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Bank Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderField("Bank Name", "bank_name")}
                {renderField("Account Number", "account_number")}
                {renderField("IFSC Code", "ifsc_code")}
              </div>
              <div className="mt-6 flex items-center space-x-4">
                <p className="text-sm text-gray-600">
                  Bank Verification Status:{" "}
                  <span
                    className={
                      userData.isBankVerified
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {userData.isBankVerified ? "Verified" : "Not Verified"}
                  </span>
                </p>
                <button
                  onClick={() => setShowBankVerificationModal(true)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : null}
                  <span>Add Bank Details</span>
                </button>
              </div>
            </section>

            {isEditing && (
              <section className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <FileUpload
                    name="adhaarCardFile"
                    label="Upload Adhaar Card"
                    value={previews.adhaarCardFile || userData.adhaarCardFile}
                    preview={handlePreview}
                    onTogglePreview={togglePreview}
                    showPreview={showPreviews.adhaarCardFile}
                  />
                  <FileUpload
                    name="panCardFile"
                    label="Upload Pan Card"
                    value={previews.panCardFile || userData.panCardFile}
                    preview={handlePreview}
                    onTogglePreview={togglePreview}
                    showPreview={showPreviews.panCardFile}
                  />
                  <FileUpload
                    name="gstFile"
                    label="Upload GST Document"
                    value={previews.gstFile || userData.gstFile}
                    preview={handlePreview}
                    onTogglePreview={togglePreview}
                    showPreview={showPreviews.gstFile}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FileUpload
                    name="shop_logo"
                    label="Upload Shop Logo"
                    value={previews.shop_logo || userData.shop_logo}
                    accept="image/*"
                    preview={handlePreview}
                    onTogglePreview={togglePreview}
                    showPreview={showPreviews.shop_logo}
                  />
                  <FileUpload
                    name="shop_banner"
                    label="Upload Shop Banner"
                    value={previews.shop_banner || userData.shop_banner}
                    accept="image/*"
                    preview={handlePreview}
                    onTogglePreview={togglePreview}
                    showPreview={showPreviews.shop_banner}
                  />
                </div>
              </section>
            )}

            {!isEditing && (
              <section className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Uploaded Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {renderDocument("Adhaar Card", "adhaarCardFile")}
                  {renderDocument("PAN Card", "panCardFile")}
                  {renderDocument("GST Document", "gstFile")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {renderDocument("Shop Logo", "shop_logo")}
                  {renderDocument("Shop Banner", "shop_banner")}
                </div>
              </section>
            )}

            <section className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Two-Factor Authentication
              </h3>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600">
                  Two Factor Authentication is currently{" "}
                  <span
                    className={
                      userData.is_2fa_enabled
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {userData.is_2fa_enabled ? "Enabled" : "Disabled"}
                  </span>
                </p>
                <button
                  onClick={handleToggle2FA}
                  className={`px-4 py-2 text-white rounded-md ${
                    userData.is_2fa_enabled
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-blue-500 hover:bg-blue-600"
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
            </section>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-red-500">
                Deactivate Account
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {userData.deactivation_requested
                  ? "Your deactivation request is pending approval. You will be notified once it is processed."
                  : "Once you deactivate your account, there is no going back. Please be certain."}
              </p>
            </div>
            {!userData.deactivation_requested ? (
              <button
                className="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600 text-sm transition-colors disabled:opacity-50"
                onClick={() => setShowDeactivationModal(true)}
                disabled={isLoading}
              >
                Request To Deactivate
              </button>
            ) : (
              <button
                className="px-4 py-2 text-white bg-gray-400 rounded-md text-sm cursor-not-allowed"
                disabled
              >
                Request Pending
              </button>
            )}
          </div>
        </div>

        {/* Document Viewer Modal */}
        {viewerModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
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
                <img
                  src={viewerModal.document}
                  alt={viewerModal.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={closeDocumentViewer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivation Modal */}
        {showDeactivationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  ? "Disabling Two-Factor Authentication will reduce the security of your account. You will no longer receive OTP verification for sensitive actions."
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
                    userData.is_2fa_enabled ? handleToggle2FA : handleVerify2FA
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

        {/* Bank Verification Modal */}
        {showBankVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Add Bank Details
                </h3>
                <button
                  onClick={() => setShowBankVerificationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter your bank details for verification.
              </p>
              <div className="flex flex-col space-y-4 mb-4">
                <div>
                  <label className="text-sm text-gray-600">Name at Bank</label>
                  <input
                    type="text"
                    name="name_at_bank"
                    value={bankData.name_at_bank}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={bankData.bank_name}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="account_number"
                    value={bankData.account_number}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">IFSC Code</label>
                  <input
                    type="text"
                    name="ifsc_code"
                    value={bankData.ifsc_code}
                    onChange={handleBankChange}
                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowBankVerificationModal(false)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBank}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    "Add Bank Details"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
