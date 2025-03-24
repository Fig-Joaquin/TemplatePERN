import api from "@/utils/axiosConfig";

export const fetchNotifications = async () => {
  const { data } = await api.get("/notifications");
  return data;
};
