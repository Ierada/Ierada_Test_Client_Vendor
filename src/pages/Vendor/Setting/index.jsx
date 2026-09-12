import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import {
  MdOutlineEmail,
  MdOutlinePhone,
  MdOutlineCalendarToday,
  MdOutlineShield,
  MdOutlineVisibility,
  MdOutlineVisibilityOff,
} from "react-icons/md";
import { BiSolidUser } from "react-icons/bi";
import { BsShieldLock } from "react-icons/bs";
import { changePassword } from "../../../services/api.auth";
import { getVendorDetails } from "../../../services/api.vendor";
import { useAppContext } from "../../../context/AppContext";
import { endVendorSessionAndRedirect } from "../../../utils/userIdentifier";
import { markAuthSessionEnded } from "../../../utils/authSession";
import { notifyOnFail } from "../../../utils/notification/toast";
import { toast } from "react-toastify";

const Setting = () => {
  const { user } = useAppContext();
  const [vendorData, setVendorData] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    Password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    hasLowercase: false,
    hasUppercase: false,
    hasNumberOrSpecial: false,
    notSameAsOld: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getVendorDetails(user.id)
        .then((res) => {
          if (res?.status === 1 && res.data) setVendorData(res.data);
        })
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    const newPass = formData.newPassword;
    const currentPass = formData.Password;
    setPasswordValidations({
      minLength: newPass.length >= 8,
      hasLowercase: /[a-z]/.test(newPass),
      hasUppercase: /[A-Z]/.test(newPass),
      hasNumberOrSpecial: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPass),
      notSameAsOld: newPass !== currentPass && currentPass !== "",
    });
  }, [formData.newPassword, formData.Password]);

  const getPasswordStrength = () => {
    const p = formData.newPassword;
    if (!p) return { label: "", score: 0, color: "" };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;

    if (score <= 2) return { label: "Weak", score: 1, color: "bg-red-500" };
    if (score <= 3) return { label: "Fair", score: 2, color: "bg-orange-400" };
    if (score <= 4) return { label: "Strong", score: 3, color: "bg-green-500" };
    return { label: "Very Strong", score: 4, color: "bg-emerald-600" };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.Password) newErrors.Password = "Current password is required";
    if (!formData.newPassword) newErrors.newPassword = "New password is required";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";

    const allValid = Object.values(passwordValidations).every((v) => v);
    if (formData.newPassword && !allValid) {
      newErrors.newPassword = "Password doesn't meet requirements";
    }
    if (formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const response = await changePassword(user.id, formData);
      if (response?.status === 1) {
        setFormData({ Password: "", newPassword: "", confirmPassword: "" });
        markAuthSessionEnded();
        toast.info("Please login again with your new password.", {
          toastId: "password-changed-relogin",
          autoClose: 4000,
        });
        setTimeout(() => {
          endVendorSessionAndRedirect({ redirect: true, replace: true });
        }, 800);
      } else if (response?.message) {
        notifyOnFail(response.message);
      }
    } catch {}
    setSubmitting(false);
  };

  const handleCancel = () => {
    setFormData({ Password: "", newPassword: "", confirmPassword: "" });
    setErrors({});
  };

  const strength = getPasswordStrength();
  const sellerName = vendorData?.shop_name || `${vendorData?.vendor?.first_name || ""} ${vendorData?.vendor?.last_name || ""}`.trim() || "—";
  const memberSince = vendorData?.created_at
    ? new Date(vendorData.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  const allValid = Object.values(passwordValidations).every((v) => v);

  return (
    <div className="min-h-screen mb-4 text-[black]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[32px] text-txtPage font-semibold font-satoshi">Settings</h1>
        <p className="text-[#6B7280] text-[14px] font-satoshi">Manage your account, security and preferences.</p>
      </div>

      {/* Profile Info Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 mb-6 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <BiSolidUser className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Seller Name</p>
            <p className="text-[13px] font-semibold text-gray-800">{sellerName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <MdOutlineEmail className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Email</p>
            <p className="text-[13px] font-semibold text-gray-800">{vendorData?.email || user?.email || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <MdOutlinePhone className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Mobile Number</p>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-gray-800">{vendorData?.phone || "—"}</p>
              {vendorData?.phone && (
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Verified</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <MdOutlineShield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Vendor ID</p>
            <p className="text-[13px] font-semibold text-gray-800">{vendorData?.vendorId || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <MdOutlineCalendarToday className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Member Since</p>
            <p className="text-[13px] font-semibold text-gray-800">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Change Password Form */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-[16px] font-satoshi font-semibold text-gray-800 mb-1">Change Password</h2>
          <p className="text-[13px] text-gray-400 mb-6">Choose a strong password and keep your account secure.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Current Password</label>
              <input
                type={showPassword ? "text" : "password"}
                name="Password"
                value={formData.Password}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-[#F8F8F8] px-4 py-2.5 pr-10 text-[14px] outline-none focus:ring-2 focus:ring-orange-200 transition"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showPassword ? <MdOutlineVisibilityOff className="w-5 h-5" /> : <MdOutlineVisibility className="w-5 h-5" />}
              </button>
              {errors.Password && <span className="text-red-500 text-xs mt-1 block">{errors.Password}</span>}
            </div>

            {/* New Password */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-gray-700 mb-1">New Password</label>
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-[#F8F8F8] px-4 py-2.5 pr-10 text-[14px] outline-none focus:ring-2 focus:ring-orange-200 transition"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showNewPassword ? <MdOutlineVisibilityOff className="w-5 h-5" /> : <MdOutlineVisibility className="w-5 h-5" />}
              </button>
              {errors.newPassword && <span className="text-red-500 text-xs mt-1 block">{errors.newPassword}</span>}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label className="block text-[13px] font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-[#F8F8F8] px-4 py-2.5 pr-10 text-[14px] outline-none focus:ring-2 focus:ring-orange-200 transition"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                {showConfirmPassword ? <MdOutlineVisibilityOff className="w-5 h-5" /> : <MdOutlineVisibility className="w-5 h-5" />}
              </button>
              {errors.confirmPassword && <span className="text-red-500 text-xs mt-1 block">{errors.confirmPassword}</span>}
            </div>

            {/* Password Strength */}
            {formData.newPassword && (
              <div>
                <p className="text-[12px] text-gray-500 mb-1">
                  Password Strength: <span className="font-semibold text-gray-700">{strength.label}</span>
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strength.color : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#F47954] text-white py-2.5 px-6 rounded-lg font-satoshi text-[14px] font-medium hover:bg-[#e8683e] transition disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Update Password"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg font-satoshi text-[14px] font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Need Help */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                <BsShieldLock className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-800">Need Help?</p>
                <p className="text-[12px] text-gray-400 mb-2">If you're facing any issues, our support team is here to help you.</p>
                <a
                  href="mailto:support@ierada.com"
                  className="inline-block text-[13px] font-medium text-[#F47954] border border-[#F47954] rounded-lg px-4 py-1.5 hover:bg-orange-50 transition"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panels */}
        <div className="space-y-6">
          {/* Password Requirements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <FiCheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-800">Password Requirements</h3>
            </div>
            <p className="text-[12px] text-gray-400 mb-3">Your password must meet the following requirements:</p>
            <ul className="space-y-2">
              {[
                { key: "minLength", label: "Minimum 8 characters" },
                { key: "hasLowercase", label: "At least one lowercase letter" },
                { key: "hasUppercase", label: "At least one uppercase letter" },
                { key: "hasNumberOrSpecial", label: "At least one number or special character" },
                { key: "notSameAsOld", label: "Not same as current password" },
              ].map(({ key, label }) => (
                <li key={key} className="flex items-center gap-2 text-[13px]">
                  <FiCheckCircle
                    className={`w-4 h-4 shrink-0 ${
                      passwordValidations[key] ? "text-green-500" : "text-gray-300"
                    }`}
                  />
                  <span className={passwordValidations[key] ? "text-green-600 font-medium" : "text-gray-500"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Security Tips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <MdOutlineShield className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-[14px] font-semibold text-gray-800">Security Tips</h3>
            </div>
            <ul className="space-y-3">
              {[
                "Use a unique password that you don't use on other websites.",
                "Avoid using personal information like your name or birthdate.",
                "Change your password regularly to keep your account safe.",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                  <span className="text-[#F47954] mt-0.5 shrink-0">🔑</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-100 text-center text-[12px] text-gray-400">
        © 2024 Ierada Marketplace. All rights reserved.{" "}
        <span className="mx-1">·</span>
        <a href="/privacy-policy" className="hover:text-gray-600 underline">Privacy Policy</a>
        <span className="mx-1">·</span>
        <a href="/terms" className="hover:text-gray-600 underline">Terms & Conditions</a>
      </div>
    </div>
  );
};

export default Setting;
