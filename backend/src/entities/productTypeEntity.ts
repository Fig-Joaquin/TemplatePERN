import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { IsString, Length } from "class-validator";
import { ProductCategory } from "./productCategoryEntity";
import { Product } from "./productEntity";

@Entity("product_types")
export class ProductType {
    @PrimaryGeneratedColumn()
    product_type_id!: number;

    @Column()
    product_category_id!: number;

    @ManyToOne(() => ProductCategory, category => category.product_types, { nullable: false })
    @JoinColumn({ name: "product_category_id" })
    category!: ProductCategory;

    @Column({ length: 50 })
    @IsString()
    @Length(2, 50, { message: "El nombre del tipo debe tener entre 2 y 50 caracteres" })
    type_name!: string;

    @OneToMany(() => Product, product => product.type)
    products!: Product[];
}