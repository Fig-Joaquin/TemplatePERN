import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { IsNumber, IsNotEmpty, IsString, IsBoolean } from "class-validator";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn()
  notification_id!: number;

  @Column()
  @IsNumber()
  @IsNotEmpty()
  work_order_id!: number;

  @Column("text")
  @IsString()
  @IsNotEmpty()
  message!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column({ default: false })
  @IsBoolean()
  read!: boolean;
}
