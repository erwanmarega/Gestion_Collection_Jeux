<script setup>
import { useAuth } from './composables/useAuth';
import Auth from './pages/Auth.vue';
import Games from './pages/Games.vue';

const { isAuthenticated } = useAuth();

const handleAuthenticated = () => {
  console.log('User authenticated');
};

const handleLogout = () => {
  console.log('User logged out');
};
</script>

<template>
  <div id="app">
    <Auth v-if="!isAuthenticated" @authenticated="handleAuthenticated" />
    <Games v-else @logout="handleLogout" />
  </div>
</template>
