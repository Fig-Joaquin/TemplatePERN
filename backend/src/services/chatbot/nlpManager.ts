// @ts-ignore
import { NlpManager } from 'node-nlp';

class NLPManagerSingleton {
    private static instance: NLPManagerSingleton;
    private manager: any;
    private trained: boolean = false;

    private constructor() {
        this.manager = new NlpManager({ 
            languages: ['es'],
            forceNER: true,
            threshold: 0.5
        });
    }

    public static getInstance(): NLPManagerSingleton {
        if (!NLPManagerSingleton.instance) {
            NLPManagerSingleton.instance = new NLPManagerSingleton();
        }
        return NLPManagerSingleton.instance;
    }

    public getManager(): any {
        return this.manager;
    }

    public async train(): Promise<void> {
        if (!this.trained) {
            await this.manager.train();
            this.trained = true;
        }
    }

    public async process(text: string): Promise<any> {
        if (!this.trained) {
            await this.train();
        }
        return this.manager.process('es', text);
    }

    public addDocument(intent: string, text: string): void {
        this.manager.addDocument('es', text, intent);
        this.trained = false;
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

    // Agregar método para entidades personalizadas
    public addCustomEntities(): void {
        // Entidad para nombres propios
        this.manager.addRegexEntity('clientName', 'es', /(?:cliente|sr\.|sra\.|señor|señora)?\s+([A-ZÁ-Úá-úa-z]+)\s*/i);
        
        // Entidad para números de documentos
        this.manager.addRegexEntity('documentNumber', 'es', /\b\d{7,8}[-]?[0-9kK]?\b/);
        
        // Entidad para patentes de vehículos
        this.manager.addRegexEntity('licensePlate', 'es', /\b[A-Z]{2,4}[\s-]?\d{2,4}\b/i);

        this.trained = false;
    }

    public async initializeEntities(): Promise<void> {
        this.addCustomEntities();
        if (!this.trained) {
            await this.train();
        }
    }
}

// Inicializar el singleton con las entidades personalizadas
(async () => {
    const instance = NLPManagerSingleton.getInstance();
    await instance.initializeEntities();
})();

export const nlpManager = NLPManagerSingleton.getInstance();
