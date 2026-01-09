const winston = require('winston');
const config = require('../config/config');

/**
 * Configuration du logger centralisé avec support JSON structuré
 */
class Logger {
  constructor() {
    this.logger = winston.createLogger({
      level: config.get('logLevel'),
      format: this.getLogFormat(),
      defaultMeta: { 
        service: 'rag-pdf-mistral',
        timestamp: new Date().toISOString()
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: winston.format.json()
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.json()
        })
      ]
    });

    // Créer le dossier logs s'il n'existe pas
    this.ensureLogDirectory();
  }

  getLogFormat() {
    if (config.get('logFormat') === 'json') {
      return winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      );
    }
    
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
      })
    );
  }

  ensureLogDirectory() {
    const fs = require('fs');
    const path = require('path');
    
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Log d'information
   */
  info(message, meta = {}) {
    this.logger.info(message, {
      ...meta,
      component: meta.component || 'system'
    });
  }

  /**
   * Log d'erreur avec contexte
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      component: meta.component || 'system'
    };

    if (error) {
      errorMeta.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    this.logger.error(message, errorMeta);
  }

  /**
   * Log d'avertissement
   */
  warn(message, meta = {}) {
    this.logger.warn(message, {
      ...meta,
      component: meta.component || 'system'
    });
  }

  /**
   * Log de debug
   */
  debug(message, meta = {}) {
    this.logger.debug(message, {
      ...meta,
      component: meta.component || 'system'
    });
  }

  /**
   * Log d'événement de traitement de fichier
   */
  logFileProcessing(filename, status, meta = {}) {
    this.info(`File processing: ${status}`, {
      filename,
      status,
      component: 'file-processor',
      ...meta
    });
  }

  /**
   * Log d'événement OCR
   */
  logOCREvent(filename, event, meta = {}) {
    this.info(`OCR event: ${event}`, {
      filename,
      event,
      component: 'ocr-service',
      ...meta
    });
  }

  /**
   * Log d'événement de vectorisation
   */
  logVectorization(filename, event, meta = {}) {
    this.info(`Vectorization: ${event}`, {
      filename,
      event,
      component: 'vector-store',
      ...meta
    });
  }

  /**
   * Log d'événement de chat
   */
  logChatEvent(query, event, meta = {}) {
    this.info(`Chat event: ${event}`, {
      query: query.substring(0, 100), // Limiter la longueur
      event,
      component: 'chat-agent',
      ...meta
    });
  }

  /**
   * Log d'erreur critique avec notification
   */
  logCriticalError(message, error, meta = {}) {
    this.error(`CRITICAL: ${message}`, error, {
      ...meta,
      critical: true,
      component: meta.component || 'system'
    });

    // Déclencher une notification si configurée
    this.triggerNotification(message, error, meta);
  }

  /**
   * Déclencher une notification pour les erreurs critiques
   */
  async triggerNotification(message, error, meta) {
    const webhookUrl = config.get('notificationWebhook');
    if (!webhookUrl) return;

    try {
      const axios = require('axios');
      await axios.post(webhookUrl, {
        text: `🚨 Erreur critique dans RAG PDF System: ${message}`,
        error: error?.message,
        component: meta.component,
        timestamp: new Date().toISOString()
      });
    } catch (notificationError) {
      this.error('Échec de l\'envoi de notification', notificationError, {
        component: 'logger'
      });
    }
  }

  /**
   * Créer un logger enfant avec contexte spécifique
   */
  child(defaultMeta) {
    return {
      info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
      error: (message, error = null, meta = {}) => this.error(message, error, { ...defaultMeta, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta })
    };
  }
}

module.exports = new Logger();