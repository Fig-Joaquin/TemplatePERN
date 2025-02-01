import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Length } from "class-validator";
import { VehicleModel } from "./vehicleModelEntity";

@Entity("vehicle_brands")
export class VehicleBrand {
    @PrimaryGeneratedColumn()
    vehicle_brand_id!: number;

    @Column({ length: 50, unique: true })
    @IsString()
    @Length(2, 50, { message: "El nombre de la marca debe tener entre 2 y 50 caracteres" })
    brand_name!: string;

    @OneToMany(() => VehicleModel, model => model.brand)
    models!: VehicleModel[];
}