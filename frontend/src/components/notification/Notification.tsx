import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle2, AlertCircle, Info, Clock, X, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { formatDate } from "@/utils/formDate";
import { useNavigate, useLocation } from "react-router-dom";
import { deleteNotification, deleteAllNotifications } from "@/services/notification/notificationService";

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
  onClose?: () => void;
}

export default function Notifications({ notifications, setNotifications, onClose }: NotificationsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNotificationClick = (notification: Notification, event: React.MouseEvent) => {
    // Evitar que el click en la X o botones dispare la navegación
    if ((event.target as HTMLElement).closest('.delete-button')) {
      return;
    }

    if (notification.work_order_id) {
      if (onClose) {
        onClose();
      }

      const targetPath = `/admin/orden-trabajo/editar/${notification.work_order_id}`;
      const currentPath = location.pathname;
      const isOnWorkOrderPage = currentPath.includes('/admin/orden-trabajo/editar/');

      if (isOnWorkOrderPage) {
        window.location.href = targetPath;
      } else {
        navigate(targetPath);
      }
    }
  };

  const handleDeleteNotification = async (notificationId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que dispare el click del contenedor
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error("Error eliminando todas las notificaciones:", error);
    }
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const enhancedNotifications = notifications.map((note: any) => {
        if (note.type) return note;

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAllNotifications}
              className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Eliminar todas
            </Button>
          )}
        </div>
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
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className={`border rounded-md shadow-sm p-4 relative ${getNotificationStyles(n.type || "info")} ${n.work_order_id ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={(e) => n.work_order_id ? handleNotificationClick(n, e) : null}
              >
                {/* Botón X para eliminar notificación individual */}
                <button
                  className="delete-button absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors p-1 rounded-full hover:bg-background/50"
                  onClick={(e) => handleDeleteNotification(n.notification_id, e)}
                  title="Eliminar notificación"
                >
                  <X className="h-3 w-3" />
                </button>

                <div className="flex gap-3 pr-6">
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
