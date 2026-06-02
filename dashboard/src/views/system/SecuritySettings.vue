<template>
  <div class="min-h-screen bg-case-bg p-6 sm:p-8">
    <div class="mx-auto max-w-3xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">System / Security Settings</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Security Settings</h1>
        <p class="mt-1 text-sm text-gray-500">Manage authentication policy, access control, and API security.</p>
      </div>

      <div
        v-if="message.text"
        :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ message.text }}
      </div>

      <div v-if="isLoading" class="py-12 text-center text-sm text-gray-600">
        Loading security settings...
      </div>

      <form v-else @submit.prevent="saveSettings" class="space-y-6">

        <!-- Password Policy -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Password Policy</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Minimum Password Length</label>
              <input
                v-model.number="form.passwordMinLength"
                type="number"
                min="6"
                max="128"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Password Expiry (days)</label>
              <input
                v-model.number="form.passwordExpiryDays"
                type="number"
                min="0"
                max="365"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <p class="mt-1.5 text-xs text-gray-600">Set to 0 to disable expiry.</p>
            </div>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label v-for="rule in passwordRules" :key="rule.key" class="flex cursor-pointer items-center gap-3 text-sm text-gray-400">
              <input
                v-model="form[rule.key]"
                type="checkbox"
                class="h-4 w-4 rounded border-case-border bg-case-card text-primary focus:ring-primary/30"
              />
              <span>{{ rule.label }}</span>
            </label>
          </div>
        </section>

        <!-- JWT & Session -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">JWT &amp; Session</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">JWT Expiration Time</label>
              <select
                v-model="form.jwtExpiration"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="1h">1 hour</option>
                <option value="6h">6 hours</option>
                <option value="12h">12 hours</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Max Failed Login Attempts</label>
              <input
                v-model.number="form.maxFailedAttempts"
                type="number"
                min="1"
                max="20"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <p class="mt-1.5 text-xs text-gray-600">Account locks after this many failed attempts.</p>
            </div>
          </div>
        </section>

        <!-- API Rate Limiting -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">API Rate Limiting</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Max Requests per Minute</label>
              <input
                v-model.number="form.rateLimit"
                type="number"
                min="1"
                max="10000"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Rate Limit Window (seconds)</label>
              <input
                v-model.number="form.rateLimitWindow"
                type="number"
                min="1"
                max="3600"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>
        </section>

        <!-- IP Restrictions -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">IP Restrictions / Whitelisting</h2>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-400">
              Allowed IP Addresses
              <span class="ml-2 text-xs font-normal text-gray-600">(one per line — leave blank to allow all)</span>
            </label>
            <textarea
              v-model="form.allowedIPs"
              rows="4"
              class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10 font-mono text-sm"
              placeholder="192.168.1.0/24&#10;10.0.0.1&#10;203.0.113.0"
            ></textarea>
          </div>
        </section>

        <!-- RBAC -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Role-Based Access Control</h2>
          <div class="space-y-3">
            <div
              v-for="role in rbacRoles"
              :key="role.name"
              class="flex items-start justify-between rounded-lg border border-case-border bg-case-card px-4 py-3"
            >
              <div>
                <p class="text-sm font-medium text-gray-200">{{ role.name }}</p>
                <p class="mt-0.5 text-xs text-gray-500">{{ role.description }}</p>
              </div>
              <span
                :class="role.color"
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.18em]"
              >
                {{ role.level }}
              </span>
            </div>
          </div>
          <p class="mt-3 text-xs text-gray-600">Roles are assigned per user in User &amp; Account Settings.</p>
        </section>

        <!-- Encryption -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Encryption Settings</h2>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-400">Hashing Algorithm</label>
            <select
              v-model="form.hashAlgorithm"
              class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
            >
              <option value="bcrypt">bcrypt (recommended)</option>
              <option value="argon2">argon2id</option>
              <option value="scrypt">scrypt</option>
            </select>
          </div>
          <div class="mt-4">
            <label class="flex cursor-pointer items-center gap-3 text-sm text-gray-400">
              <input
                v-model="form.enforceHttps"
                type="checkbox"
                class="h-4 w-4 rounded border-case-border bg-case-card text-primary focus:ring-primary/30"
              />
              <span>Enforce HTTPS for all API connections</span>
            </label>
          </div>
        </section>

        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="loadSettings"
            class="rounded-xl border border-case-border px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
          >
            Reset
          </button>
          <button
            type="submit"
            :disabled="isSaving"
            class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSaving ? "Saving..." : "Save settings" }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script>
  import API from "@/services/api";

  export default {
    name: "SecuritySettingsPage",
    data() {
      return {
        isLoading: false,
        isSaving: false,
        message: { type: "", text: "" },
        form: {
          passwordMinLength: 8,
          passwordExpiryDays: 90,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false,
          preventReuse: true,
          jwtExpiration: "24h",
          maxFailedAttempts: 5,
          rateLimit: 100,
          rateLimitWindow: 60,
          allowedIPs: "",
          hashAlgorithm: "bcrypt",
          enforceHttps: true,
        },
        passwordRules: [
          { key: "requireUppercase", label: "Require uppercase letters" },
          { key: "requireNumbers",   label: "Require numbers" },
          { key: "requireSymbols",   label: "Require special symbols" },
          { key: "preventReuse",     label: "Prevent password reuse (last 5)" },
        ],
        rbacRoles: [
          { name: "Admin",   level: "Full access",    color: "bg-primary/10 text-primary",        description: "Complete control over all system features and users." },
          { name: "Officer", level: "Write access",   color: "bg-cyan-900/30 text-cyan-400",       description: "Can create and edit records and operations." },
          { name: "Viewer",  level: "Read-only",      color: "bg-case-elevated text-gray-400",     description: "Can view records and reports; cannot modify data." },
        ],
      };
    },
    mounted() {
      this.loadSettings();
    },
    methods: {
      async loadSettings() {
        this.isLoading = true;
        this.message = { type: "", text: "" };
        try {
          const res = await API.get("/system/security");
          const s = res.data.settings || res.data || {};
          Object.keys(this.form).forEach((key) => {
            if (s[key] !== undefined) this.form[key] = s[key];
          });
        } catch {
          /* endpoint may not exist yet — defaults are fine */
        } finally {
          this.isLoading = false;
        }
      },
      async saveSettings() {
        this.isSaving = true;
        this.message = { type: "", text: "" };
        try {
          await API.put("/system/security", { ...this.form });
          this.message = { type: "success", text: "Security settings saved successfully." };
        } catch (err) {
          this.message = {
            type: "error",
            text: err.response?.data?.message || "Unable to save security settings right now.",
          };
        } finally {
          this.isSaving = false;
        }
      },
    },
  };
</script>
