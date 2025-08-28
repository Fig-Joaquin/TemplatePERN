import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPaymentFieldsToDebtors1693500000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columna total_amount
        await queryRunner.addColumn("debtors", new TableColumn({
            name: "total_amount",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: true
        }));

        // Agregar columna paid_amount
        await queryRunner.addColumn("debtors", new TableColumn({
            name: "paid_amount",
            type: "decimal",
            precision: 10,
            scale: 2,
            isNullable: false,
            default: 0
        }));

        // Agregar columna payment_status
        await queryRunner.addColumn("debtors", new TableColumn({
            name: "payment_status",
            type: "varchar",
            length: "50",
            isNullable: false,
            default: "'pending'"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar las columnas en orden inverso
        await queryRunner.dropColumn("debtors", "payment_status");
        await queryRunner.dropColumn("debtors", "paid_amount");
        await queryRunner.dropColumn("debtors", "total_amount");
    }
}
