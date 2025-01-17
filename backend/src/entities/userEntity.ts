import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { IsInt, Min, Max, IsString, Length, IsBoolean } from "class-validator";

@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    username!: string;

    @Column()
    email!: string;

    @Column()
    password!: string;

    @Column({ default: true })
    isActive!: boolean;
}