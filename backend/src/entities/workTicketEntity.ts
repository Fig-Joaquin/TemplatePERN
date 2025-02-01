import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, Length, IsDate } from "class-validator";
import { WorkOrder } from "./workOrderEntity";

@Entity("work_tickets")
export class WorkTicket {
    @PrimaryGeneratedColumn()
    work_ticket_id!: number;

    @Column()
    work_order_id!: number;

    @ManyToOne(() => WorkOrder, { nullable: false })
    @JoinColumn({ name: "work_order_id" })
    work_order!: WorkOrder;

    @Column({ type: "text" })
    @IsString()
    @Length(10, 1000, { message: "La descripción debe tener entre 10 y 1000 caracteres" })
    description!: string;

    @Column({ length: 50 })
    @IsString()
    ticket_status!: string;

    @Column()
    @IsDate()
    ticket_date!: Date;
}