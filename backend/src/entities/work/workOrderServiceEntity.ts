import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    RelationId,
    CreateDateColumn,
    UpdateDateColumn
} from "typeorm";
import { IsNumber, Min } from "class-validator";
import { WorkOrder, Service } from "..";

@Entity("work_order_services")
export class WorkOrderService {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => WorkOrder, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "work_order_id" })
    work_order!: WorkOrder;

    @RelationId((wos: WorkOrderService) => wos.work_order)
    work_order_id!: number;

    @ManyToOne(() => Service, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "service_id" })
    service!: Service;

    @RelationId((wos: WorkOrderService) => wos.service)
    service_id!: number;

    @Column({ type: "integer" })
    @IsNumber()
    @Min(1, { message: "La cantidad debe ser al menos 1" })
    cantidad!: number;

    /**
     * Precio unitario guardado al momento de agregar el servicio.
     * Garantiza consistencia histórica ante cambios futuros en el catálogo.
     */
    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0, { message: "El precio unitario no puede ser negativo" })
    precio_unitario!: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    @IsNumber()
    @Min(0)
    subtotal!: number;

    @CreateDateColumn({ type: "timestamp" })
    created_at!: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updated_at!: Date;
}
