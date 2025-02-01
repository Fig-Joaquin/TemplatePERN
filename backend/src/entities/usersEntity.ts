import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, Length, Matches } from "class-validator";
import { Person } from "./personsEntity"; // Asegúrate de que la ruta de importación sea correcta

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id_usuario!: number;

    @Column()
    id_persona!: number;

    @ManyToOne(() => Person, { nullable: false })
    @JoinColumn({ name: "id_persona" })
    persona!: Person;

    @Column({ length: 20 })
    @IsString()
    @Length(3, 20, { message: "Rol de usuario debe tener entre 3 y 20 caracteres" })
    rol_usuario!: string;

    @Column({ length: 30, unique: true })
    @IsString()
    @Length(4, 30, { message: "Nombre de usuario debe tener entre 4 y 30 caracteres" })
    @Matches(/^[a-zA-Z0-9_]+$/, { 
        message: "Nombre de usuario solo puede contener letras, números y guión bajo" 
    })
    nombre_usuario!: string;

    @Column({ length: 60 }) // Longitud apropiada para hash bcrypt
    @IsString()
    @Length(8, 60, { message: "Contraseña debe tener al menos 8 caracteres" })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        { message: "Contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial" }
    )
    contrasenia!: string;
}