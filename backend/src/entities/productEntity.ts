import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, Length, IsNumber, Min } from "class-validator";
import { ProductType } from "./productTypeEntity";

@Entity("products")
export class Product {
    @PrimaryGeneratedColumn()
    product_id!: number;


    @ManyToOne(() => ProductType, type => type.products, { nullable: false })
    @JoinColumn({ name: "product_type_id" })
    type!: ProductType;

    @Column({ length: 100 })
    @IsString()
    @Length(2, 100, { message: "El nombre del producto debe tener entre 2 y 100 caracteres" })
    product_name!: string;

    @Column({ type: "decimal", precision: 5, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El margen de ganancia no puede ser negativo" })
    profit_margin!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de última compra no puede ser negativo" })
    last_purchase_price!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de venta no puede ser negativo" })
    sale_price!: number;

    @Column({ type: "text" })
    @IsString()
    description!: string;

    @Column()
    @IsNumber()
    @Min(0, { message: "La cantidad de productos no puede ser negativa" })
    product_quantity!: number;
}