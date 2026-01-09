const dotenv = require('dotenv');
const winston = require('winston');

// Charger les variables d'environnement
dotenv.config();

// Logger pour la configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

/**
 * Configuration système avec valeurs par défaut et validation
 */
class SystemConfig {
  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  loadConfiguration() {
    const config = {
      // Configuration des dossiers
      inputDirectory: process.env.INPUT_DIRECTORY || './input',
      outputDirectory: process.env.OUTPUT_DIRECTORY || './output',
      errorDirectory: process.env.ERROR_DIRECTORY || './error',
      
      // Configuration serveur
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
      
      // Configuration OCR Mistral
      mistralApiKey: process.env.MISTRAL_API_KEY,
      ocrModel: process.env.OCR_MODEL || 'mistral-ocr-latest',
      mistralApiUrl: process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1',
      
      // Configuration Vector Store
      qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
      qdrantCollection: process.env.QDRANT_COLLECTION || 'smart-realization',
      embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text:latest',
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      chunkSize: parseInt(process.env.CHUNK_SIZE) || 2000,
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200,
      
      // Configuration Chat
      geminiApiKey: process.env.GEMINI_API_KEY,
      maxContextChunks: parseInt(process.env.MAX_CONTEXT_CHUNKS) || 5,
      maxResponseTime: parseInt(process.env.MAX_RESPONSE_TIME) || 5000,
      
      // Configuration Redis/Bull
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      
      // Configuration logging
      logLevel: process.env.LOG_LEVEL || 'info',
      logFormat: process.env.LOG_FORMAT || 'json',
      
      // Configuration retry
      maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
      
      // Configuration performance
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800, // 50MB
      concurrentProcessing: parseInt(process.env.CONCURRENT_PROCESSING) || 3,
      
      // Configuration notifications
      notificationWebhook: process.env.NOTIFICATION_WEBHOOK,
      adminEmail: process.env.ADMIN_EMAIL
    };

    // Log des valeurs par défaut utilisées
    this.logDefaultValues(config);
    
    return config;
  }

  validateConfiguration() {
    const required = [
      'mistralApiKey',
      'geminiApiKey'
    ];

    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      const error = `Configuration manquante pour: ${missing.join(', ')}`;
      logger.error(error);
      throw new Error(error);
    }

    // Validation des URLs
    this.validateUrls();
    
    // Validation des valeurs numériques
    this.validateNumericValues();
    
    logger.info('Configuration validée avec succès');
  }

  validateUrls() {
    const urls = [
      { name: 'qdrantUrl', value: this.config.qdrantUrl },
      { name: 'ollamaUrl', value: this.config.ollamaUrl },
      { name: 'mistralApiUrl', value: this.config.mistralApiUrl }
    ];

    urls.forEach(({ name, value }) => {
      try {
        new URL(value);
      } catch (error) {
        logger.warn(`URL invalide pour ${name}: ${value}`);
      }
    });
  }

  validateNumericValues() {
    const numericFields = [
      'port', 'chunkSize', 'chunkOverlap', 'maxContextChunks',
      'maxResponseTime', 'maxRetries', 'retryDelay', 'maxFileSize',
      'concurrentProcessing'
    ];

    numericFields.forEach(field => {
      if (isNaN(this.config[field]) || this.config[field] <= 0) {
        logger.warn(`Valeur numérique invalide pour ${field}: ${this.config[field]}`);
      }
    });
  }

  logDefaultValues(config) {
    const defaultsUsed = [];
    
    if (!process.env.INPUT_DIRECTORY) defaultsUsed.push('INPUT_DIRECTORY');
    if (!process.env.OUTPUT_DIRECTORY) defaultsUsed.push('OUTPUT_DIRECTORY');
    if (!process.env.ERROR_DIRECTORY) defaultsUsed.push('ERROR_DIRECTORY');
    if (!process.env.PORT) defaultsUsed.push('PORT');
    if (!process.env.QDRANT_URL) defaultsUsed.push('QDRANT_URL');
    if (!process.env.OLLAMA_URL) defaultsUsed.push('OLLAMA_URL');
    if (!process.env.CHUNK_SIZE) defaultsUsed.push('CHUNK_SIZE');
    
    if (defaultsUsed.length > 0) {
      logger.warn(`Utilisation des valeurs par défaut pour: ${defaultsUsed.join(', ')}`);
    }
  }

  get(key) {
    return this.config[key];
  }

  getAll() {
    return { ...this.config };
  }
}

module.exports = new SystemConfig();