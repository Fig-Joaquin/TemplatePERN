import { toast } from "react-toastify";

export const showSuccessToast = (message: string) => {
  toast.success(message, { position: "top-right", autoClose: 3000 });
};

export const showErrorToast = (message: string) => {
  toast.error(message, { position: "top-right", autoClose: 3000 });
};
