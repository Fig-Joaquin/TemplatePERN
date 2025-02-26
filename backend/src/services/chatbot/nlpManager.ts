// @ts-ignore
import { NlpManager } from 'node-nlp';

class NLPManagerSingleton {
    private static instance: NLPManagerSingleton;
    private manager: InstanceType<typeof NlpManager>;
    private trained: boolean = false;
    private readonly modelPath: string = '../model.nlp';
    private learningData: {
        query: string;
        detectedIntent: string;
        feedback?: 'positive' | 'negative';
        timestamp: number;
    }[] = [];
    private readonly learningDataPath: string = '../learning_data.json';
    private readonly MAX_LEARNING_DATA: number = 1000;

    private constructor() {
        this.manager = new NlpManager({ 
            languages: ['es'],
            forceNER: true,
            threshold: 0.5,
            autoSave: true,
            autoLoad: true,
            modelFileName: this.modelPath
        });
        this.loadLearningData().catch(err => console.error('Error loading learning data:', err));
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

    public getManager(): unknown {
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

    public async process(text: string): Promise<unknown> {
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
            const result = await this.manager.process('es', text);
            
            // Store query for potential learning
            this.recordQuery(text, (result as any).intent || 'unknown');
            
            return result;
        } catch (error) {
            console.error('Error processing text:', error);
            throw new Error('Failed to process text');
        }
    }

    // Record user query for learning
    private recordQuery(query: string, detectedIntent: string): void {
        this.learningData.push({
            query,
            detectedIntent,
            timestamp: Date.now()
        });
        
        // Keep learning data under the maximum size
        if (this.learningData.length > this.MAX_LEARNING_DATA) {
            this.learningData = this.learningData.slice(-this.MAX_LEARNING_DATA);
        }
        
        // Save learning data periodically (every 50 new entries)
        if (this.learningData.length % 50 === 0) {
            this.saveLearningData().catch(err => 
                console.error('Error saving learning data:', err)
            );
        }
    }

    // Record feedback on a response
    public async provideFeedback(query: string, wasCorrect: boolean): Promise<void> {
        try {
            // Find the query in learning data
            const entry = this.learningData.find(entry => entry.query === query);
            if (entry) {
                entry.feedback = wasCorrect ? 'positive' : 'negative';
                await this.saveLearningData();
            }
            
            // If incorrect and we have the right intent, use it for training
            if (!wasCorrect && entry) {
                // This would be handled by a more sophisticated retraining mechanism
                // For now, we just mark it for manual review
                console.log(`Marked query for retraining: "${query}" - Current intent: ${entry.detectedIntent}`);
            }
        } catch (error) {
            console.error('Error providing feedback:', error);
        }
    }

    // Learn from successful interactions
    public async learnFromInteractions(): Promise<void> {
        try {
            const candidatesForLearning = this.learningData
                .filter(entry => entry.feedback === 'positive')
                .slice(-100); // Take last 100 positive examples
            
            if (candidatesForLearning.length > 5) {
                console.log(`Self-learning from ${candidatesForLearning.length} positive interactions...`);
                
                // Add these positive examples to training data
                for (const entry of candidatesForLearning) {
                    if (entry.detectedIntent !== 'unknown') {
                        this.addDocument(entry.detectedIntent, entry.query);
                    }
                }
                
                // Retrain the model with new examples
                this.trained = false;
                await this.train();
                console.log('Self-learning complete');
            }
        } catch (error) {
            console.error('Error during self-learning:', error);
        }
    }

    private async saveLearningData(): Promise<void> {
        try {
            const fs = require('fs');
            const path = require('path');
            const dataDir = path.dirname(this.learningDataPath);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            await fs.promises.writeFile(
                this.learningDataPath, 
                JSON.stringify(this.learningData), 
                'utf8'
            );
        } catch (error) {
            console.error('Error saving learning data:', error);
        }
    }

    private async loadLearningData(): Promise<void> {
        try {
            const fs = require('fs');
            if (fs.existsSync(this.learningDataPath)) {
                const data = await fs.promises.readFile(this.learningDataPath, 'utf8');
                this.learningData = JSON.parse(data);
                console.log(`Loaded ${this.learningData.length} learning data entries`);
            }
        } catch (error) {
            console.error('Error loading learning data:', error);
            this.learningData = [];
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

    public enhanceCustomEntities(): void {
        // Entidades más precisas con expresiones regulares mejoradas
        this.manager.addRegexEntity('price', 'es', /\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?)\b/);
        this.manager.addRegexEntity('date', 'es', /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\b/);
        
        // Añadir más entidades del dominio automotriz
        this.addNamedEntityText('vehicle_part', 'filter', ['es'], ['filtro', 'filtros', 'filtro de aceite', 'filtro de aire']);
        this.addNamedEntityText('vehicle_part', 'oil', ['es'], ['aceite', 'lubricante', 'aceite de motor']);
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

    public settings(): unknown {
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
    
    // Schedule periodic self-learning
    public schedulePeriodicLearning(intervalHours = 24): void {
        setInterval(() => {
            this.learnFromInteractions().catch(error => 
                console.error('Error in scheduled learning:', error)
            );
        }, intervalHours * 60 * 60 * 1000);
        
        console.log(`Scheduled self-learning every ${intervalHours} hours`);
    }
}

// Inicializar el singleton
const instance = NLPManagerSingleton.getInstance();
instance.initializeEntities().catch((error) => console.error('Error initializing entities:', error));

// Schedule self-learning every 24 hours
instance.schedulePeriodicLearning(24);

export const nlpManager = instance;
