# API de Gestion de Collection de Jeux Vidéo

## Description
API RESTful complète pour gérer une collection de jeux vidéo avec MongoDB.

## Installation

```bash
cd server
npm install
```

## Démarrage

```bash
# Mode production
npm start

# Mode développement (avec nodemon)
npm run dev
```

Le serveur démarrera sur `http://localhost:3000`

## Configuration

L'API utilise MongoDB Atlas. La chaîne de connexion est déjà configurée dans `server.js`.

## Fonctionnalités implémentées

### CRUD Complet
- ✅ POST /api/games - Ajouter un jeu
- ✅ GET /api/games - Lister tous les jeux
- ✅ GET /api/games/:id - Obtenir un jeu spécifique
- ✅ PUT /api/games/:id - Modifier un jeu
- ✅ DELETE /api/games/:id - Supprimer un jeu

### Fonctionnalités avancées
- ✅ Recherche par titre/éditeur/développeur
- ✅ Filtres multiples (genre, plateforme, état, favoris, année)
- ✅ Système de favoris (POST /api/games/:id/favorite)
- ✅ Statistiques complètes (GET /api/stats)
- ✅ Export JSON de la collection (GET /api/export)

### Validation des données
- ✅ Validation complète des champs requis
- ✅ Validation des types de données
- ✅ Validation des plages de valeurs (année, score Metacritic, etc.)
- ✅ Messages d'erreur détaillés

### Sécurité et bonnes pratiques
- ✅ CORS activé
- ✅ Validation des ObjectId MongoDB
- ✅ Gestion d'erreurs complète
- ✅ Codes HTTP appropriés
- ✅ Dates automatiques (création/modification)

## Structure des données

```json
{
  "_id": "ObjectId",
  "titre": "string",
  "genre": ["string"],
  "plateforme": ["string"],
  "editeur": "string",
  "developpeur": "string",
  "annee_sortie": "number",
  "metacritic_score": "number",
  "temps_jeu_heures": "number",
  "termine": "boolean",
  "favori": "boolean",
  "date_ajout": "Date",
  "date_modification": "Date"
}
```

## Documentation API

Consultez le fichier `API_DOCUMENTATION.md` pour la documentation complète des endpoints.

## Tests

L'API a été testée avec succès :
- Ajout de jeux ✅
- Liste et filtres ✅
- Favoris ✅
- Statistiques ✅
- Validation ✅

## Exemples de requêtes

### Ajouter un jeu
```bash
curl -X POST http://localhost:3000/api/games \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Elden Ring",
    "genre": ["RPG", "Action"],
    "plateforme": ["PC", "PS5"],
    "editeur": "Bandai Namco",
    "developpeur": "FromSoftware",
    "annee_sortie": 2022,
    "metacritic_score": 96,
    "temps_jeu_heures": 120,
    "termine": true
  }'
```

### Rechercher des jeux RPG
```bash
curl http://localhost:3000/api/games?genre=RPG
```

### Obtenir les statistiques
```bash
curl http://localhost:3000/api/stats
```

## Technologies utilisées
- Node.js
- Express 5.2
- MongoDB 7.0
- CORS

## Auteur
Erwan
