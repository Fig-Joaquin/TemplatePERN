import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Length } from "class-validator";
import { ProductType } from "./productTypeEntity";

@Entity("product_categories")
export class ProductCategory {
    @PrimaryGeneratedColumn()
    product_category_id!: number;

    @Column({ length: 50, unique: true })
    @IsString()
    @Length(2, 50, { message: "El nombre de la categoría debe tener entre 2 y 50 caracteres" })
    category_name!: string;

    @OneToMany(() => ProductType, type => type.category)
    product_types!: ProductType[];
}