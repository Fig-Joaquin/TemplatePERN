// Entidad de Deudores
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, IsNumber, IsOptional } from "class-validator";
import { WorkOrder } from "..";

const clpIntegerTransformer = {
    to: (value?: number | null) => {
        if (value === undefined || value === null) {
            return value;
        }
        return Math.trunc(value);
    },
    from: (value: string | number | null) => {
        if (value === undefined || value === null) {
            return null;
        }
        return Number.parseInt(String(value), 10);
    }
};

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

    @Column({ type: "numeric", precision: 14, scale: 0, nullable: true, transformer: clpIntegerTransformer })
    @IsOptional()
    @IsNumber()
    total_amount?: number;

    @Column({ type: "numeric", precision: 14, scale: 0, default: 0, transformer: clpIntegerTransformer })
    @IsOptional()
    @IsNumber()
    paid_amount?: number;

    @Column({ type: "varchar", length: 50, default: "pendiente" })
    @IsOptional()
    @IsString()
    payment_status?: string; // 'pendiente', 'parcial', 'pagado'
}
