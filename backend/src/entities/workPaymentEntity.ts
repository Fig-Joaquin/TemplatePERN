import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsNumber, Min, IsDate, IsString } from "class-validator";
import { PaymentType } from "./paymentTypeEntity";
import { WorkOrder } from "./workOrderEntity";

@Entity("work_payments")
export class WorkPayment {
    @PrimaryGeneratedColumn()
    work_payment_id!: number;


    @ManyToOne(() => PaymentType, { nullable: false })
    @JoinColumn({ name: "payment_type_id" })
    payment_type!: PaymentType;

    @ManyToOne(() => WorkOrder, { nullable: false })
    @JoinColumn({ name: "work_order_id" })
    work_order!: WorkOrder;

    @Column({ length: 50 })
    @IsString()
    payment_status!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El monto pagado no puede ser negativo" })
    amount_paid!: number;

    @Column()
    @IsDate()
    payment_date!: Date;
}