import api from "@/utils/axiosConfig";

export const fetchNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};

export const deleteNotification = async (notificationId: number) => {
  const { data } = await api.delete(`/notifications/${notificationId}`);
  return data;
};

export const deleteAllNotifications = async () => {
  const { data } = await api.delete("/notifications");
  return data;
};
