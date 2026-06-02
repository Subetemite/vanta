<template>
  <!-- App -->
  <div class="flex bg-case-bg font-lexend">
    <div
      v-if="!$route.meta.hideNav"
      class="lg:block flex-shrink-0 transition-all duration-300"
      :class="{ 'lg:block hidden': !sidebar, block: sidebar, 'w-14': collapsed, 'w-sidebar': !collapsed }"
    >
      <div
        class="bg-case-surface border-r border-case-border lg:z-0 z-20 overflow-hidden lg:relative fixed h-screen transition-all duration-300"
        :class="collapsed ? 'w-14' : 'w-sidebar'"
      >
        <perfect-scrollbar class="h-screen">
          <Sidebar
            v-if="!$route.meta.hideNav"
            :collapsed="collapsed"
            @sidebarToggle="close"
            @collapseToggle="collapsed = !collapsed"
          />
        </perfect-scrollbar>
      </div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebar && !$route.meta.hideNav"
      class="lg:hidden fixed inset-0 bg-black/60 z-10 backdrop-blur-sm"
      @click="close"
    ></div>

    <div
      class="flex-auto min-w-0 overflow-auto h-screen transition-colors"
      id="body-scroll"
    >
      <Header
        v-if="!$route.meta.hideNav"
        @sidebarToggle="open"
      />

      <transition
        name="slide-up"
        mode="out-in"
      >
        <router-view />
      </transition>
    </div>
  </div>

  <!-- Global app-wide confirmation/alert dialog -->
  <GlobalConfirmationDialog />
  <!-- End app -->
</template>

<script>
  // Vue components
  import Sidebar from "@/components/Sidebar";
  import Header from "@/components/Header";
  import GlobalConfirmationDialog from "@/components/GlobalConfirmationDialog.vue";
  // npm-js
  import Scrollbar from "smooth-scrollbar";

  export default {
    name: "App",

    data() {
      return {
        sidebarDark: false,
        sidebar: false,
        collapsed: false,
      };
    },

    components: {
      Header,
      Sidebar,
      GlobalConfirmationDialog,
    },
    methods: {
      open() {
        this.sidebar = true;
      },
      close() {
        this.sidebar = false;
      },
    },
    watch: {
      $route() {
        this.sidebar = false;
      },
    },
    mounted() {
      Scrollbar.init(document.querySelector("#body-scroll"));
    },
  };
</script>

<style>
  /*
  Enter and leave animations can use different
  durations and timing functions.
*/
  .slide-up-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-up-leave-active {
    transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(20px);
    opacity: 0;
  }
</style>
