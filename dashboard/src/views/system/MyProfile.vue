<template>
  <div class="min-h-screen bg-case-bg p-4 sm:p-8">
    <div class="mx-auto max-w-4xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Account</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">My Profile</h1>
        <p class="mt-1 text-sm text-gray-500">Update your sign-in details and password.</p>
      </div>

      <!-- Identity card -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <div class="flex flex-wrap items-start gap-5">
          <div class="relative">
            <div class="h-24 w-24 rounded-full bg-case-elevated flex items-center justify-center ring-2 ring-case-border overflow-hidden">
              <img v-if="avatarPreview" :src="avatarPreview" alt="Avatar" class="h-full w-full object-cover" />
              <Icon v-else icon="mdi:account-circle-outline" class="text-6xl text-primary" />
            </div>
            <button type="button" @click="$refs.avatarInput.click()"
              class="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-black flex items-center justify-center hover:bg-primary/90 transition-colors ring-2 ring-case-surface"
              title="Upload avatar">
              <Icon icon="mdi:camera-plus-outline" class="text-base" />
            </button>
            <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" @change="onAvatarSelected" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-lg font-semibold text-white truncate">{{ form.username || "User" }}</h2>
            <p class="text-xs text-gray-500 truncate">{{ form.email || "—" }}</p>
            <div class="mt-1 flex flex-wrap gap-2">
              <span class="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] uppercase tracking-wide font-semibold">
                {{ user.role || "member" }}
              </span>
              <span v-for="m in activeModules" :key="m"
                class="rounded-full bg-case-elevated text-gray-300 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                {{ m }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <button v-if="avatarPreview" type="button" @click="removeAvatar"
                class="text-[11px] text-red-400 hover:underline">Remove photo</button>
              <p v-if="avatarPending" class="text-[10px] text-amber-400 uppercase tracking-wide">
                Pending — click "Save changes" to upload.
              </p>
              <p class="text-[10px] text-gray-600">JPG, PNG, WEBP, or GIF • max 5 MB.</p>
            </div>
            <p v-if="avatarError" class="mt-1 text-[10px] text-red-400">{{ avatarError }}</p>
          </div>
        </div>
      </section>

      <!-- Profile details -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Account Details</h2>

        <div v-if="profileMessage.text"
          :class="profileMessage.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
          class="mb-4 rounded-md border px-4 py-3 text-xs">
          {{ profileMessage.text }}
        </div>

        <form @submit.prevent="saveProfile" class="space-y-4">
          <div>
            <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">Username</label>
            <input v-model.trim="form.username" type="text" minlength="3"
              class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">Email</label>
            <input v-model.trim="form.email" type="email"
              class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" @click="resetProfile"
              class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">
              Reset
            </button>
            <button type="submit" :disabled="profileSaving || !profileChanged"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Icon v-if="profileSaving" icon="mdi:loading" class="animate-spin" />
              <Icon v-else icon="mdi:content-save-outline" />
              {{ profileSaving ? "Saving..." : "Save changes" }}
            </button>
          </div>
        </form>
      </section>

      <!-- Change password -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Change Password</h2>

        <div v-if="pwMessage.text"
          :class="pwMessage.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
          class="mb-4 rounded-md border px-4 py-3 text-xs">
          {{ pwMessage.text }}
        </div>

        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">Current Password</label>
            <input v-model="pwForm.current" type="password" autocomplete="current-password"
              class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">New Password</label>
              <input v-model="pwForm.next" type="password" autocomplete="new-password" minlength="6"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              <p class="mt-1 text-[10px] text-gray-600">Minimum 6 characters.</p>
            </div>
            <div>
              <label class="mb-2 block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">Confirm New Password</label>
              <input v-model="pwForm.confirm" type="password" autocomplete="new-password"
                class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="submit" :disabled="pwSaving || !pwReady"
              class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              <Icon v-if="pwSaving" icon="mdi:loading" class="animate-spin" />
              <Icon v-else icon="mdi:lock-reset" />
              {{ pwSaving ? "Updating..." : "Update password" }}
            </button>
          </div>
        </form>
      </section>

    </div>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  export default {
    name: "MyProfile",
    components: { Icon },
    data() {
      return {
        user: { id: "", username: "", email: "", role: "", modulePermissions: {}, avatarUrl: "" },
        form: { username: "", email: "" },
        original: { username: "", email: "" },
        profileSaving: false,
        profileMessage: { text: "", type: "success" },
        pwForm: { current: "", next: "", confirm: "" },
        pwSaving: false,
        pwMessage: { text: "", type: "success" },
        avatarPreview: "",
        avatarBase64: "",
        avatarFileName: "",
        avatarCleared: false,
        avatarError: "",
      };
    },
    computed: {
      activeModules() {
        const mp = this.user.modulePermissions || {};
        return Object.keys(mp).filter((k) => mp[k]);
      },
      profileChanged() {
        return (
          this.form.username !== this.original.username ||
          this.form.email !== this.original.email ||
          this.avatarPending
        );
      },
      avatarPending() {
        return Boolean(this.avatarBase64) || this.avatarCleared;
      },
      pwReady() {
        return (
          this.pwForm.current.length > 0 &&
          this.pwForm.next.length >= 6 &&
          this.pwForm.next === this.pwForm.confirm
        );
      },
    },
    methods: {
      async loadProfile() {
        try {
          const res = await API.get("/auth/me");
          const u = res.data?.user || {};
          this.user = u;
          this.form.username = u.username || "";
          this.form.email = u.email || "";
          this.original = { ...this.form };
          this.avatarPreview = u.avatarUrl || "";
          this.avatarBase64 = "";
          this.avatarFileName = "";
          this.avatarCleared = false;
          this.avatarError = "";
        } catch (err) {
          this.profileMessage = { type: "error", text: err.response?.data?.message || "Unable to load profile." };
        }
      },
      resetProfile() {
        this.form = { ...this.original };
        this.avatarPreview = this.user.avatarUrl || "";
        this.avatarBase64 = "";
        this.avatarFileName = "";
        this.avatarCleared = false;
        this.avatarError = "";
        this.profileMessage = { text: "", type: "success" };
        if (this.$refs.avatarInput) this.$refs.avatarInput.value = "";
      },
      onAvatarSelected(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          this.avatarError = "Please choose an image file."; return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.avatarError = "Avatar must be 5 MB or smaller."; return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.avatarPreview = reader.result;
          this.avatarBase64 = String(reader.result).replace(/^data:[^;]+;base64,/i, "");
          this.avatarFileName = file.name;
          this.avatarCleared = false;
          this.avatarError = "";
        };
        reader.onerror = () => { this.avatarError = "Unable to read the selected file."; };
        reader.readAsDataURL(file);
      },
      removeAvatar() {
        this.avatarPreview = "";
        this.avatarBase64 = "";
        this.avatarFileName = "";
        this.avatarCleared = true;
        this.avatarError = "";
        if (this.$refs.avatarInput) this.$refs.avatarInput.value = "";
      },
      async saveProfile() {
        if (!this.profileChanged || this.profileSaving) return;
        this.profileSaving = true;
        this.profileMessage = { text: "", type: "success" };
        try {
          const payload = { username: this.form.username, email: this.form.email };
          if (this.avatarBase64) {
            payload.avatarBase64 = this.avatarBase64;
            payload.avatarFileName = this.avatarFileName;
          } else if (this.avatarCleared) {
            payload.clearAvatar = true;
          }
          const res = await API.put("/auth/me", payload);
          const u = res.data?.user || {};
          this.user = u;
          this.form.username = u.username || "";
          this.form.email = u.email || "";
          this.original = { ...this.form };
          this.avatarPreview = u.avatarUrl || "";
          this.avatarBase64 = "";
          this.avatarFileName = "";
          this.avatarCleared = false;
          this.avatarError = "";
          if (this.$refs.avatarInput) this.$refs.avatarInput.value = "";
          localStorage.setItem("auth_user", JSON.stringify(u));
          window.dispatchEvent(new CustomEvent("auth-user-updated", { detail: u }));
          this.profileMessage = { type: "success", text: "Profile updated." };
        } catch (err) {
          this.profileMessage = { type: "error", text: err.response?.data?.message || "Unable to update profile." };
        } finally {
          this.profileSaving = false;
        }
      },
      async changePassword() {
        if (!this.pwReady || this.pwSaving) return;
        if (this.pwForm.next !== this.pwForm.confirm) {
          this.pwMessage = { type: "error", text: "New passwords do not match." };
          return;
        }
        this.pwSaving = true;
        this.pwMessage = { text: "", type: "success" };
        try {
          await API.post("/auth/me/password", {
            currentPassword: this.pwForm.current,
            newPassword: this.pwForm.next,
          });
          this.pwForm = { current: "", next: "", confirm: "" };
          this.pwMessage = { type: "success", text: "Password updated successfully." };
        } catch (err) {
          this.pwMessage = { type: "error", text: err.response?.data?.message || "Unable to change password." };
        } finally {
          this.pwSaving = false;
        }
      },
    },
    mounted() { this.loadProfile(); },
  };
</script>
