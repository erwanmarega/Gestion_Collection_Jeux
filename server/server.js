const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "../public")));

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;
const JWT_SECRET = process.env.JWT_SECRET;

let db, gamesCollection, usersCollection;

function validateGame(game, isUpdate = false) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (!isUpdate || game.titre !== undefined) {
    if (
      !game.titre ||
      typeof game.titre !== "string" ||
      game.titre.trim().length === 0
    ) {
      errors.push(
        "Le titre est requis et doit être une chaîne de caractères non vide"
      );
    }
  }

  if (!isUpdate || game.genre !== undefined) {
    if (!Array.isArray(game.genre) || game.genre.length === 0) {
      errors.push("Le genre est requis et doit être un tableau non vide");
    }
  }

  if (!isUpdate || game.plateforme !== undefined) {
    if (!Array.isArray(game.plateforme) || game.plateforme.length === 0) {
      errors.push("La plateforme est requise et doit être un tableau non vide");
    }
  }

  if (game.annee_sortie !== undefined) {
    if (
      typeof game.annee_sortie !== "number" ||
      game.annee_sortie < 1970 ||
      game.annee_sortie > currentYear
    ) {
      errors.push(`L'année de sortie doit être entre 1970 et ${currentYear}`);
    }
  }

  if (game.metacritic_score !== undefined) {
    if (
      typeof game.metacritic_score !== "number" ||
      game.metacritic_score < 0 ||
      game.metacritic_score > 100
    ) {
      errors.push("Le score Metacritic doit être entre 0 et 100");
    }
  }

  if (game.temps_jeu_heures !== undefined) {
    if (
      typeof game.temps_jeu_heures !== "number" ||
      game.temps_jeu_heures < 0
    ) {
      errors.push("Le temps de jeu doit être un nombre positif");
    }
  }

  return errors;
}

function validateUser(user) {
  const errors = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !user.email ||
    typeof user.email !== "string" ||
    !emailRegex.test(user.email)
  ) {
    errors.push("L'email est requis et doit être valide");
  }

  if (
    !user.password ||
    typeof user.password !== "string" ||
    user.password.length < 6
  ) {
    errors.push(
      "Le mot de passe est requis et doit contenir au moins 6 caractères"
    );
  }

  if (
    user.nom &&
    (typeof user.nom !== "string" || user.nom.trim().length === 0)
  ) {
    errors.push("Le nom doit être une chaîne de caractères non vide");
  }

  return errors;
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token d'authentification manquant" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide ou expiré" });
    }
    req.user = decoded;
    next();
  });
}

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    db = client.db(DB_NAME);
    gamesCollection = db.collection(COLLECTION_NAME);
    usersCollection = db.collection("users");

    await usersCollection.createIndex({ email: 1 }, { unique: true });
  } catch (error) {
    process.exit(1);
  }
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const userData = req.body;

    const errors = validateUser(userData);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation échouée", details: errors });
    }

    const existingUser = await usersCollection.findOne({
      email: userData.email,
    });
    if (existingUser) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
      email: userData.email,
      password: hashedPassword,
      nom: userData.nom || "",
      date_creation: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign(
      { userId: result.insertedId, email: userData.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user: {
        id: result.insertedId,
        email: newUser.email,
        nom: newUser.nom,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la création de l'utilisateur" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Email ou mot de passe incorrect" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur serveur lors de la connexion" });
  }
});

app.post("/api/games", authenticateToken, async (req, res) => {
  try {
    const gameData = req.body;

    const errors = validateGame(gameData);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation échouée", details: errors });
    }

    const newGame = {
      ...gameData,
      userId: new ObjectId(req.user.userId),
      termine: gameData.termine || false,
      favori: false,
      date_ajout: new Date(),
      date_modification: new Date(),
    };

    const result = await gamesCollection.insertOne(newGame);
    const insertedGame = await gamesCollection.findOne({
      _id: result.insertedId,
    });

    res.status(201).json({
      message: "Jeu ajouté avec succès",
      game: insertedGame,
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du jeu:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout du jeu" });
  }
});

app.get("/api/games", authenticateToken, async (req, res) => {
  try {
    const { genre, plateforme, termine, annee_sortie, favori, search } =
      req.query;
    const filter = { userId: new ObjectId(req.user.userId) };

    if (genre) filter.genre = { $in: genre.split(",") };
    if (plateforme) filter.plateforme = { $in: plateforme.split(",") };
    if (termine !== undefined) filter.termine = termine === "true";
    if (favori !== undefined) filter.favori = favori === "true";
    if (annee_sortie) filter.annee_sortie = parseInt(annee_sortie);
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: "i" } },
        { editeur: { $regex: search, $options: "i" } },
        { developpeur: { $regex: search, $options: "i" } },
      ];
    }

    const games = await gamesCollection
      .find(filter)
      .sort({ date_ajout: -1 })
      .toArray();

    res.status(200).json({
      count: games.length,
      games,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des jeux:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération des jeux" });
  }
});

app.get("/api/games/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const game = await gamesCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.userId),
    });

    if (!game) {
      return res.status(404).json({ error: "Jeu non trouvé" });
    }

    res.status(200).json(game);
  } catch (error) {
    console.error("Erreur lors de la récupération du jeu:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la récupération du jeu" });
  }
});

app.put("/api/games/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    // Validation
    const errors = validateGame(updateData, true);
    if (errors.length > 0) {
      return res
        .status(400)
        .json({ error: "Validation échouée", details: errors });
    }

    delete updateData._id;
    delete updateData.date_ajout;
    delete updateData.userId;

    updateData.date_modification = new Date();

    const result = await gamesCollection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Jeu non trouvé" });
    }

    const updatedGame = await gamesCollection.findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      message: "Jeu mis à jour avec succès",
      game: updatedGame,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du jeu:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la mise à jour du jeu" });
  }
});

app.delete("/api/games/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const result = await gamesCollection.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.userId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Jeu non trouvé" });
    }

    res.status(200).json({ message: "Jeu supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du jeu:", error);
    res
      .status(500)
      .json({ error: "Erreur serveur lors de la suppression du jeu" });
  }
});

app.post("/api/games/:id/favorite", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const game = await gamesCollection.findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(req.user.userId),
    });

    if (!game) {
      return res.status(404).json({ error: "Jeu non trouvé" });
    }

    const newFavoriteStatus = !game.favori;

    await gamesCollection.updateOne(
      { _id: new ObjectId(id), userId: new ObjectId(req.user.userId) },
      {
        $set: {
          favori: newFavoriteStatus,
          date_modification: new Date(),
        },
      }
    );

    res.status(200).json({
      message: newFavoriteStatus
        ? "Jeu ajouté aux favoris"
        : "Jeu retiré des favoris",
      favori: newFavoriteStatus,
    });
  } catch (error) {
    console.error("Erreur lors de la modification du favori:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.userId);

    const totalGames = await gamesCollection.countDocuments({ userId });
    const gamesTermines = await gamesCollection.countDocuments({
      userId,
      termine: true,
    });
    const gamesFavoris = await gamesCollection.countDocuments({
      userId,
      favori: true,
    });

    const tempsJeuResult = await gamesCollection
      .aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: "$temps_jeu_heures" } } },
      ])
      .toArray();
    const tempsJeuTotal = tempsJeuResult[0]?.total || 0;

    const metacriticResult = await gamesCollection
      .aggregate([
        { $match: { userId, metacritic_score: { $exists: true, $ne: null } } },
        { $group: { _id: null, moyenne: { $avg: "$metacritic_score" } } },
      ])
      .toArray();
    const metacriticMoyenne = metacriticResult[0]?.moyenne || 0;

    const genresResult = await gamesCollection
      .aggregate([
        { $match: { userId } },
        { $unwind: "$genre" },
        { $group: { _id: "$genre", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    const plateformesResult = await gamesCollection
      .aggregate([
        { $match: { userId } },
        { $unwind: "$plateforme" },
        { $group: { _id: "$plateforme", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    res.status(200).json({
      total_jeux: totalGames,
      jeux_termines: gamesTermines,
      jeux_favoris: gamesFavoris,
      temps_jeu_total_heures: Math.round(tempsJeuTotal),
      metacritic_moyenne: Math.round(metacriticMoyenne * 10) / 10,
      repartition_genres: genresResult,
      repartition_plateformes: plateformesResult,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    res.status(500).json({
      error: "Erreur serveur lors de la récupération des statistiques",
    });
  }
});

app.get("/api/export", authenticateToken, async (req, res) => {
  try {
    const games = await gamesCollection
      .find({ userId: new ObjectId(req.user.userId) })
      .toArray();

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=games_collection.json"
    );
    res.status(200).json({
      export_date: new Date(),
      total_games: games.length,
      games,
    });
  } catch (error) {
    console.error("Erreur lors de l'export:", error);
    res.status(500).json({ error: "Erreur serveur lors de l'export" });
  }
});

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API disponible sur http://localhost:${PORT}/api`);
  });
});
