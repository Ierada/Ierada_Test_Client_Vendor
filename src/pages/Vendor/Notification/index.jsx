import React, { useState, useEffect, useRef } from "react";
import {
  deleteNotification,
  getNotifications,
  markNotificationAsRead,
} from "../../../services/api.notification";
import { useAppContext } from "../../../context/AppContext";
import { FaCheckCircle, FaTrashAlt } from "react-icons/fa";

const VendorNotification = () => {
  const { user, setTriggerHeaderCounts } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const hasFetched = useRef(false);

  const fetchNotifications = async (reset = false) => {
    if (loading) return;
    setLoading(true);

    try {
      const currentOffset = reset ? 0 : offset;
      const res = await getNotifications(user.id, 10, currentOffset);

      if (res?.data) {
        setNotifications((prev) => (reset ? res.data : [...prev, ...res.data]));
        setOffset(reset ? 10 : currentOffset + 10);
        setHasMore(res.data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setOffset(0);
    setHasMore(true);
    await fetchNotifications(true);
  };

  const handleNotificationRead = async (id) => {
    const res = await markNotificationAsRead(id);
    if (res) {
      await refreshNotifications();
      setTriggerHeaderCounts((prev) => !prev);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await deleteNotification(id);
      if (res) {
        await refreshNotifications();
        setTriggerHeaderCounts((prev) => !prev);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      refreshNotifications();
    }
  }, [user.id]);
  return (
    <main className="space-y-8 p-4 md:p-6 lg:p-8">
      <p className="text-3xl font-semibold text-black-2 mb-10">Notifications</p>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex justify-between items-center border py-3 px-4 hover:bg-gray-100 transition ${
            notification.is_read ? "bg-gray-50" : "bg-gray-200"
          }`}
        >
          <div
            className="flex-1 cursor-pointer"
            onClick={() => handleNotificationRead(notification.id)}
          >
            <p className="text-[#2D3954] text-sm font-poppins font-normal">
              {notification.message}
            </p>
            <div className="text-right text-[#2D3954] text-sm font-poppins font-normal flex space-x-2">
            <p>
  {`${new Date(notification.created_at).toLocaleDateString()} - ${new Date(notification.created_at).toLocaleDateString("en-US", {
    weekday: "long",
  })}`}
</p>
<p>
  {new Date(notification.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}
</p>

            </div>
          </div>
          <div className="flex items-center space-x-3">
            {!notification.is_read && (
              <FaCheckCircle
                title="Mark as Read"
                className="text-green-500 cursor-pointer text-lg"
                onClick={() => handleNotificationRead(notification.id)}
              />
            )}
            <FaTrashAlt
              title="Delete Notification"
              className="text-red-500 cursor-pointer text-lg"
              onClick={() => handleDeleteNotification(notification.id)}
            />
          </div>
        </div>
      ))}

      {loading && (
        <p className="text-center text-[#2D3954] text-sm">
          Loading notifications...
        </p>
      )}

      {!loading && hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={() => fetchNotifications(false)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-poppins rounded hover:bg-[#1B283C] transition"
          >
            Load More
          </button>
        </div>
      )}

      {!hasMore && (
        <p className="text-center text-[#2D3954] text-sm mt-4">
          {notifications.length === 0
            ? "No new notifications."
            : "No more notifications."}
        </p>
      )}
    </main>
  );
};

export default VendorNotification;
