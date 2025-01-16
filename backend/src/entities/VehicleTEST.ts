import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { IsInt, Min, Max, IsString, Length, IsBoolean } from "class-validator";

@Entity("vehicles")
export class Vehicle {
    @PrimaryGeneratedColumn()
    id!: number; // Primary key gestionada por TypeORM

    @Column({ length: 255 })
    @IsString()
    @Length(1, 255, { message: "Brand must be between 1 and 255 characters" })
    brand!: string; // Marca del vehículo

    @Column({ length: 255 })
    @IsString()
    @Length(1, 255, { message: "Model must be between 1 and 255 characters" })
    model!: string; // Modelo del vehículo

    @Column({ type: "int" })
    @IsInt()
    @Min(1886, { message: "Year must be 1886 or later" })
    @Max(new Date().getFullYear(), { message: "Year cannot be in the future" })
    year!: number; // Año del vehículo

    @Column({ default: true })
    @IsBoolean()
    isActive: boolean = true; // Activo o inactivo
}
