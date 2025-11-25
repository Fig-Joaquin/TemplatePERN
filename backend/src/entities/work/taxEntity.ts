import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";
import { IsNumber, Min, Max, IsBoolean, IsString, IsOptional } from "class-validator";

@Entity("taxes")
@Index("idx_taxes_is_default", ["is_default"])
@Index("idx_taxes_code", ["code"])
export class Tax {
    @PrimaryGeneratedColumn()
    tax_id!: number;

    @Column({ type: "varchar", length: 50, nullable: true })
    @IsString()
    @IsOptional()
    code?: string; // Ej: "IVA", "IVA_REDUCIDO", etc.

    @Column({ type: "varchar", length: 100, nullable: true })
    @IsString()
    @IsOptional()
    name?: string; // Ej: "Impuesto al Valor Agregado"

    @Column({ type: "decimal", precision: 5, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El impuesto no puede ser negativo" })
    @Max(100, { message: "El impuesto no puede ser mayor al 100%" })
    tax_rate!: number;

    @Column({ type: "boolean", default: false })
    @IsBoolean()
    is_default!: boolean; // Indica si es el impuesto activo/por defecto
}