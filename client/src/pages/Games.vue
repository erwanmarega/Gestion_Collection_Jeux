<template>
  <div class="min-h-screen bg-white">
    <header class="border-b border-gray-200">
      <div
        class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"
      >
        <h1 class="text-xl font-bold text-gray-900">Ma Collection de Jeux</h1>
        <div class="flex gap-3">
          <button
            @click="showAddModal = true"
            class="px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            + Ajouter un jeu
          </button>
          <button
            @click="handleLogout"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"
        ></div>
      </div>

      <div
        v-else-if="error"
        class="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-center"
      >
        {{ error }}
      </div>

      <div v-else-if="games.length === 0" class="text-center py-12">
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Aucun jeu</h3>
        <p class="text-gray-500">Ajoutez votre premier jeu à la collection !</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="game in games"
          :key="game._id"
          class="border border-gray-200 rounded-lg p-5 hover:border-gray-400 transition-colors"
        >
          <div class="flex justify-between items-start mb-3 ">
            <h3 class="text-lg font-semibold text-gray-900">
              {{ game.titre }}
            </h3>
            <button
              @click="toggleFavorite(game._id)"
              class="text-2xl"
              :title="
                game.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'
              "
            >
              <template v-if="game.favori">
                <svg
                  class="w-6 h-6 border-2 border-sky-500 dark:text-black"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z"
                  />
                </svg>
              </template>
              <template v-else>
                <svg
                  class="w-6 h-6 border-2 border-gray-300 hover:border-gray-500 dark:text-black"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                ></svg>
              </template>
            </button>
          </div>

          <div class="space-y-2 text-sm text-gray-600 mb-4">
            <p>
              <span class="font-semibold">Genre:</span>
              {{ game.genre?.join(", ") }}
            </p>
            <p>
              <span class="font-semibold">Plateforme:</span>
              {{ game.plateforme?.join(", ") }}
            </p>
            <p v-if="game.annee_sortie">
              <span class="font-semibold">Année:</span> {{ game.annee_sortie }}
            </p>
            <p v-if="game.metacritic_score">
              <span class="font-semibold">Score:</span>
              {{ game.metacritic_score }}/100
            </p>
          </div>

          <div class="flex items-center justify-between">
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-medium',
                game.termine
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700',
              ]"
            >
              {{ game.termine ? "Terminé" : "En cours" }}
            </span>

            <button
              @click="deleteGame(game._id)"
              class="text-red-500 hover:text-red-700 font-medium text-sm"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </main>

    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center p-4 z-50"
      @click.self="showAddModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 class="text-xl font-bold text-gray-900 mb-6">Ajouter un jeu</h2>

        <form @submit.prevent="handleAddGame" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Titre *</label
            >
            <input
              v-model="newGame.titre"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="The Legend of Zelda"
            />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Genres *</label
            >
            <input
              v-model="genresInput"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Action, Aventure"
            />
            <p class="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >Plateformes *</label
            >
            <input
              v-model="platformsInput"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Nintendo Switch, PC"
            />
            <p class="text-xs text-gray-500 mt-1">Séparez par des virgules</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Année</label
              >
              <input
                v-model.number="newGame.annee_sortie"
                type="number"
                min="1970"
                :max="new Date().getFullYear()"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2"
                >Score</label
              >
              <input
                v-model.number="newGame.metacritic_score"
                type="number"
                min="0"
                max="100"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="newGame.termine"
              type="checkbox"
              id="termine"
              class="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
            />
            <label for="termine" class="ml-2 text-sm text-gray-700"
              >Jeu terminé</label
            >
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="addingGame"
              class="flex-1 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {{ addingGame ? "Ajout..." : "Ajouter" }}
            </button>
            <button
              type="button"
              @click="showAddModal = false"
              class="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import api from "../services/api";

const { logout } = useAuth();

const games = ref([]);
const loading = ref(true);
const error = ref("");
const showAddModal = ref(false);
const addingGame = ref(false);

const genresInput = ref("");
const platformsInput = ref("");

const newGame = ref({
  titre: "",
  genre: [],
  plateforme: [],
  annee_sortie: null,
  metacritic_score: null,
  termine: false,
});

const emit = defineEmits(["logout"]);

const loadGames = async () => {
  try {
    loading.value = true;
    error.value = "";
    const response = await api.getGames();
    games.value = response.games;
  } catch (err) {
    error.value = err.message || "Erreur lors du chargement des jeux";
  } finally {
    loading.value = false;
  }
};

const handleAddGame = async () => {
  try {
    addingGame.value = true;
    error.value = "";

    const gameData = {
      ...newGame.value,
      genre: genresInput.value
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      plateforme: platformsInput.value
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
    };

    await api.createGame(gameData);

    showAddModal.value = false;
    newGame.value = {
      titre: "",
      genre: [],
      plateforme: [],
      annee_sortie: null,
      metacritic_score: null,
      termine: false,
    };
    genresInput.value = "";
    platformsInput.value = "";

    await loadGames();
  } catch (err) {
    error.value = err.message || "Erreur lors de l'ajout du jeu";
  } finally {
    addingGame.value = false;
  }
};

const deleteGame = async (id) => {
  if (!confirm("Êtes-vous sûr de vouloir supprimer ce jeu ?")) return;

  try {
    await api.deleteGame(id);
    await loadGames();
  } catch (err) {
    error.value = err.message || "Erreur lors de la suppression";
  }
};

const toggleFavorite = async (id) => {
  try {
    await api.toggleFavorite(id);
    await loadGames();
  } catch (err) {
    error.value = err.message || "Erreur lors de la mise à jour";
  }
};

const handleLogout = () => {
  logout();
  emit("logout");
};

onMounted(() => {
  loadGames();
});
</script>
