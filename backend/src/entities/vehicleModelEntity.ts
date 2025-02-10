import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, Length } from "class-validator";
import { VehicleBrand } from "./vehicleBrandEntity";

@Entity("vehicle_models")
export class VehicleModel {
    @PrimaryGeneratedColumn()
    vehicle_model_id!: number;


    @ManyToOne(() => VehicleBrand, { nullable: false })
    @JoinColumn({ name: "vehicle_brand_id" })
    brand!: VehicleBrand;

    @Column({ length: 50 })
    @IsString()
    @Length(2, 50, { message: "El nombre del modelo debe tener entre 2 y 50 caracteres" })
    model_name!: string;
}