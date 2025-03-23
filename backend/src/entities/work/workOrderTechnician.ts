import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
} from "typeorm";
import { WorkOrder, Person } from "..";

@Entity("work_order_technicians")
export class WorkOrderTechnician {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.technicians, { nullable: false })
  @JoinColumn({ name: "work_order_id" })
  workOrder!: WorkOrder;

  @ManyToOne(() => Person, { nullable: false })
  @JoinColumn({ name: "technician_id" })
  technician!: Person;

  @Column({
    type: "enum",
    enum: ["active", "inactive"],
    default: "active",
  })
  status!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  assigned_at!: Date;
}
