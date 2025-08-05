import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { PaymentType } from "../../entities";
import { PaymentTypeSchema } from "../../schema/paymentTypeValidator";

const paymentTypeRepository = AppDataSource.getRepository(PaymentType);

export const getAllPaymentTypes = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const paymentTypes = await paymentTypeRepository.find();
        res.json(paymentTypes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los tipos de pago", error });
    }
};

export const getPaymentTypeById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        
        const paymentType = await paymentTypeRepository.findOneBy({ payment_type_id: id });
        if (!paymentType) {
            res.status(404).json({ message: "Tipo de pago no encontrado" });
            return;
        }
        
        res.json(paymentType);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el tipo de pago", error });
    }
};

export const createPaymentType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = PaymentTypeSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }

        const { type_name } = validationResult.data;
        
        // Verificar si ya existe un tipo de pago con el mismo nombre
        const existingPaymentType = await paymentTypeRepository.findOneBy({ type_name });
        if (existingPaymentType) {
            res.status(409).json({ message: `El tipo de pago '${type_name}' ya existe.` });
            return;
        }

        const newPaymentType = paymentTypeRepository.create(validationResult.data);
        await paymentTypeRepository.save(newPaymentType);
        
        res.status(201).json({ message: "Tipo de pago creado exitosamente", paymentType: newPaymentType });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el tipo de pago", error });
    }
};

export const updatePaymentType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }
        
        const paymentType = await paymentTypeRepository.findOneBy({ payment_type_id: id });
        if (!paymentType) {
            res.status(404).json({ message: "Tipo de pago no encontrado" });
            return;
        }

        const validationResult = PaymentTypeSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
                errors: validationResult.error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }

        // Si se está actualizando el nombre, verificar que no exista otro tipo con ese nombre
        if (validationResult.data.type_name && 
            validationResult.data.type_name !== paymentType.type_name) {
            const existingPaymentType = await paymentTypeRepository.findOneBy({ 
                type_name: validationResult.data.type_name 
            });
            if (existingPaymentType) {
                res.status(409).json({ 
                    message: `El tipo de pago '${validationResult.data.type_name}' ya existe.` 
                });
                return;
            }
        }

        paymentTypeRepository.merge(paymentType, validationResult.data);
        await paymentTypeRepository.save(paymentType);
        
        res.json({ message: "Tipo de pago actualizado exitosamente", paymentType });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el tipo de pago", error });
    }
};

export const deletePaymentType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        // Verificar si existen pagos asociados a este tipo (necesitarías una relación en la entidad)
        // Aquí habría que implementar esa verificación si tienes una relación inversa
        
        const result = await paymentTypeRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Tipo de pago no encontrado" });
            return;
        }

        res.json({ message: "Tipo de pago eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el tipo de pago", error });
    }
};