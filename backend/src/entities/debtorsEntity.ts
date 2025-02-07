// Entidad de Deudores
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString } from "class-validator";
import { WorkOrder } from "./workOrderEntity";

@Entity("debtors")
export class Debtor {
    @PrimaryGeneratedColumn()
    debtor_id!: number;

    @ManyToOne(() => WorkOrder, (workOrder) => workOrder.debtors, { nullable: false })
    @JoinColumn({ name: "work_order_id" })
    workOrder!: WorkOrder;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_at!: Date;

    @Column({ length: 255 })
    @IsString()
    description!: string;
}
