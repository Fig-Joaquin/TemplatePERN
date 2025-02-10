import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { IsString, IsNumber, Min } from "class-validator";
import { Product } from "../";

@Entity("product_history")
export class ProductHistory {
    @PrimaryGeneratedColumn()
    product_history_id!: number;

    @ManyToOne(() => Product, (product) => product.history, { nullable: false })
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @Column({ length: 500 })
    @IsString()
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de última compra no puede ser negativo" })
    last_purchase_price!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de venta no puede ser negativo" })
    sale_price!: number;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
