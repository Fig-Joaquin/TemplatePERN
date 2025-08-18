import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { IsString, IsOptional } from "class-validator";
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

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    entry_date!: Date;
}