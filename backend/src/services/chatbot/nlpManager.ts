// @ts-ignore
import { NlpManager } from 'node-nlp';

class NLPManagerSingleton {
    private static instance: NLPManagerSingleton;
    private manager: any;
    private trained: boolean = false;
    private readonly modelPath: string = '../../model.nlp';

    private constructor() {
        this.manager = new NlpManager({ 
            languages: ['es'],
            forceNER: true,
            threshold: 0.5,
            autoSave: true,
            autoLoad: true,
            modelFileName: this.modelPath
        });
    }

    public static getInstance(): NLPManagerSingleton {
        if (!NLPManagerSingleton.instance) {
            NLPManagerSingleton.instance = new NLPManagerSingleton();
        }
        return NLPManagerSingleton.instance;
    }

    public async clear(): Promise<void> {
        try {
            // Crear una nueva instancia del manager
            this.manager = new NlpManager({ 
                languages: ['es'],
                forceNER: true,
                threshold: 0.5,
                autoSave: true,
                autoLoad: true,
                modelFileName: this.modelPath
            });
            
            // Reinicializar el estado
            this.trained = false;
            
            console.log('NLP manager cleared successfully');
        } catch (error) {
            console.error('Error clearing NLP manager:', error);
            throw new Error('Failed to clear NLP manager');
        }
    }

    public getManager(): any {
        return this.manager;
    }

    public async train(): Promise<void> {
        try {
            if (!this.trained) {
                console.log('Starting NLP training...');
                await this.manager.train();
                this.trained = true;
                await this.manager.save();
                console.log('NLP training completed and model saved');
            }
        } catch (error) {
            console.error('Error during training:', error);
            throw new Error('Failed to train NLP model');
        }
    }

    public async process(text: string): Promise<any> {
        try {
            if (!this.trained) {
                try {
                    await this.manager.load(this.modelPath);
                    this.trained = true;
                } catch (error) {
                    console.log('No existing model found, training new model...');
                    await this.train();
                }
            }
            return await this.manager.process('es', text);
        } catch (error) {
            console.error('Error processing text:', error);
            throw new Error('Failed to process text');
        }
    }

    public addDocument(intent: string, text: string): void {
        try {
            this.manager.addDocument('es', text, intent);
            this.trained = false;
        } catch (error) {
            console.error('Error adding document:', error);
            throw new Error('Failed to add document');
        }
    }

    public addEntity(entity: string, option: string, words: string[]): void {
        words.forEach(word => {
            this.manager.addNamedEntityText(entity, option, ['es'], [word]);
        });
        this.trained = false;
    }

    public calculateSimilarity(str1: string, str2: string): number {
        return this.manager.similarity(str1, str2);
    }

    public addAnswer(language: string, intent: string, answer: string): void {
        this.manager.addAnswer(language, intent, answer);
        this.trained = false;
    }

    public addNamedEntityText(entity: string, option: string, languages: string[], words: string[]): void {
        this.manager.addNamedEntityText(entity, option, languages, words);
        this.trained = false;
    }

    public addNamedEntity(entity: string, languages: string[], options: string[]): void {
        this.manager.addNamedEntity(entity, languages, options);
        this.trained = false;
    }

    public addCustomEntities(): void {
        try {
            // Mejoradas las expresiones regulares para mayor precisión
            this.manager.addRegexEntity('clientName', 'es', /(?:cliente|sr\.?|sra\.?|señor|señora|don|doña)\s+([A-ZÁ-Úá-úa-z\s]+)/i);
            this.manager.addRegexEntity('documentNumber', 'es', /\b\d{1,2}(?:\.|,)?\d{3}(?:\.|,)?\d{3}[-]?[0-9kK]?\b/);
            this.manager.addRegexEntity('licensePlate', 'es', /\b[BCDFGHJKLPRSTVWXYZ]{2,4}[\s.-]?[0-9]{2,4}\b/i);
            this.manager.addRegexEntity('phone', 'es', /\b(?:\+?56|0)?\s*[2-9](?:\s*\d){8}\b/);
            this.manager.addRegexEntity('price', 'es', /\$?\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?/);
            
            this.trained = false;
        } catch (error) {
            console.error('Error adding custom entities:', error);
            throw new Error('Failed to add custom entities');
        }
    }

    public async initializeEntities(): Promise<void> {
        try {
            this.addCustomEntities();
            if (!this.trained) {
                await this.train();
            }
        } catch (error) {
            console.error('Error initializing entities:', error);
            throw new Error('Failed to initialize entities');
        }
    }

    public async retrain(newPatterns: { intent: string, pattern: string }[]): Promise<void> {
        // Agregar nuevos patrones
        newPatterns.forEach(({ intent, pattern }) => {
            this.addDocument(intent, pattern);
            
            // Generar y agregar variaciones
            const variations = this.generateVariations(pattern);
            variations.forEach(variation => {
                this.addDocument(intent, variation);
            });
        });

        // Reentrenar el modelo
        await this.train();
        this.trained = true;
        
        // Guardar el modelo actualizado
        await this.manager.save();
    }

    private generateVariations(_pattern: string): string[] {
        // Similar a la función generatePatternVariations en training.ts
        // Implementar lógica de generación de variaciones
        return [];
    }

    public async save(): Promise<void> {
        try {
            await this.manager.save(this.modelPath);
        } catch (error) {
            console.error('Error saving model:', error);
            throw new Error('Failed to save model');
        }
    }

    public settings(): any {
        return this.manager.settings;
    }

    public getEntities(): string[] {
        try {
            return this.manager.entities;
        } catch (error) {
            console.error('Error getting entities:', error);
            return [];
        }
    }

    public getIntents(): string[] {
        try {
            return this.manager.intents;
        } catch (error) {
            console.error('Error getting intents:', error);
            return [];
        }
    }
}

// Inicializar el singleton
const instance = NLPManagerSingleton.getInstance();
instance.initializeEntities().catch((error) => console.error('Error initializing entities:', error));
export const nlpManager = instance;
