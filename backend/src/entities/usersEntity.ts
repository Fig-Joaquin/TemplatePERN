import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, Length, Matches } from "class-validator";
import { Person } from "./personsEntity";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    user_id!: number;

    @Column()
    person_id!: number;

    @ManyToOne(() => Person, { nullable: false })
    @JoinColumn({ name: "person_id" })
    person!: Person;

    @Column({ length: 20 })
    @IsString()
    @Length(3, 20, { message: "Rol de usuario debe tener entre 3 y 20 caracteres" })
    user_role!: string;

    @Column({ length: 30, unique: true })
    @IsString()
    @Length(4, 30, { message: "Nombre de usuario debe tener entre 4 y 30 caracteres" })
    @Matches(/^[a-zA-Z0-9_]+$/, { 
        message: "Nombre de usuario solo puede contener letras, números y guión bajo" 
    })
    username!: string;

    @Column({ length: 60 })
    @IsString()
    @Length(8, 60, { message: "Contraseña debe tener al menos 8 caracteres" })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        { message: "Contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial" }
    )
    password!: string;
}