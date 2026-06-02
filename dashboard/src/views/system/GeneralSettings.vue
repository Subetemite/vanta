<template>
  <div class="min-h-screen bg-case-bg p-4 sm:p-8">
    <div class="mx-auto max-w-3xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">System / General Settings</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">General Settings</h1>
        <p class="mt-1 text-sm text-gray-500">Configure application identity and localization preferences.</p>
      </div>

      <div
        v-if="message.text"
        :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ message.text }}
      </div>

      <div v-if="isLoading" class="py-12 text-center text-sm text-gray-600">
        Loading settings...
      </div>

      <form v-else @submit.prevent="saveSettings" class="space-y-6">

        <!-- App Identification -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">App Identification</h2>
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">App Name</label>
              <input
                v-model.trim="form.appName"
                type="text"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="VANTA"
              />
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">App Version</label>
              <input
                :value="form.appVersion"
                type="text"
                readonly
                class="w-full cursor-not-allowed rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-600 outline-none opacity-60"
              />
              <p class="mt-1.5 text-xs text-gray-600">Version is managed by the deployment pipeline.</p>
            </div>
          </div>
        </section>

        <!-- Localization -->
        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Localization</h2>
          <div class="space-y-4">
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Default Language</label>
              <select
                v-model="form.language"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="es">Spanish</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Timezone</label>
              <select
                v-model="form.timezone"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (UTC-5)</option>
                <option value="America/Chicago">America/Chicago (UTC-6)</option>
                <option value="America/Denver">America/Denver (UTC-7)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (UTC-8)</option>
                <option value="Europe/London">Europe/London (UTC+0)</option>
                <option value="Europe/Paris">Europe/Paris (UTC+1)</option>
                <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
                <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                <option value="Australia/Sydney">Australia/Sydney (UTC+10)</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-gray-400">Date &amp; Time Format</label>
              <select
                v-model="form.dateFormat"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY — 04/21/2026</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY — 21/04/2026</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD — 2026-04-21 (ISO)</option>
                <option value="MMM DD, YYYY">MMM DD, YYYY — Apr 21, 2026</option>
                <option value="DD MMM YYYY">DD MMM YYYY — 21 Apr 2026</option>
              </select>
            </div>
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
    name: "GeneralSettingsPage",
    data() {
      return {
        isLoading: false,
        isSaving: false,
        message: { type: "", text: "" },
        form: {
          appName: "VANTA",
          appVersion: "1.0.0",
          language: "en",
          timezone: "UTC",
          dateFormat: "MM/DD/YYYY",
        },
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
          const res = await API.get("/system/settings");
          const s = res.data.settings || res.data || {};
          this.form.appName    = s.appName    || "VANTA";
          this.form.appVersion = s.appVersion || "1.0.0";
          this.form.language   = s.language   || "en";
          this.form.timezone   = s.timezone   || "UTC";
          this.form.dateFormat = s.dateFormat || "MM/DD/YYYY";
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
          await API.put("/system/settings", {
            appName:    this.form.appName,
            language:   this.form.language,
            timezone:   this.form.timezone,
            dateFormat: this.form.dateFormat,
          });
          this.message = { type: "success", text: "Settings saved successfully." };
        } catch (err) {
          this.message = {
            type: "error",
            text: err.response?.data?.message || "Unable to save settings right now.",
          };
        } finally {
          this.isSaving = false;
        }
      },
    },
  };
</script>
