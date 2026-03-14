import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { IsString, Length, IsNumber, Min } from "class-validator";

@Entity("services")
export class Service {
    @PrimaryGeneratedColumn()
    service_id!: number;

    @Column({ length: 100, unique: true })
    @IsString()
    @Length(2, 100, { message: "El nombre del servicio debe tener entre 2 y 100 caracteres" })
    service_name!: string;

    @Column({ type: "text", nullable: true })
    description?: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio base no puede ser negativo" })
    base_price!: number;

    @Column({ type: "boolean", default: true })
    is_active!: boolean;

    @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    created_date!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
