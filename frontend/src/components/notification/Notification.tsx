import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2, AlertCircle, Info, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/utils/formDate";
import { useNavigate, useLocation } from "react-router-dom";

interface Notification {
  notification_id: number;
  message: string;
  created_at: string;
  work_order_id?: number;
  type?: "success" | "warning" | "info";
  read?: boolean;
}

interface NotificationsProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onClose?: () => void; // Add this prop to allow closing the popover
}

export default function Notifications({ notifications, setNotifications, onClose }: NotificationsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNotificationClick = (notification: Notification) => {
    if (notification.work_order_id) {
      // Close the popover before navigation to prevent UI slowdowns
      if (onClose) {
        onClose();
      }

      const targetPath = `/admin/orden-trabajo/editar/${notification.work_order_id}`;

      // Check if we're navigating to the same route pattern (just different work order ID)
      const currentPath = location.pathname;
      const isOnWorkOrderPage = currentPath.includes('/admin/orden-trabajo/editar/');

      if (isOnWorkOrderPage) {
        // If we're already on a work order page, force a page refresh by using window.location
        window.location.href = targetPath;
      } else {
        // For normal navigation between different route types, use React Router navigate
        navigate(targetPath);
      }
    }
  };

  useEffect(() => {
    // Process notifications to add type based on content
    if (notifications.length > 0) {
      const enhancedNotifications = notifications.map((note: any) => {
        if (note.type) return note; // Skip if already has type

        const message = note.message.toLowerCase();
        let type: "success" | "warning" | "info" = "info";

        if (message.includes("finaliza") || message.includes("complet") || message.includes("éxito")) {
          type = "success";
        } else if (message.includes("error") || message.includes("falla") || message.includes("urgente")) {
          type = "warning";
        }

        return { ...note, type };
      });

      setNotifications(enhancedNotifications);
    }
  }, [notifications, setNotifications]);

  const getNotificationIcon = (type: "success" | "warning" | "info") => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationStyles = (type: "success" | "warning" | "info") => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
            <Bell className="h-12 w-12 stroke-1 mb-2 opacity-20" />
            <p>Sin nuevas alertas</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map(n => (
              <motion.div
                key={n.notification_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`border rounded-md shadow-sm p-4 ${getNotificationStyles(n.type)} ${n.work_order_id ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={() => n.work_order_id ? handleNotificationClick(n) : null}
              >
                <div className="flex gap-3">
                  {getNotificationIcon(n.type || "info")}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{n.message}</p>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatDate ? formatDate(new Date(n.created_at)) : new Date(n.created_at).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {n.type === "success" ? "Completado" : n.type === "warning" ? "Atención" : "Información"}
                        {n.work_order_id && " • Orden #" + n.work_order_id}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
}
