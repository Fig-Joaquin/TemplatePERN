// Entidad de Stock de Productos
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsNumber, Min } from "class-validator";
import { Product } from "./productEntity";

@Entity("stock_products")
export class StockProduct {
    @PrimaryGeneratedColumn()
    stock_product_id!: number;

    @ManyToOne(() => Product, (product) => product.stock, { nullable: false })
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column()
    @IsNumber()
    @Min(0, { message: "La cantidad no puede ser negativa" })
    quantity!: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    updated_at!: Date;
}
