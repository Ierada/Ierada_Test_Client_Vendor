import React, { useEffect } from "react";
import { FaEllipsisH } from "react-icons/fa";
import { useState } from "react";
import { IoToggle } from "react-icons/io5";
import { IoToggleOutline, IoToggleSharp } from "react-icons/io5";
import { MdOutlinePhoneAndroid } from "react-icons/md";
import { MdOutlineLaptopChromebook } from "react-icons/md";
import { MdToggleOff } from "react-icons/md";
import { MdToggleOn } from "react-icons/md";
import { changePassword } from "../../../services/api.auth";
import { FiCheckCircle, FiCircle } from "react-icons/fi";
import { useAppContext } from "../../../context/AppContext";
import { endVendorSessionAndRedirect } from "../../../utils/userIdentifier";
import { markAuthSessionEnded } from "../../../utils/authSession";
import { notifyOnFail } from "../../../utils/notification/toast";
import { toast } from "react-toastify";
// import { notifyOnSuccess, notifyOnFail } from '../utils/notification/toast';

const Setting = () => {
  const { user } = useAppContext();
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
    notSameAsOld: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toggles, setToggles] = useState({
    itemUpdate: true,
    itemComment: false,
    buyerReview: true,
    ratingReminders: false,
    meetups: true,
    companyNews: true,
    newLaunches: false,
    monthlyChanges: false,
    newsletter: false,
    followNotifications: true,
  });

  useEffect(() => {
    const newPass = formData.newPassword;
    const currentPass = formData.Password;

    setPasswordValidations({
      minLength: newPass.length >= 8,
      hasLowercase: /[a-z]/.test(newPass),
      hasUppercase: /[A-Z]/.test(newPass),
      notSameAsOld: newPass !== currentPass && currentPass !== "",
    });
  }, [formData.newPassword, formData.Password]);

  const handleToggle = (name) => {
    setToggles((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const validations = Object.values(passwordValidations);
    const allValid = validations.every((v) => v);

    // Existing validations
    if (!formData.Password) newErrors.Password = "Password is required";
    if (!formData.newPassword)
      newErrors.newPassword = "New Password is required";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm Password is required";

    // Add password requirements error
    if (formData.newPassword && !allValid) {
      newErrors.newPassword = "Password doesn't meet requirements";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (
      !formData.Password ||
      !formData.newPassword ||
      !formData.confirmPassword
    ) {
      notifyOnFail("All fields are required.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert("New password and confirm password must match.");
      return;
    }

    try {
      const response = await changePassword(user.id, formData);

      if (response?.status === 1) {
        setFormData({ Password: "", newPassword: "", confirmPassword: "" });
        // Old JWT is invalidated server-side via password_changed_at — force re-login
        // so dashboard calls do not spam "Error reaching the server".
        markAuthSessionEnded();
        toast.info(
          "Please login again with your new password.",
          { toastId: "password-changed-relogin", autoClose: 4000 },
        );
        setTimeout(() => {
          endVendorSessionAndRedirect({ redirect: true, replace: true });
        }, 800);
      } else if (response?.message) {
        notifyOnFail(response.message);
      }
    } catch (err) {
      // changePassword already toasts API errors
    }
  };

  return (
    <div className="min-h-screen mb-4  text-[black]">
      <h1 className="text-[35px] text-txtPage font-semibold font-satoshi mb-6">
        Settings
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 grid grid-cols-1 gap-8">
          <div
            className="bg-white md:p-8 p-2 rounded-md shadow-1
          "
          >
            <h2 className="lg:text-[16px] md:text-[12px] font-satoshi font-medium  mb-8">
              Change password
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
              <form onSubmit={handleSubmit}>
                <div className="space-y-10 flex flex-col justify-between ">
                  {/* Current Password */}
                  <div className="relative">
                    <label className="block">
                      <span className="text-[16px] font-satoshi font-medium">
                        Current password
                      </span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="Password"
                      value={formData.Password}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-none shadow-sm outline-none focus:outline-none focus:ring-0 focus:border-none bg-[#F8F8F8] pr-10"
                    />
                    {errors.Password && (
                      <span className="text-red-500 text-sm">
                        {errors.Password}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3  top-10"
                    >
                      {showPassword ? (
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <label className="block">
                      <span className="text-[16px] font-satoshi font-medium">
                        New password
                      </span>
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-none shadow-sm outline-none focus:outline-none focus:ring-0 focus:border-none bg-[#F8F8F8] pr-10"
                    />
                    {errors.newPassword && (
                      <span className="text-red-500 text-sm block mt-1">
                        {errors.newPassword}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-10"
                    >
                      {showNewPassword ? (
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>

  
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <label className="block">
                      <span className="text-[16px] font-satoshi font-medium">
                        Confirm password
                      </span>
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-none shadow-sm outline-none focus:outline-none focus:ring-0 focus:border-none bg-[#F8F8F8] pr-10"
                    />
                    {errors.confirmPassword && (
                      <span className="text-red-500 text-sm">
                        {errors.confirmPassword}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-10"
                    >
                      {showConfirmPassword ? (
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-5 w-5 text-gray-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-12">
                  <button
                    type="submit"
                    className="   bg-[#0164CE] text-white py-2 px-4 rounded-md font-satoshi text-[14px] font-medium "
                  >
                    Change password
                  </button>
                </div>
              </form>

              <div className="mt-2 text-sm space-y-1">
  <p className="text-[#565E6C] font-medium">Password requirements:</p>
  <ul className="space-y-1">
    <li className={`flex items-center ${passwordValidations.minLength ? 'text-green-500' : 'text-[#565E6C]'}`}>
      {passwordValidations.minLength ? <FiCheckCircle className="mr-1" /> : <FiCircle className="mr-1" />}
      Minimum 8 characters
    </li>
    <li className={`flex items-center ${passwordValidations.hasLowercase ? 'text-green-500' : 'text-[#565E6C]'}`}>
      {passwordValidations.hasLowercase ? <FiCheckCircle className="mr-1" /> : <FiCircle className="mr-1" />}
      At least one lowercase
    </li>
    <li className={`flex items-center ${passwordValidations.hasUppercase ? 'text-green-500' : 'text-[#565E6C]'}`}>
      {passwordValidations.hasUppercase ? <FiCheckCircle className="mr-1" /> : <FiCircle className="mr-1" />}
      At least one uppercase
    </li>
    <li className={`flex items-center ${passwordValidations.notSameAsOld ? 'text-green-500' : 'text-[#565E6C]'}`}>
      {passwordValidations.notSameAsOld ? <FiCheckCircle className="mr-1" /> : <FiCircle className="mr-1" />}
      Not same as current
    </li>
  </ul>
</div>
            </div>

            {/* <div className="flex justify-center mt-12">
              <button
                type="submit"
                className="   bg-[#0164CE] text-white py-2 px-4 rounded-md font-satoshi text-[14px] font-medium "
              >
                Change password
              </button>
            </div> */}
          </div>
        </div>

        {/* Notifications */}
        {/* <div className="bg-white md:p-5 p-3 rounded-md shadow-1 w-full  max-w-sm">
          <div className="bg-white col-span-3">
            <h1 className="text-[24px] font-semibold mb-2 text-[#2B3674]">
              Notifications
            </h1>
            <div className="bg-white p-4 ">
              {[
                { label: "Item update notifications", name: "itemUpdate" },
                { label: "Item comment notifications", name: "itemComment" },
                { label: "Buyer review notifications", name: "buyerReview" },
                {
                  label: "Rating reminders notifications",
                  name: "ratingReminders",
                },
                { label: "Meetups near you notifications", name: "meetups" },
                { label: "Company news notifications", name: "companyNews" },
                { label: "New launches and projects", name: "newLaunches" },
                { label: "Monthly product changes", name: "monthlyChanges" },
                { label: "Subscribe to newsletter", name: "newsletter" },
                {
                  label: "Email me when someone follows me",
                  name: "followNotifications",
                },
              ].map((notification, index) => (
                <div key={index} className="flex items-center space-x-4 mb-2">
                  <div
                    onClick={() => handleToggle(notification.name)}
                    className="cursor-pointer text-2xl"
                  >
                    {toggles[notification.name] ? (
                      <MdToggleOn className="text-[#0164CE]" size={40} />
                    ) : (
                      <MdToggleOff className="text-[#D6E1F2] " size={40} />
                    )}
                  </div>

                  <span className="text-[14px] font-satoshi font-medium text-[#2B3674]">
                    {notification.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Setting;
