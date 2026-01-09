#!/bin/bash

# Script d'initialisation GitHub pour RAG PDF avec OCR Mistral
# Usage: ./init-github.sh [nom-du-repo]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
REPO_NAME=${1:-"rag-pdf-mistral-ocr"}
DEFAULT_BRANCH="main"

echo "=========================================="
echo "  Initialisation GitHub Repository"
echo "  Nom du repo: $REPO_NAME"
echo "=========================================="
echo

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    log_error "Git n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si GitHub CLI est installé
if ! command -v gh &> /dev/null; then
    log_warning "GitHub CLI (gh) n'est pas installé."
    log_info "Vous devrez créer le repository manuellement sur GitHub."
    CREATE_REPO_MANUALLY=true
else
    CREATE_REPO_MANUALLY=false
fi

# Initialiser le repository Git si ce n'est pas déjà fait
if [ ! -d ".git" ]; then
    log_info "Initialisation du repository Git..."
    git init
    git branch -M $DEFAULT_BRANCH
    log_success "Repository Git initialisé"
else
    log_info "Repository Git déjà initialisé"
fi

# Ajouter tous les fichiers
log_info "Ajout des fichiers au repository..."
git add .

# Vérifier s'il y a des changements à commiter
if git diff --staged --quiet; then
    log_warning "Aucun changement à commiter"
else
    # Premier commit
    log_info "Création du commit initial..."
    git commit -m "feat: initial commit - RAG PDF avec OCR Mistral

- Configuration Docker complète (production)
- Système de logging centralisé avec Winston
- Gestion d'erreurs robuste avec retry logic
- Configuration système avec variables d'environnement
- Documentation utilisateur complète
- Templates GitHub (issues, PR)
- Pipeline CI/CD avec GitHub Actions
- Support pour Mistral AI OCR, Qdrant, Ollama, Google Gemini

Fonctionnalités prévues:
- Upload et traitement automatique de PDF
- OCR intelligent avec Mistral AI
- Vectorisation et recherche sémantique
- Chat intelligent avec citations de sources"

    log_success "Commit initial créé"
fi

# Créer le repository sur GitHub
if [ "$CREATE_REPO_MANUALLY" = false ]; then
    log_info "Création du repository sur GitHub..."
    
    # Vérifier si l'utilisateur est connecté à GitHub CLI
    if ! gh auth status &> /dev/null; then
        log_error "Vous n'êtes pas connecté à GitHub CLI."
        log_info "Exécutez: gh auth login"
        exit 1
    fi
    
    # Créer le repository
    gh repo create "$REPO_NAME" \
        --description "Système RAG complet avec OCR Mistral pour traitement automatique de PDF et chat intelligent" \
        --public \
        --source=. \
        --remote=origin \
        --push
    
    log_success "Repository créé et poussé sur GitHub!"
    
    # Afficher l'URL du repository
    REPO_URL=$(gh repo view --json url --jq .url)
    log_info "URL du repository: $REPO_URL"
    
else
    log_info "Création manuelle du repository nécessaire:"
    echo
    echo "1. Allez sur https://github.com/new"
    echo "2. Nom du repository: $REPO_NAME"
    echo "3. Description: Système RAG complet avec OCR Mistral pour traitement automatique de PDF et chat intelligent"
    echo "4. Choisissez Public ou Private"
    echo "5. NE PAS initialiser avec README, .gitignore ou licence (déjà présents)"
    echo "6. Cliquez sur 'Create repository'"
    echo
    
    read -p "Appuyez sur Entrée une fois le repository créé sur GitHub..."
    
    # Demander l'URL du repository
    read -p "Entrez l'URL de votre repository GitHub (ex: https://github.com/username/repo.git): " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        log_error "URL du repository requise"
        exit 1
    fi
    
    # Ajouter l'origine et pousser
    log_info "Ajout de l'origine et push..."
    git remote add origin "$REPO_URL"
    git push -u origin $DEFAULT_BRANCH
    
    log_success "Code poussé sur GitHub!"
fi

echo
log_success "🎉 Repository GitHub configuré avec succès!"
echo
log_info "Prochaines étapes:"
echo "1. Configurez vos secrets GitHub pour les clés API:"
echo "   - MISTRAL_API_KEY"
echo "   - GEMINI_API_KEY"
echo
echo "2. Activez GitHub Actions dans les paramètres du repository"
echo
echo "3. Créez votre première issue ou commencez à développer!"
echo
echo "4. Pour cloner le repository ailleurs:"
echo "   git clone $REPO_URL"
echo
log_info "Documentation disponible dans README.md"
log_info "Templates d'issues et PR configurés dans .github/"

# Nettoyer le script
rm -f "$0"