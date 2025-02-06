import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { IsInt, Min } from "class-validator";
import { Vehicle } from "./vehicleEntity";

@Entity("mileage_history")
export class MileageHistory {
    @PrimaryGeneratedColumn()
    mileage_history_id!: number;

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @Column()
    @IsInt()
    @Min(0, { message: "El kilometraje no puede ser negativo" })
    current_mileage!: number;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    registration_date!: Date;
}
