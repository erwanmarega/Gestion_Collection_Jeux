<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-4">
    <div class="w-full max-w-md">
      <div class="border border-gray-200 rounded-lg p-8">
        <h1 class="text-2xl font-bold text-center text-gray-900 mb-8">
          Gestion de Jeux
        </h1>

        <div class="flex gap-2 mb-8 border-b border-gray-200">
          <button
            @click="isLogin = true"
            :class="[
              'flex-1 py-3 font-medium text-sm transition-colors',
              isLogin
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            Connexion
          </button>
          <button
            @click="isLogin = false"
            :class="[
              'flex-1 py-3 font-medium text-sm transition-colors',
              !isLogin
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-500 hover:text-gray-700',
            ]"
          >
            Inscription
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div
            v-if="error"
            class="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center"
          >
            {{ error }}
          </div>

          <div v-if="!isLogin">
            <label
              for="nom"
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Nom
            </label>
            <input
              id="nom"
              v-model="form.nom"
              type="text"
              placeholder="Votre nom"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label
              for="email"
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="votre@email.com"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-semibold text-gray-700 mb-2"
            >
              Mot de passe
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
              minlength="6"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {{
              loading
                ? "Chargement..."
                : isLogin
                ? "Se connecter"
                : "S'inscrire"
            }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "../composables/useAuth";

const { login, register } = useAuth();

const isLogin = ref(true);
const loading = ref(false);
const error = ref("");

const form = ref({
  email: "",
  password: "",
  nom: "",
});

const emit = defineEmits(["authenticated"]);

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;

  try {
    if (isLogin.value) {
      await login({
        email: form.value.email,
        password: form.value.password,
      });
    } else {
      await register({
        email: form.value.email,
        password: form.value.password,
        nom: form.value.nom,
      });
    }
    emit("authenticated");
  } catch (err) {
    error.value = err.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
};
</script>
