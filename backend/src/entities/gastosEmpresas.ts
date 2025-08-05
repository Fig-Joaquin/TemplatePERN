import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, IsNumber, Min, IsDate } from "class-validator";
import { TipoGasto } from "./tipoGasto";

@Entity("GastoEmpresa")
export class GastoEmpresa {
    @PrimaryGeneratedColumn()
    id_gasto_empresa!: number;

    @ManyToOne(() => TipoGasto, { nullable: false })
    @JoinColumn({ name: "id_tipo_gasto" })
    tipo_gasto!: TipoGasto;

    @Column({ type: "text" })
    @IsString()
    descripcion!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El monto no puede ser negativo" })
    monto!: number;

    @Column()
    @IsDate()
    fecha_gasto!: Date;

    @Column({ length: 50, nullable: true })
    @IsString()
    numero_boleta?: string;
}