<template>
  <header class="bg-case-surface p-2 border-b border-case-border">
    <div class="wrap-header flex items-center gap-5 justify-between flex-wrap">
      <div class="flex flex-no-shrink items-center">
        <button
          class="text-gray-500 lg:hidden ml-3 block"
          @click="$emit('sidebarToggle', true)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            role="img"
            width="2em"
            height="2em"
            preserveAspectRatio="xMidYMid meet"
            viewBox="0 0 16 16"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M2.75 12.25h10.5m-10.5-4h10.5m-10.5-4h10.5"
            />
          </svg>
        </button>
        <div
          class="input-box border bg-case-bg border-case-border rounded-md hidden lg:w-search w-full box-border lg:flex md:flex focus-within:bg-case-elevated"
        >
          <span class="text-3xl p-2 text-gray-600"><Icon icon="ei:search" /></span>
          <input
            type="text"
            placeholder="Search records..."
            class="p-3 w-full bg-transparent text-gray-300 rounded-md outline-none placeholder:text-gray-600 focus:bg-transparent"
          />
        </div>
      </div>

      <div class="mr-5 flex gap-3">
        <button class="lg:hidden block mr-5 text-2xl text-gray-500 relative">
          <i><Icon icon="ic:outline-search" /></i>
        </button>

        <button
          @click="fullscreenToggle"
          class="mr-5 text-2xl text-gray-500 hover:text-gray-300 relative"
        >
          <i v-if="!fullscreenMode"><Icon icon="ic:outline-fullscreen" /></i>
          <i v-else><Icon icon="ic:outline-fullscreen-exit" /></i>
        </button>

        <button
          v-if="darkMode"
          @click="setTheme(false)"
          title="Switch to Gradient Red theme"
          class="mr-5 text-2xl text-gray-500 hover:text-gray-300"
        >
          <Icon icon="mdi:palette-outline" />
        </button>
        <button
          v-else
          @click="setTheme(true)"
          title="Switch to Dark theme"
          class="mr-5 text-2xl text-gray-500 hover:text-gray-300"
        >
          <Icon icon="ri:moon-fill" />
        </button>

        <button
          @click="notifToggle"
          class="mr-5 text-2xl text-gray-500 hover:text-gray-300 relative"
        >
          <span
            v-if="unreadCount > 0"
            class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white border border-case-surface"
          >
            {{ unreadCount > 99 ? "99+" : unreadCount }}
          </span>
          <Icon icon="clarity:notification-line" />
        </button>

        <transition name="fade">
          <div
            id="notificaitons"
            v-show="notification"
            class="block absolute lg:right-56 right-28 mt-12 z-50 w-96 max-h-[28rem] overflow-y-auto border border-case-border bg-case-surface rounded divide-y divide-case-border shadow-xl shadow-black/50"
          >
            <div class="flex items-center justify-between p-3 text-gray-200 sticky top-0 bg-case-surface">
              <h2 class="text-sm font-semibold">Notifications</h2>
              <button
                v-if="unreadCount > 0"
                class="text-primary text-xs hover:underline"
                @click="markAllRead"
              >
                Mark all as Read
              </button>
            </div>
            <div v-if="notifLoading" class="p-5 text-center">
              <p class="text-gray-500 text-sm">Loading...</p>
            </div>
            <div v-else-if="!notifList.length" class="p-5 text-center">
              <p class="text-gray-500 text-sm">No notifications yet.</p>
            </div>
            <button
              v-for="n in notifList"
              :key="n.id"
              type="button"
              class="block w-full text-left p-3 hover:bg-case-card transition-colors"
              :class="!n.read && 'bg-primary/5'"
              @click="openNotification(n)"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-semibold text-gray-200">{{ n.title }}</p>
                <span v-if="!n.read" class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></span>
              </div>
              <p class="mt-0.5 text-xs text-gray-500 line-clamp-2">{{ n.message }}</p>
              <p class="mt-1 text-[10px] text-gray-600">{{ formatRelative(n.createdAt) }}</p>
            </button>
          </div>
        </transition>

        <button
          @blur="menuToggleBlur"
          @click="menuToggle"
        >
          <div class="user-avatar flex p-1 cursor-pointer rounded-md">
            <div class="relative mr-4 h-10 w-10 rounded-full ring-1 ring-case-border bg-case-elevated overflow-hidden flex items-center justify-center">
              <img
                v-if="currentUser.avatarUrl"
                :src="currentUser.avatarUrl"
                :alt="currentUser.username || 'avatar'"
                class="h-full w-full object-cover"
              />
              <Icon v-else icon="mdi:account-circle-outline" class="text-3xl text-primary" />
            </div>
            <div class="text-left lg:block md:block hidden">
              <h2 class="text-white">
                Hi, {{ currentUser.username || "User" }}
              </h2>
              <p class="text-xs text-gray-500">
                {{ currentUser.role || "Member" }}
              </p>
            </div>
          </div>
        </button>

        <transition name="fade">
          <div
            id="dropdownSmall"
            v-show="menu"
            class="block absolute right-10 mt-12 z-50 w-52 border border-case-border bg-case-surface rounded divide-y divide-case-border shadow-xl shadow-black/50"
          >
            <div class="py-3 px-4 text-sm text-gray-200">
              <div class="text-gray-500 text-xs uppercase tracking-wider mb-1">Logged As</div>
              <div class="font-medium truncate text-gray-200">
                {{ currentUser.email || currentUser.username || "Unknown user" }}
              </div>
            </div>
            <ul
              class="py-1 text-sm text-gray-400"
              aria-labelledby="dropdownSmallButton"
            >
              <li>
                <router-link
                  to="/profile"
                  @click="menu = false"
                  class="block py-2 px-4 hover:bg-primary hover:text-black transition-colors"
                >User Profile</router-link>
              </li>
              <li>
                <router-link
                  to="/settings"
                  @click="menu = false"
                  class="block py-2 px-4 hover:bg-primary hover:text-black transition-colors"
                >Settings</router-link>
              </li>
            </ul>
            <div class="py-1">
              <button
                type="button"
                @click="logout"
                class="block py-2 px-4 text-sm text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors w-full text-left"
              >
                Sign out
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<style></style>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import { fullscreen } from "@/helper/fullscreen";
  import { setDarkMode, loadDarkMode } from "@/helper/theme";

  const POLL_INTERVAL_MS = 60000;

  export default {
    data() {
      return {
        menu: false,
        darkMode: false,
        notification: false,
        fullscreenMode: false,
        currentUser: {
          username: "",
          email: "",
          role: "",
          avatarUrl: "",
        },
        notifList: [],
        unreadCount: 0,
        notifLoading: false,
        pollTimer: null,
      };
    },
    components: {
      Icon,
    },
    watch: {
      $route() {
        this.menu = false;
        this.notification = false;
        this.loadCurrentUser();
      },
    },
    methods: {
      fullscreen,
      setDarkMode,
      loadDarkMode,
      menuToggle() {
        this.menu = !this.menu;
      },
      menuToggleBlur() {
        // Delay so that clicks on the dropdown items register before the menu closes.
        setTimeout(() => { this.menu = false; }, 150);
      },
      notifToggle() {
        this.notification = !this.notification;
        if (this.notification) {
          this.loadNotifications();
        }
      },
      async loadNotifications() {
        if (!localStorage.getItem("auth_token")) return;
        this.notifLoading = true;
        try {
          const res = await API.get("/notifications");
          this.notifList = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
          this.unreadCount = Number(res.data?.unreadCount) || 0;
        } catch {
          /* ignore */
        } finally {
          this.notifLoading = false;
        }
      },
      async pollUnreadCount() {
        if (!localStorage.getItem("auth_token")) return;
        try {
          const res = await API.get("/notifications/unread-count");
          this.unreadCount = Number(res.data?.unreadCount) || 0;
        } catch {
          /* ignore */
        }
      },
      async openNotification(n) {
        if (!n.read) {
          try {
            await API.post(`/notifications/${n.id}/read`);
            n.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
          } catch {
            /* ignore */
          }
        }
        this.notification = false;
        if (n.link) this.$router.push(n.link);
      },
      async markAllRead() {
        try {
          await API.post("/notifications/mark-all-read");
          this.notifList = this.notifList.map((n) => ({ ...n, read: true }));
          this.unreadCount = 0;
        } catch {
          /* ignore */
        }
      },
      formatRelative(value) {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        const diff = Date.now() - d.getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return "just now";
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        const days = Math.floor(h / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      },
      fullscreenToggle() {
        this.fullscreenMode = !this.fullscreenMode;
        this.fullscreen(this.fullscreenMode);
      },
      setTheme(bool) {
        this.darkMode = bool;
        this.setDarkMode(bool);
      },
      logout() {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        this.menu = false;
        this.$router.push("/auth/login");
      },
      loadCurrentUser() {
        try {
          const storedUser = localStorage.getItem("auth_user");
          this.currentUser = storedUser
            ? JSON.parse(storedUser)
            : { username: "", email: "", role: "", avatarUrl: "" };
        } catch (error) {
          this.currentUser = { username: "", email: "", role: "", avatarUrl: "" };
        }
      },
      onAuthUserUpdated(e) {
        this.currentUser = { ...this.currentUser, ...(e.detail || {}) };
      },
    },
    mounted() {
      this.darkMode = this.loadDarkMode();
      this.loadCurrentUser();
      this.pollUnreadCount();
      this.pollTimer = setInterval(this.pollUnreadCount, POLL_INTERVAL_MS);
      window.addEventListener("auth-user-updated", this.onAuthUserUpdated);
      document.onfullscreenchange = () => {
        this.fullscreenMode = !!document.fullscreenElement;
      };
    },
    beforeUnmount() {
      if (this.pollTimer) clearInterval(this.pollTimer);
      window.removeEventListener("auth-user-updated", this.onAuthUserUpdated);
    },
  };
</script>
