import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import {  IsString, Length, IsEmail, Matches } from "class-validator";

@Entity("persons")
export class Person {
    @PrimaryGeneratedColumn()
    person_id!: number;

    @Column({ length: 9, unique: true })
    @IsString()
    @Length(8, 9, { message: "RUT debe tener entre 8 y 9 caracteres sin puntos ni guión" })
    @Matches(/^[0-9kK]{8,9}$/, { message: "Formato de RUT inválido" })
    rut!: string;

    @Column({ length: 50 })
    @IsString()
    @Length(2, 50, { message: "Nombre debe tener entre 2 y 50 caracteres" })
    name!: string;

    @Column({ length: 50 })
    @IsString()
    @Length(2, 50, { message: "Primer apellido debe tener entre 2 y 50 caracteres" })
    first_surname!: string;

    @Column({ length: 50, nullable: true })
    @IsString()
    @Length(2, 50, { message: "Segundo apellido debe tener entre 2 y 50 caracteres" })
    second_surname?: string;

    @Column({ length: 100 })
    @IsEmail({}, { message: "Email inválido" })
    @Length(5, 100, { message: "Email debe tener entre 5 y 100 caracteres" })
    email!: string;

    @Column({ length: 15 })
    @IsString()
    @Matches(/^\+?56[0-9]{9}$/, { message: "Formato de teléfono inválido. Debe ser formato chileno (+56)" })
    number_phone!: string;

    @Column({ length: 20 })
    @IsString()
    @Length(2, 20, { message: "Tipo de persona debe tener entre 2 y 20 caracteres" })
    person_type!: string;
}