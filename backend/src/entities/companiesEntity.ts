import { WorkOrder } from "./workOrderEntity";
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Length, IsEmail } from "class-validator";

@Entity("companies")
export class Company {
    @PrimaryGeneratedColumn()
    company_id!: number;

    @Column({ length: 12, unique: true })
    @IsString()
    @Length(9, 12, { message: "El RUT debe tener entre 9 y 12 caracteres" })
    rut!: string;

    @Column({ length: 100 })
    @IsString()
    @Length(2, 100, { message: "El nombre debe tener entre 2 y 100 caracteres" })
    name!: string;

    @Column({ length: 100 })
    @IsString()
    @IsEmail({}, { message: "Email inválido" })
    email!: string;

    @OneToMany(() => WorkOrder, (workOrder) => workOrder.company)
    workOrders!: WorkOrder[];
}
