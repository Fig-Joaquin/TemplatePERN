import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { IsString, Length } from "class-validator";
import { Vehicle } from "..";


@Entity("quotations")
export class Quotation {
    @PrimaryGeneratedColumn()
    quotation_id!: number;

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @Column({ type: "text" })
    @IsString()
    @Length(10, 1000, { message: "La descripción debe tener entre 10 y 1000 caracteres" })
    description!: string;

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