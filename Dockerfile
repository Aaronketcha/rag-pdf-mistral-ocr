# Dockerfile pour le système RAG PDF avec OCR Mistral
FROM node:18-alpine

# Métadonnées
LABEL maintainer="RAG System Developer"
LABEL description="Système RAG complet avec OCR Mistral pour traitement automatique de PDF"
LABEL version="1.0.0"

# Installation des dépendances système
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Création de l'utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S raguser -u 1001 -G nodejs

# Définition du répertoire de travail
WORKDIR /app

# Copie des fichiers de configuration des dépendances
COPY package*.json ./

# Installation des dépendances Node.js
RUN npm ci --only=production && \
    npm cache clean --force

# Copie du code source
COPY --chown=raguser:nodejs . .

# Création des dossiers nécessaires avec permissions appropriées
RUN mkdir -p input output error logs && \
    chown -R raguser:nodejs input output error logs

# Exposition du port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Changement vers l'utilisateur non-root
USER raguser

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Commande de démarrage
CMD ["npm", "start"]