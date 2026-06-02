<template>
  <div class="min-h-screen bg-case-bg p-6 sm:p-8">
    <div class="mx-auto max-w-4xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">System / User &amp; Account</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Password &amp; Access Management</h1>
        <p class="mt-1 text-sm text-gray-500">Review users, adjust roles, and update passwords from one admin screen.</p>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ users.length }} user{{ users.length !== 1 ? "s" : "" }} registered</p>
        <button
          type="button"
          class="rounded-xl border border-case-border px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
          :disabled="isLoading"
          @click="fetchUsers"
        >
          {{ isLoading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <div
        v-if="pageMessage.text"
        :class="pageMessage.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ pageMessage.text }}
      </div>

      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-28 animate-pulse rounded-xl bg-case-elevated"></div>
      </div>

      <div v-else-if="!users.length" class="py-12 text-center text-sm text-gray-600">
        No users found yet.
      </div>

      <div v-else class="space-y-4">
        <article
          v-for="user in users"
          :key="user.id"
          class="rounded-xl border border-case-border bg-case-surface p-5"
        >
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-1.5 min-w-[180px]">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-semibold text-white">{{ user.username }}</h3>
                <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {{ user.role }}
                </span>
              </div>
              <p class="text-sm text-gray-500">{{ user.email }}</p>
              <p class="text-xs text-gray-600">Updated {{ formatDate(user.updatedAt) }}</p>
            </div>

            <div class="grid flex-1 gap-4 lg:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-400">Role</label>
                <select
                  v-model="user.role"
                  class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="officer">Officer</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-400">New password</label>
                <input
                  v-model="user.password"
                  type="password"
                  class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-400">Confirm password</label>
                <input
                  v-model="user.confirmPassword"
                  type="password"
                  class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="Re-enter the new password"
                />
              </div>

              <div>
                <p class="mb-2 text-sm font-medium text-gray-400">Permissions</p>
                <div class="grid gap-2.5 rounded-xl border border-case-border bg-case-card p-4">
                  <label
                    v-for="permission in permissionOptions"
                    :key="permission.key"
                    class="flex cursor-pointer items-start gap-3 text-sm text-gray-400"
                  >
                    <input
                      v-model="user.permissions[permission.key]"
                      type="checkbox"
                      class="mt-1 h-4 w-4 rounded border-case-border bg-case-elevated text-primary focus:ring-primary/30"
                    />
                    <span>{{ permission.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              v-if="user.message"
              :class="user.messageType === 'success' ? 'text-emerald-400' : 'text-red-400'"
              class="text-sm"
            >
              {{ user.message }}
            </p>
            <div v-else class="text-xs text-gray-600">Save to apply role, password, or permission changes.</div>

            <button
              type="button"
              class="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="savingUserId === user.id"
              @click="saveUser(user)"
            >
              {{ savingUserId === user.id ? "Saving..." : "Update user" }}
            </button>
          </div>
        </article>
      </div>

    </div>
  </div>
</template>

<script>
  import API from "@/services/api";

  export default {
    name: "PasswordChangePage",
    data() {
      return {
        isLoading: false,
        savingUserId: "",
        pageMessage: { type: "", text: "" },
        permissionOptions: [
          { key: "createReports",       label: "Create reports" },
          { key: "editIncidents",        label: "Edit incidents" },
          { key: "deleteRecords",        label: "Delete records" },
          { key: "viewConfidentialData", label: "View confidential data" },
        ],
        users: [],
      };
    },
    mounted() {
      this.fetchUsers();
    },
    methods: {
      createPermissionState(permissions = {}) {
        return {
          createReports:       Boolean(permissions.createReports),
          editIncidents:        Boolean(permissions.editIncidents),
          deleteRecords:        Boolean(permissions.deleteRecords),
          viewConfidentialData: Boolean(permissions.viewConfidentialData),
        };
      },
      mapUser(user) {
        return {
          id:             user.id,
          username:       user.username,
          email:          user.email,
          role:           user.role || "viewer",
          permissions:    this.createPermissionState(user.permissions),
          password:       "",
          confirmPassword: "",
          message:        "",
          messageType:    "",
          updatedAt:      user.updatedAt,
        };
      },
      async fetchUsers() {
        this.isLoading = true;
        this.pageMessage = { type: "", text: "" };
        try {
          const response = await API.get("/auth/users");
          this.users = (response.data.users || []).map(this.mapUser);
        } catch (error) {
          this.pageMessage = {
            type: "error",
            text: error.response?.data?.message || "Unable to load the user directory.",
          };
        } finally {
          this.isLoading = false;
        }
      },
      formatDate(value) {
        if (!value) return "just now";
        return new Intl.DateTimeFormat("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        }).format(new Date(value));
      },
      async saveUser(user) {
        user.message = "";
        user.messageType = "";
        if (user.password && user.password !== user.confirmPassword) {
          user.message = "Password confirmation does not match.";
          user.messageType = "error";
          return;
        }
        this.savingUserId = user.id;
        try {
          const response = await API.put(`/auth/users/${user.id}`, {
            role:        user.role,
            password:    user.password || undefined,
            permissions: user.permissions,
          });
          user.password        = "";
          user.confirmPassword = "";
          user.updatedAt   = response.data.user?.updatedAt   || new Date().toISOString();
          user.role        = response.data.user?.role        || user.role;
          user.permissions = this.createPermissionState(response.data.user?.permissions || user.permissions);
          user.message     = response.data.message || "User updated successfully.";
          user.messageType = "success";
        } catch (error) {
          user.message     = error.response?.data?.message || "Unable to update this user.";
          user.messageType = "error";
        } finally {
          this.savingUserId = "";
        }
      },
    },
  };
</script>
