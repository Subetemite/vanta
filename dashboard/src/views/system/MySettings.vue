<template>
  <div class="min-h-screen bg-case-bg p-4 sm:p-8">
    <div class="mx-auto max-w-4xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Account</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Settings</h1>
        <p class="mt-1 text-sm text-gray-500">Personal preferences and quick links to your account.</p>
      </div>

      <!-- Appearance -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Appearance</h2>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-sm text-gray-200 font-medium">Theme</p>
            <p class="text-xs text-gray-500 mt-0.5">Switch between the noir dark theme and the gradient red theme.</p>
          </div>
          <div class="inline-flex rounded-lg border border-case-border bg-case-card p-1 gap-1">
            <button @click="setTheme(true)" type="button"
              class="px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex items-center gap-2"
              :class="darkMode ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-200'">
              <Icon icon="ri:moon-fill" /> Dark
            </button>
            <button @click="setTheme(false)" type="button"
              class="px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex items-center gap-2"
              :class="!darkMode ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-200'">
              <Icon icon="mdi:palette-outline" /> Gradient Red
            </button>
          </div>
        </div>
      </section>

      <!-- Notifications -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Notifications</h2>
        <div class="space-y-3">
          <label class="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p class="text-sm text-gray-200 font-medium">Browser notifications</p>
              <p class="text-xs text-gray-500 mt-0.5">Show desktop alerts when new notifications arrive.</p>
            </div>
            <input type="checkbox" v-model="prefs.browserNotifications" @change="savePrefs"
              class="h-5 w-9 rounded-full bg-case-card border border-case-border accent-primary cursor-pointer" />
          </label>
          <label class="flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p class="text-sm text-gray-200 font-medium">Sound alert</p>
              <p class="text-xs text-gray-500 mt-0.5">Play a short tone when an unread notification appears.</p>
            </div>
            <input type="checkbox" v-model="prefs.soundAlert" @change="savePrefs"
              class="h-5 w-9 rounded-full bg-case-card border border-case-border accent-primary cursor-pointer" />
          </label>
        </div>
        <p v-if="prefsSaved" class="mt-3 text-[10px] text-emerald-400 uppercase tracking-wide">Preferences saved.</p>
      </section>

      <!-- Quick links -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Account</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <router-link to="/profile"
            class="flex items-center gap-3 rounded-md border border-case-border bg-case-card px-4 py-3 hover:bg-case-elevated transition-colors">
            <Icon icon="mdi:account-circle-outline" class="text-2xl text-primary" />
            <div>
              <p class="text-sm font-medium text-gray-200">My Profile</p>
              <p class="text-[11px] text-gray-500">Update your name, email and password.</p>
            </div>
          </router-link>
          <router-link to="/system/users/login-history"
            class="flex items-center gap-3 rounded-md border border-case-border bg-case-card px-4 py-3 hover:bg-case-elevated transition-colors">
            <Icon icon="mdi:history" class="text-2xl text-primary" />
            <div>
              <p class="text-sm font-medium text-gray-200">Login History</p>
              <p class="text-[11px] text-gray-500">Review recent sign-in activity.</p>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Admin shortcuts -->
      <section v-if="isAdmin" class="rounded-xl border border-case-border bg-case-surface p-6">
        <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">System Administration</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <router-link to="/system/settings/general"
            class="flex items-center gap-3 rounded-md border border-case-border bg-case-card px-4 py-3 hover:bg-case-elevated transition-colors">
            <Icon icon="mdi:cog-outline" class="text-2xl text-primary" />
            <div>
              <p class="text-sm font-medium text-gray-200">General Settings</p>
              <p class="text-[11px] text-gray-500">App identification &amp; localization.</p>
            </div>
          </router-link>
          <router-link to="/system/settings/security"
            class="flex items-center gap-3 rounded-md border border-case-border bg-case-card px-4 py-3 hover:bg-case-elevated transition-colors">
            <Icon icon="mdi:shield-lock-outline" class="text-2xl text-primary" />
            <div>
              <p class="text-sm font-medium text-gray-200">Security Settings</p>
              <p class="text-[11px] text-gray-500">Authentication &amp; access controls.</p>
            </div>
          </router-link>
          <router-link to="/system/users"
            class="flex items-center gap-3 rounded-md border border-case-border bg-case-card px-4 py-3 hover:bg-case-elevated transition-colors">
            <Icon icon="mdi:account-multiple-outline" class="text-2xl text-primary" />
            <div>
              <p class="text-sm font-medium text-gray-200">User Management</p>
              <p class="text-[11px] text-gray-500">Roles, permissions and module access.</p>
            </div>
          </router-link>
          <router-link to="/system/users/passwords"
            class="flex items-center gap-3 rounded-md border border-case-border bg-case-card px-4 py-3 hover:bg-case-elevated transition-colors">
            <Icon icon="mdi:key-variant" class="text-2xl text-primary" />
            <div>
              <p class="text-sm font-medium text-gray-200">Password Management</p>
              <p class="text-[11px] text-gray-500">Reset other users' passwords.</p>
            </div>
          </router-link>
        </div>
      </section>

    </div>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import { setDarkMode, loadDarkMode } from "@/helper/theme";

  const PREFS_KEY = "user_settings_prefs";

  export default {
    name: "MySettings",
    components: { Icon },
    data() {
      return {
        darkMode: true,
        prefs: { browserNotifications: false, soundAlert: false },
        prefsSaved: false,
        prefsTimeout: null,
      };
    },
    computed: {
      isAdmin() {
        try {
          const u = JSON.parse(localStorage.getItem("auth_user") || "null");
          return u?.role === "admin";
        } catch { return false; }
      },
    },
    methods: {
      setTheme(dark) {
        this.darkMode = dark;
        setDarkMode(dark);
      },
      loadPrefs() {
        try {
          const raw = localStorage.getItem(PREFS_KEY);
          if (raw) this.prefs = { ...this.prefs, ...JSON.parse(raw) };
        } catch { /* ignore */ }
      },
      savePrefs() {
        localStorage.setItem(PREFS_KEY, JSON.stringify(this.prefs));
        this.prefsSaved = true;
        clearTimeout(this.prefsTimeout);
        this.prefsTimeout = setTimeout(() => { this.prefsSaved = false; }, 2000);
      },
    },
    mounted() {
      this.darkMode = loadDarkMode();
      this.loadPrefs();
    },
    beforeUnmount() { clearTimeout(this.prefsTimeout); },
  };
</script>
