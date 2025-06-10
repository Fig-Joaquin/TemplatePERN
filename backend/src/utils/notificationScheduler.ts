import cron from "node-cron";
import { LessThan } from "typeorm";
import { AppDataSource } from "../config/ormconfig";
import { Notification } from "../entities/notificationEntity";
import { WorkOrder } from "../entities";

const workOrderRepo = AppDataSource.getRepository(WorkOrder);
const notifRepo = AppDataSource.getRepository(Notification);

export function startNotificationCron(): void {
  const check = async (): Promise<void> => {
    const cutoff = new Date(Date.now() - 1 * 60 * 1000);
    const orders = await workOrderRepo.find({
      where: { order_status: "not_started", order_date: LessThan(cutoff) }
    });

    for (const o of orders) {
      const exists = await notifRepo.findOneBy({ work_order_id: o.work_order_id });
      if (!exists) {
        const msg = `Orden #${o.work_order_id} no iniciada después de 24h`;
        await notifRepo.save({ work_order_id: o.work_order_id, message: msg });
      }
    }
  };

  // Ejecuta **ahora mismo** al arrancar
  // eslint-disable-next-line no-console
  check().catch(console.error);

  // Y luego cada minuto
  cron.schedule("* * * * *", check);
}

