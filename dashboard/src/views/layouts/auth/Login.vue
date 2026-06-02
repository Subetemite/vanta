<template>
  <div class="min-h-screen bg-case-bg">
    <section class="relative flex min-h-screen items-center justify-center overflow-hidden bg-case-bg px-6 py-10 sm:px-10 lg:px-12">
      <div class="pointer-events-none absolute inset-0 px-6 py-8 sm:px-10 lg:px-12">
        <div class="grid h-full grid-cols-2 content-between gap-x-10 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          <p class="select-none self-start whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-end whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none self-center whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-end whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-center whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-end whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-end whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-center whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
          <p class="select-none justify-self-end whitespace-nowrap text-[clamp(1rem,2.2vw,1.75rem)] font-semibold uppercase tracking-[0.85em] text-amber-500/5">V A N T A</p>
        </div>
      </div>

      <div class="relative z-10 w-full max-w-xl rounded-[2rem] border border-case-border bg-case-surface p-8 shadow-2xl shadow-black/60 sm:p-10">
        <div class="mb-8">
          <div class="flex items-center">
            <button
              type="button"
              class="flex items-center gap-3 text-left"
              @click="$router.push('/')"
            >
              <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-case-bg ring-1 ring-case-border">
                <img
                  src="../../../assets/logo/logo_light.png"
                  alt="Joremiodot logo"
                  class="h-8 w-8 object-contain"
                />
              </span>
              <span>
                <span class="block text-xs uppercase tracking-[0.35em] text-primary">
                  VANTA
                </span>
                <span class="block text-sm font-semibold text-white">Analytics and Tracking System</span>
              </span>
            </button>
          </div>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div
            v-if="errorMessage"
            class="rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400"
          >
            {{ errorMessage }}
          </div>

          <div>
            <label for="identifier" class="mb-2 block text-sm font-medium text-gray-400">
              Email or username
            </label>
            <input
              id="identifier"
              v-model.trim="form.identifier"
              type="text"
              autocomplete="username"
              class="w-full rounded-2xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
              placeholder="name@agency.gov or agent.name"
            />
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between">
              <label for="password" class="block text-sm font-medium text-gray-400">
                Password
              </label>
              <button
                type="button"
                class="text-sm font-medium text-primary transition hover:text-amber-500"
                @click="$router.push('/auth/forgot-password')"
              >
                Forgot password?
              </button>
            </div>
            <div class="relative">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="w-full rounded-2xl border border-case-border bg-case-card px-4 py-3 pr-14 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Enter your password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium text-gray-600 transition hover:text-gray-400"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "Hide" : "Show" }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <label class="flex cursor-pointer items-center gap-3">
              <input
                v-model="form.remember"
                type="checkbox"
                class="h-4 w-4 rounded border-case-border bg-case-card text-primary focus:ring-primary/30"
              />
              <span>Keep me signed in on this device</span>
            </label>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Secure access
            </span>
          </div>

          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-amber-500 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Signing in..." : "Enter dashboard" }}
          </button>
        </form>
      </div>
    </section>
  </div>
</template>

<script>
  import API from "@/services/api";

  export default {
    name: "LoginPage",
    data() {
      return {
        form: {
          identifier: "",
          password: "",
          remember: true,
        },
        showPassword: false,
        isSubmitting: false,
        errorMessage: "",
      };
    },
    methods: {
      async handleLogin() {
        this.errorMessage = "";
        if (!this.form.identifier || !this.form.password) {
          this.errorMessage = "Enter your email or username and password to continue.";
          return;
        }
        this.isSubmitting = true;
        try {
          const response = await API.post("/auth/login", {
            identifier: this.form.identifier,
            password: this.form.password,
          });
          localStorage.setItem("auth_token", response.data.token);
          localStorage.setItem("auth_user", JSON.stringify(response.data.user));
          this.$router.push("/home");
        } catch (error) {
          this.errorMessage =
            error.response?.data?.message ||
            "Unable to sign in with those credentials.";
        } finally {
          this.isSubmitting = false;
        }
      },
    },
  };
</script>
