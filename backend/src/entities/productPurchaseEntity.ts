import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsNumber, Min, IsEnum } from "class-validator";
import { Product } from "./productEntity";
import { PurchaseHistory } from "./purchaseHistoryEntity";
import { Tax } from "./taxEntity";

@Entity("product_purchases")
export class ProductPurchase {
    @PrimaryGeneratedColumn()
    product_purchase_id!: number;

    @Column()
    product_id!: number;

    @Column()
    purchase_history_id!: number;

    @Column()
    tax_id!: number;

    @ManyToOne(() => Product, { nullable: false })
    @JoinColumn({ name: "product_id" })
    product!: Product;

    @ManyToOne(() => PurchaseHistory, { nullable: false })
    @JoinColumn({ name: "purchase_history_id" })
    purchase_history!: PurchaseHistory;

    @ManyToOne(() => Tax, { nullable: false })
    @JoinColumn({ name: "tax_id" })
    tax!: Tax;

    @Column({
        type: "enum",
        enum: ["processed", "returned"],
        default: "processed"
    })
    @IsEnum(["processed", "returned"], { message: "Estado de compra inválido" })
    purchase_status!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio de compra no puede ser negativo" })
    purchase_price!: number;

    @Column()
    @IsNumber()
    @Min(1, { message: "La cantidad debe ser al menos 1" })
    quantity!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio total no puede ser negativo" })
    total_price!: number;
}