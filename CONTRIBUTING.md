# Guide de Contribution

Merci de votre intérêt pour contribuer au projet RAG PDF avec OCR Mistral ! 🎉

## Comment Contribuer

### 1. Fork et Clone

```bash
# Fork le repository sur GitHub
# Puis cloner votre fork
git clone https://github.com/VOTRE-USERNAME/rag-pdf-mistral-ocr.git
cd rag-pdf-mistral-ocr
```

### 2. Configuration de l'Environnement

```bash
# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env
# Éditer .env avec vos clés API

# Démarrer les services
docker-compose up -d
```

### 3. Créer une Branche

```bash
git checkout -b feature/ma-nouvelle-fonctionnalite
# ou
git checkout -b fix/correction-bug
```

### 4. Faire les Modifications

- Suivez les conventions de code existantes
- Ajoutez des tests si nécessaire
- Mettez à jour la documentation si applicable

### 5. Tester

```bash
# Lancer les tests
npm test

# Vérifier le linting
npm run lint
```

### 6. Commit et Push

```bash
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"
git push origin feature/ma-nouvelle-fonctionnalite
```

### 7. Créer une Pull Request

- Allez sur GitHub et créez une Pull Request
- Décrivez clairement vos modifications
- Référencez les issues liées si applicable

## Conventions

### Messages de Commit

Utilisez [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage
- `refactor:` Refactoring
- `test:` Tests
- `chore:` Maintenance

### Style de Code

- Utilisez ESLint et Prettier
- Indentation : 2 espaces
- Quotes : simples
- Semicolons : obligatoires

## Types de Contributions

### 🐛 Rapporter des Bugs

- Utilisez les templates d'issues
- Incluez les étapes de reproduction
- Précisez votre environnement

### 💡 Proposer des Fonctionnalités

- Ouvrez une issue pour discussion
- Décrivez le cas d'usage
- Proposez une implémentation

### 📖 Améliorer la Documentation

- Corrections de typos
- Ajout d'exemples
- Clarifications

### 🧪 Ajouter des Tests

- Tests unitaires
- Tests d'intégration
- Tests de performance

## Code de Conduite

- Soyez respectueux et inclusif
- Acceptez les critiques constructives
- Aidez les nouveaux contributeurs

## Questions ?

- Ouvrez une issue pour les questions générales
- Contactez les mainteneurs pour les questions spécifiques

Merci pour votre contribution ! 🚀