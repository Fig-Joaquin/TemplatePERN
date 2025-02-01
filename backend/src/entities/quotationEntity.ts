import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, Length, IsDate } from "class-validator";
import { Vehicle } from "./vehicleEntity";
import { MileageHistory } from "./mileageHistoryEntity";

@Entity("quotations")
export class Quotation {
    @PrimaryGeneratedColumn()
    quotation_id!: number;

    @Column()
    vehicle_id!: number;

    @Column()
    mileage_history_id!: number;

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @ManyToOne(() => MileageHistory, { nullable: false })
    @JoinColumn({ name: "mileage_history_id" })
    mileage_history!: MileageHistory;

    @Column({ type: "text" })
    @IsString()
    @Length(10, 1000, { message: "La descripción debe tener entre 10 y 1000 caracteres" })
    description!: string;

    @Column({ length: 50 })
    @IsString()
    quotation_status!: string;

    @Column()
    @IsDate()
    entry_date!: Date;
}