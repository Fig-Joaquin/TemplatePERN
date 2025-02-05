// src/repositories/mileageHistoryRepository.ts
import { AppDataSource } from "../config/ormconfig";
import { MileageHistory } from "../entities/mileageHistoryEntity";

/**
 * Repositorio para acceder a la entidad MileageHistory.
 */
export const mileageHistoryRepository = AppDataSource.getRepository(MileageHistory);
