import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { IsNumber, Min, Max } from "class-validator";

@Entity("taxes")
export class Tax {
    @PrimaryGeneratedColumn()
    tax_id!: number;

    @Column({ type: "decimal", precision: 5, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El impuesto no puede ser negativo" })
    @Max(100, { message: "El impuesto no puede ser mayor al 100%" })
    tax_rate!: number;
}