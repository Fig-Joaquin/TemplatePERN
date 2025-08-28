import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from "typeorm";
import { IsString, IsNumber, Min } from "class-validator";
import { Vehicle, Quotation, Debtor, WorkProductDetail, WorkPayment } from "..";
import { WorkOrderTechnician } from "./workOrderTechnician";

@Entity("work_orders")
export class WorkOrder {
    @PrimaryGeneratedColumn()
    work_order_id!: number;

    @OneToMany(() => Debtor, (debtor) => debtor.workOrder, { cascade: true, onDelete: "CASCADE" })
    debtors!: Debtor[];

    @OneToMany(() => WorkPayment, (payment) => payment.work_order, { cascade: true, onDelete: "CASCADE" })
    payments!: WorkPayment[];

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;
    
    @OneToMany(() => WorkProductDetail, (detail) => detail.work_order, { cascade: true })
    productDetails!: WorkProductDetail[];    

    @ManyToOne(() => Quotation, { nullable: true })
    @JoinColumn({ name: "quotation_id" })
    quotation!: Quotation;

    @OneToMany(() => WorkOrderTechnician, (wot) => wot.workOrder, { cascade: true, onDelete: "CASCADE" })
    technicians!: WorkOrderTechnician[];

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El monto total no puede ser negativo" })
    total_amount!: number;

    @Column({ 
        type: "enum",
        enum: ["finished", "in_progress", "not_started"],
        default: "not_started"
    })
    @IsString()
    order_status!: string;

    @Column({ type: "text", nullable: true })
    @IsString()
    description!: string;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    order_date!: Date;
}
