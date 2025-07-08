import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Length } from "class-validator";
import { Gasto } from "./gastosEmpresas"; // Adjust the import path as necessary

@Entity("tipo_gasto")
export class TipoGasto {
    @PrimaryGeneratedColumn()
    id_tipo_gasto!: number;

    @Column({ length: 100 })
    @IsString()
    @Length(2, 100, { message: "El nombre del tipo de gasto debe tener entre 2 y 100 caracteres" })
    nombre_tipo_gasto!: string;

    @Column({ type: "text", nullable: true })
    @IsString()
    descripcion?: string;

    @OneToMany(() => Gasto, gasto => gasto.tipo_gasto)
    gastos!: Gasto[];
}