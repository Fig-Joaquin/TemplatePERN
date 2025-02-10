import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { IsString, Length } from "class-validator";

@Entity("payment_types")
export class PaymentType {
    @PrimaryGeneratedColumn()
    payment_type_id!: number;

    @Column({ length: 50, unique: true })
    @IsString()
    @Length(2, 50, { message: "El nombre del tipo de pago debe tener entre 2 y 50 caracteres" })
    type_name!: string;
}