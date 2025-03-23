import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Length, IsEmail } from "class-validator";
import { Vehicle } from "../vehicles/vehicleEntity";

@Entity("companies")
export class Company {
    @PrimaryGeneratedColumn()
    company_id!: number;

    @Column({ length: 12, unique: true })
    @IsString()
    @Length(8, 12, { message: "El RUT debe tener entre 9 y 12 caracteres" })
    rut!: string;

    @Column({ length: 100 })
    @IsString()
    @Length(2, 100, { message: "El nombre debe tener entre 2 y 100 caracteres" })
    name!: string;

    @Column({ length: 100, nullable: true })
    @IsString()
    @IsEmail({}, { message: "Email inválido" })
    email!: string;

    @Column({ length: 12, nullable: true })
    @IsString()
    @Length(7, 12, { message: "El teléfono debe tener entre 7 y 12 caracteres" })
    phone?: string;

    @OneToMany(() => Vehicle, (vehicle) => vehicle.company)
    vehicles!: Vehicle[];
}
