import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToMany } from "typeorm";
import { IsString, IsNumber, Min, IsOptional, Max } from "class-validator";
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

    /**
     * Tasa de IVA aplicada al momento de crear la orden de trabajo.
     * Este valor se guarda para mantener la consistencia histórica,
     * independientemente de los cambios futuros en la tabla de impuestos.
     */
    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0, { message: "La tasa de impuesto no puede ser negativa" })
    @Max(100, { message: "La tasa de impuesto no puede ser mayor al 100%" })
    tax_rate?: number;

    /**
     * Subtotal sin IVA (precio neto)
     */
    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    subtotal?: number;

    /**
     * Monto del IVA calculado
     */
    @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
    @IsNumber()
    @IsOptional()
    @Min(0)
    tax_amount?: number;

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
