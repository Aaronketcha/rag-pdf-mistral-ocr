const logger = require('./logger');
const config = require('../config/config');
const fs = require('fs').promises;
const path = require('path');

/**
 * Gestionnaire d'erreurs centralisé avec retry logic et gestion des fichiers
 */
class ErrorHandler {
  constructor() {
    this.maxRetries = config.get('maxRetries');
    this.baseDelay = config.get('retryDelay');
  }

  /**
   * Gestion d'erreur OCR avec retry et déplacement de fichier
   */
  async handleOCRError(error, filePath, attempt = 1) {
    const filename = path.basename(filePath);
    
    logger.error('Erreur OCR', error, {
      component: 'ocr-service',
      filename,
      attempt,
      filePath
    });

    if (attempt < this.maxRetries) {
      const delay = this.calculateBackoffDelay(attempt);
      logger.info(`Retry OCR dans ${delay}ms`, {
        component: 'ocr-service',
        filename,
        attempt: attempt + 1
      });
      
      await this.sleep(delay);
      return { retry: true, nextAttempt: attempt + 1 };
    }

    // Déplacer le fichier vers le dossier d'erreur après échec final
    await this.moveToErrorDirectory(filePath, `OCR failed after ${this.maxRetries} attempts: ${error.message}`);
    
    return { 
      retry: false, 
      error: `OCR processing failed for ${filename}: ${error.message}` 
    };
  }

  /**
   * Gestion d'erreur de vectorisation avec retry
   */
  async handleVectorizationError(error, document, attempt = 1) {
    logger.error('Erreur de vectorisation', error, {
      component: 'vector-store',
      documentId: document.id,
      filename: document.filename,
      attempt
    });

    if (attempt < this.maxRetries) {
      const delay = this.calculateBackoffDelay(attempt);
      logger.info(`Retry vectorisation dans ${delay}ms`, {
        component: 'vector-store',
        documentId: document.id,
        attempt: attempt + 1
      });
      
      await this.sleep(delay);
      return { retry: true, nextAttempt: attempt + 1 };
    }

    // Déplacer le fichier source vers le dossier d'erreur
    if (document.filePath) {
      await this.moveToErrorDirectory(
        document.filePath, 
        `Vectorization failed after ${this.maxRetries} attempts: ${error.message}`
      );
    }

    return { 
      retry: false, 
      error: `Vectorization failed for ${document.filename}: ${error.message}` 
    };
  }

  /**
   * Gestion d'erreur de chat avec fallback
   */
  handleChatError(error, query) {
    logger.error('Erreur de chat', error, {
      component: 'chat-agent',
      query: query.substring(0, 100)
    });

    return {
      answer: "Désolé, je rencontre actuellement des difficultés techniques. Veuillez réessayer dans quelques instants.",
      sources: [],
      confidence: 0,
      error: true
    };
  }

  /**
   * Gestion d'erreur API avec retry et backoff exponentiel
   */
  async handleAPIError(error, apiName, requestData, attempt = 1) {
    logger.error(`Erreur API ${apiName}`, error, {
      component: 'api-client',
      apiName,
      attempt,
      statusCode: error.response?.status,
      responseData: error.response?.data
    });

    // Erreurs non-retriables (4xx sauf 429)
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
      return { 
        retry: false, 
        error: `API ${apiName} error: ${error.message}` 
      };
    }

    if (attempt < this.maxRetries) {
      const delay = this.calculateBackoffDelay(attempt);
      logger.info(`Retry API ${apiName} dans ${delay}ms`, {
        component: 'api-client',
        apiName,
        attempt: attempt + 1
      });
      
      await this.sleep(delay);
      return { retry: true, nextAttempt: attempt + 1 };
    }

    return { 
      retry: false, 
      error: `API ${apiName} failed after ${this.maxRetries} attempts: ${error.message}` 
    };
  }

  /**
   * Déplacer un fichier vers le dossier d'erreur avec informations
   */
  async moveToErrorDirectory(filePath, errorInfo) {
    try {
      const filename = path.basename(filePath);
      const errorDir = config.get('errorDirectory');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const errorFilename = `${timestamp}_${filename}`;
      const errorPath = path.join(errorDir, errorFilename);
      const infoPath = path.join(errorDir, `${timestamp}_${filename}.error.txt`);

      // Créer le dossier d'erreur s'il n'existe pas
      await fs.mkdir(errorDir, { recursive: true });

      // Déplacer le fichier
      await fs.rename(filePath, errorPath);

      // Créer le fichier d'information d'erreur
      const errorDetails = {
        originalPath: filePath,
        errorTime: new Date().toISOString(),
        errorInfo,
        movedTo: errorPath
      };

      await fs.writeFile(infoPath, JSON.stringify(errorDetails, null, 2));

      logger.info('Fichier déplacé vers dossier d\'erreur', {
        component: 'error-handler',
        originalPath: filePath,
        errorPath,
        errorInfo
      });

    } catch (moveError) {
      logger.error('Échec du déplacement vers dossier d\'erreur', moveError, {
        component: 'error-handler',
        originalPath: filePath
      });
    }
  }

  /**
   * Calcul du délai de backoff exponentiel avec jitter
   */
  calculateBackoffDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% de jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 secondes
  }

  /**
   * Utilitaire de sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gestion d'erreur critique avec notification
   */
  async handleCriticalError(error, context = {}) {
    logger.logCriticalError('Erreur critique système', error, context);

    // Ici on pourrait ajouter d'autres actions critiques comme :
    // - Arrêt gracieux de certains services
    // - Sauvegarde d'état
    // - Escalade vers monitoring externe
  }

  /**
   * Middleware Express pour gestion d'erreurs
   */
  expressErrorHandler() {
    return (error, req, res, next) => {
      logger.error('Erreur Express', error, {
        component: 'express',
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
      });

      const statusCode = error.statusCode || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'Erreur interne du serveur' 
        : error.message;

      res.status(statusCode).json({
        error: true,
        message,
        timestamp: new Date().toISOString()
      });
    };
  }

  /**
   * Gestionnaire d'erreurs non capturées
   */
  setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
      logger.logCriticalError('Exception non capturée', error, {
        component: 'process'
      });
      
      // Arrêt gracieux
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.logCriticalError('Promise rejection non gérée', new Error(reason), {
        component: 'process',
        promise: promise.toString()
      });
    });
  }
}

module.exports = new ErrorHandler();