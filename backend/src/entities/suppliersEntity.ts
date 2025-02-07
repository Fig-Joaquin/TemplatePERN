// Entidad de Proveedores
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Matches, Length } from "class-validator";
import { Product } from "./productEntity";

@Entity("suppliers")
export class Supplier {
    @PrimaryGeneratedColumn()
    supplier_id!: number;

    @Column({ length: 100 })
    @IsString()
    name!: string;

    @Column({ length: 255 })
    @IsString()
    address!: string;

    @Column({ length: 100 })
    @IsString()
    city!: string;

    @Column({ length: 500 })
    @IsString()
    description!: string;

    /* 
    ! +56912345678 ❌ (No permitimos el +) 
    */
    @Column({ length: 15 }) // Máximo 15 por posibles expansiones futuras
    @IsString()
    @Matches(/^56\d{9,13}$/, { message: "Formato inválido. Debe ser 569XXXXXXXX y tener entre 11 y 15 caracteres." })
    @Length(11, 15, { message: "El número debe tener entre 11 y 15 caracteres." })
    phone!: string;

    @OneToMany(() => Product, (product) => product.supplier)
    products!: Product[];
    
}