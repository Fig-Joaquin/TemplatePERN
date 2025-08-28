import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { IsString, IsNumber, Min, IsDate } from "class-validator";
import { ExpenseType } from "./tipoGasto";

@Entity("company_expenses")
export class CompanyExpense {
    @PrimaryGeneratedColumn()
    company_expense_id!: number;

    @ManyToOne(() => ExpenseType, { nullable: false })
    @JoinColumn({ name: "expense_type_id" })
    expense_type!: ExpenseType;

    @Column({ type: "text" })
    @IsString()
    description!: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "Amount cannot be negative" })
    amount!: number;

    @Column()
    @IsDate()
    expense_date!: Date;

    @Column({ length: 50, nullable: true })
    @IsString()
    receipt_number?: string;
}