import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsInt, Min, IsDate } from "class-validator";
import { Vehicle } from "./vehicleEntity";

@Entity("mileage_history")
export class MileageHistory {
    @PrimaryGeneratedColumn()
    mileage_history_id!: number;

    @Column()
    vehicle_id!: number;

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @Column()
    @IsInt()
    @Min(0, { message: "El kilometraje no puede ser negativo" })
    current_mileage!: number;

    @Column()
    @IsDate()
    registration_date!: Date;
}