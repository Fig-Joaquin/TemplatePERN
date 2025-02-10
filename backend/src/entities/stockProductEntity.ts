import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { IsNumber, Min } from "class-validator";
import { Product } from "./productEntity";

@Entity("stock_products")
export class StockProduct {
    @PrimaryGeneratedColumn()
    stock_product_id!: number;

    @OneToOne(() => Product, (product) => product.stock, { onDelete: "CASCADE", nullable: true })    // Asegura eliminación en cascada
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ type: "bigint" }) // Usa bigint si manejas grandes cantidades
    @IsNumber()
    @Min(0, { message: "La cantidad no puede ser negativa" })
    quantity!: number;

    @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" })
    updated_at!: Date;
}
