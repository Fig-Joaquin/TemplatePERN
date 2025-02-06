import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { IsString, IsNumber, Min } from "class-validator";
import { Vehicle } from "./vehicleEntity";
import { Quotation } from "./quotationEntity";
import { Person } from "./personsEntity";


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



    @ManyToOne(() => Vehicle, { nullable: false })
    @JoinColumn({ name: "vehicle_id" })
    vehicle!: Vehicle;

    @ManyToOne(() => Quotation, { nullable: true })
    @JoinColumn({ name: "quotation_id" })
    quotation!: Quotation;

    @ManyToOne(() => Person, { nullable: false })
    @JoinColumn({ name: "person_id" })
    person!: Person;


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


    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
        order_date!: Date;
}