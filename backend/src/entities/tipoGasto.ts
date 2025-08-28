import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { IsString, Length } from "class-validator";
import { CompanyExpense } from "./gastosEmpresas";

@Entity("expense_types")
export class ExpenseType {
    @PrimaryGeneratedColumn()
    expense_type_id!: number;

    @Column({ length: 100 })
    @IsString()
    @Length(2, 100, { message: "Expense type name must be between 2 and 100 characters" })
    expense_type_name!: string;

    @Column({ type: "text", nullable: true })
    @IsString()
    description?: string;

    @OneToMany(() => CompanyExpense, (expense: CompanyExpense) => expense.expense_type)
    expenses!: CompanyExpense[];
}