import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsDate, IsString, Length } from "class-validator";
import { ProductPurchase } from "./productPurchaseEntity";

@Entity("purchase_history")
export class PurchaseHistory {
    @PrimaryGeneratedColumn()
    purchase_history_id!: number;

    @Column()
    @IsDate()
    purchase_date!: Date;

    @Column()
    @IsDate()
    arrival_date!: Date;

    @Column({ type: "text" })
    @IsString()
    @Length(10, 500, { message: "La descripción debe tener entre 10 y 500 caracteres" })
    description!: string;

    @OneToMany(() => ProductPurchase, purchase => purchase.purchase_history)
    purchases!: ProductPurchase[];
}