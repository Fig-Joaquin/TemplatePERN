import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { IsString, IsOptional, IsNumber, Min, Max } from "class-validator";
import { Vehicle } from "..";


@Entity("quotations")
export class Quotation {
    @PrimaryGeneratedColumn()
    quotation_id!: number;

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @Column({ type: "text", nullable: true })
    @IsOptional()
    @IsString()
    description?: string;

    @Column({
        type: "enum",
        enum: ["approved", "rejected", "pending"],
        default: "pending"
    })
    quotation_status!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    total_price!: number;

    /**
     * Tasa de IVA aplicada al momento de crear la cotización.
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

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    entry_date!: Date;
}