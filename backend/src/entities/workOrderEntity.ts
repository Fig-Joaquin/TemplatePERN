import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, IsNumber, Min, IsDate } from "class-validator";
import { Vehicle } from "./vehicleEntity";
import { Quotation } from "./quotationEntity";
import { Person } from "./personsEntity";
import { MileageHistory } from "./mileageHistoryEntity";

@Entity("work_orders")
export class WorkOrder {
    @PrimaryGeneratedColumn()
    work_order_id!: number;

    @Column()
    vehicle_id!: number;

    @Column()
    quotation_id!: number;

    @Column()
    person_id!: number;

    @Column()
    mileage_history_id!: number;

    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @ManyToOne(() => Quotation, { nullable: false })
    @JoinColumn({ name: "quotation_id" })
    quotation!: Quotation;

    @ManyToOne(() => Person, { nullable: false })
    @JoinColumn({ name: "person_id" })
    person!: Person;

    @ManyToOne(() => MileageHistory, { nullable: false })
    @JoinColumn({ name: "mileage_history_id" })
    mileage_history!: MileageHistory;

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

    @Column()
    @IsDate()
    order_date!: Date;
}