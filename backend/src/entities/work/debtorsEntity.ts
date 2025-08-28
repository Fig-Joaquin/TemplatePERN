// Entidad de Deudores
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, IsNumber, IsOptional } from "class-validator";
import { WorkOrder } from "..";

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

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    @IsOptional()
    @IsNumber()
    total_amount?: number;

    @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
    @IsOptional()
    @IsNumber()
    paid_amount?: number;

    @Column({ type: "varchar", length: 50, default: "pendiente" })
    @IsOptional()
    @IsString()
    payment_status?: string; // 'pendiente', 'parcial', 'pagado'
}
