import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { IsString, Length, IsInt, Min, Max } from "class-validator";
import { VehicleModel, Person, MileageHistory, Company} from "../";

@Entity("vehicles")
export class Vehicle {
    @PrimaryGeneratedColumn()
    vehicle_id!: number;


    @ManyToOne(() => VehicleModel, { nullable: false })
    @JoinColumn({ name: "vehicle_model_id" })
    model!: VehicleModel;

    @ManyToOne(() => Person, { nullable: true })
    @JoinColumn({ name: "person_id" })
    owner!: Person;

    @ManyToOne(() => Company, { nullable: true })
    @JoinColumn({ name: "company_id" })
    company!: Company;

    @OneToMany(() => MileageHistory, mileageHistory => mileageHistory.vehicle, { cascade: true })
    mileage_history!: MileageHistory[];

    @Column({ length: 8, unique: true })
    @IsString()
    @Length(6, 8, { message: "La patente debe tener entre 6 y 8 caracteres" })
    license_plate!: string;

    @Column({ 
        type: "enum",
        enum: ["running", "not_running"],
        default: "running"
    })
    vehicle_status!: string;

    @Column()
    @IsInt()
    @Min(1900, { message: "El año no puede ser menor a 1900" })
    @Max(new Date().getFullYear() + 1, { message: "El año no puede ser mayor al próximo año" })
    year!: number;

    @Column({ length: 30 })
    @IsString()
    @Length(3, 30, { message: "El color debe tener entre 3 y 30 caracteres" })
    color!: string;
}