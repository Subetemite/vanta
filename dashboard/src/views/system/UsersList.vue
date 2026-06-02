<template>
  <div class="min-h-screen bg-case-bg p-6 sm:p-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <header class="flex flex-col gap-3 border-b border-case-border pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">System / User &amp; Account</p>
          <h1 class="mt-2 text-2xl font-semibold text-white">User Management</h1>
          <p class="mt-1 text-sm text-gray-500">{{ users.length }} account<span v-if="users.length !== 1">s</span> · {{ activeCount }} active · {{ disabledCount }} disabled</p>
        </div>
        <button
          type="button"
          class="self-start rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500 sm:self-auto"
          @click="$router.push('/system/users/create')"
        >
          + New Account
        </button>
      </header>

      <div
        v-if="message.text"
        :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ message.text }}
      </div>

      <div class="flex items-center gap-3 rounded-xl border border-case-border bg-case-surface px-3 py-2">
        <Icon icon="mdi:magnify" class="text-lg text-gray-500" />
        <input
          v-model="search"
          type="search"
          placeholder="Search by username, email, role, employee ID..."
          class="w-full bg-transparent px-2 py-1 text-sm text-gray-200 outline-none placeholder:text-gray-600"
        />
      </div>

      <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
        <table class="w-full text-left text-sm">
          <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
            <tr>
              <th class="px-4 py-3 font-medium">User</th>
              <th class="px-4 py-3 font-medium">Linked Employee</th>
              <th class="px-4 py-3 font-medium">Role</th>
              <th class="px-4 py-3 font-medium">Modules</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-case-border text-gray-300">
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-6 text-center text-gray-500">Loading users...</td>
            </tr>
            <tr v-else-if="!filteredUsers.length">
              <td colspan="6" class="px-4 py-6 text-center text-gray-500">No users {{ search ? "match your search" : "yet" }}.</td>
            </tr>
            <tr v-for="user in filteredUsers" :key="user.id" :class="!user.active && 'bg-red-950/10'">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-100">{{ user.username }}</p>
                <p class="text-xs text-gray-500 truncate">{{ user.email }}</p>
              </td>
              <td class="px-4 py-3">
                <p v-if="user.employee?.employeeId" class="text-sm text-gray-300">
                  {{ formatEmployeeName(user.employee) || "—" }}
                </p>
                <p v-if="user.employee?.employeeId" class="text-[11px] tabular-nums text-gray-500">{{ user.employee.employeeId }}</p>
                <p v-else class="text-xs text-gray-600">Not linked</p>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]" :class="roleBadgeClass(user.role)">
                  {{ user.role }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="key in moduleKeys"
                    v-show="user.modulePermissions?.[key]"
                    :key="key"
                    class="rounded bg-case-elevated px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                    :class="user.moduleRoles?.[key] === 'admin' ? 'text-primary' : 'text-gray-400'"
                  >
                    {{ moduleLabel(key) }}<span class="ml-1 opacity-60">·{{ user.moduleRoles?.[key] || 'viewer' }}</span>
                  </span>
                  <span v-if="!hasAnyModule(user)" class="text-[10px] text-gray-600">none</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]" :class="user.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'">
                  {{ user.active ? "Active" : "Disabled" }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    class="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                    @click="openEdit(user)"
                  >
                    Edit
                  </button>
                  <button
                    v-if="user.active"
                    type="button"
                    class="rounded-md bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="busyId === user.id || isSelf(user)"
                    @click="confirmDisable(user)"
                  >
                    Disable
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rounded-md bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="busyId === user.id"
                    @click="confirmEnable(user)"
                  >
                    Enable
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit modal -->
    <div
      v-if="editForm.visible"
      class="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      @click.self="closeEdit"
    >
      <div class="my-8 w-full max-w-2xl rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <div class="mb-5 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Edit User</p>
            <h3 class="mt-2 text-xl font-semibold text-white">{{ editForm.username }}</h3>
            <p class="text-xs text-gray-500">{{ editForm.email }}</p>
          </div>
          <button class="text-gray-500 hover:text-gray-200" @click="closeEdit">
            <Icon icon="mdi:close" class="text-xl" />
          </button>
        </div>

        <div class="space-y-5">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">System Role</p>
            <div class="grid gap-2 sm:grid-cols-3">
              <label
                v-for="opt in systemRoles"
                :key="opt.value"
                class="flex cursor-pointer items-start gap-3 rounded-xl border bg-case-card p-3 transition"
                :class="editForm.role === opt.value ? 'border-primary/60 ring-2 ring-primary/20' : 'border-case-border hover:border-case-elevated'"
              >
                <input v-model="editForm.role" :value="opt.value" type="radio" name="editSystemRole" class="mt-1 h-4 w-4 text-primary focus:ring-primary/30" />
                <div>
                  <p class="text-sm font-semibold text-gray-200">{{ opt.label }}</p>
                  <p class="mt-0.5 text-[11px] text-gray-500">{{ opt.description }}</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Module Assignments</p>
            <div class="space-y-2">
              <div
                v-for="mod in modules"
                :key="mod.key"
                class="flex flex-col gap-2 rounded-xl border bg-case-card p-3 sm:flex-row sm:items-center sm:justify-between"
                :class="editForm.modulePermissions[mod.key] ? 'border-primary/40' : 'border-case-border'"
              >
                <label class="flex flex-1 cursor-pointer items-center gap-2.5">
                  <input
                    v-model="editForm.modulePermissions[mod.key]"
                    type="checkbox"
                    class="h-4 w-4 rounded border-case-border bg-case-elevated text-primary focus:ring-primary/30"
                  />
                  <span class="text-sm font-medium text-gray-200">{{ mod.title }}</span>
                </label>
                <select
                  v-model="editForm.moduleRoles[mod.key]"
                  :disabled="!editForm.modulePermissions[mod.key]"
                  class="rounded-lg border border-case-border bg-case-elevated px-3 py-1.5 text-xs text-gray-200 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-40 sm:w-40"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Reset Password</p>
            <input
              v-model="editForm.password"
              type="password"
              autocomplete="new-password"
              placeholder="Leave blank to keep current password"
              class="w-full rounded-xl border border-case-border bg-case-card px-4 py-2.5 text-sm text-gray-200 outline-none focus:border-primary"
            />
          </div>

          <div v-if="editError" class="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
            {{ editError }}
          </div>
        </div>

        <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-case-border px-4 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
            @click="closeEdit"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="editSubmitting"
            @click="submitEdit"
          >
            {{ editSubmitting ? "Saving..." : "Save changes" }}
          </button>
        </div>
      </div>
    </div>

    <ConfirmationDialog
      :visible="confirmationDialog.visible"
      :title="confirmationDialog.title"
      :description="confirmationDialog.description"
      :confirm-text="confirmationDialog.confirmText"
      @cancel="closeConfirmationDialog(false)"
      @confirm="closeConfirmationDialog(true)"
    />
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  const MODULES = [
    { key: "admin", title: "Admin" },
    { key: "cases", title: "Cases" },
    { key: "logistics", title: "Assets Management" },
    { key: "operations", title: "Operations" },
    { key: "social", title: "Communication" },
  ];

  const SYSTEM_ROLES = [
    { value: "admin", label: "Admin", description: "Full system control." },
    { value: "officer", label: "Officer", description: "Operational user." },
    { value: "viewer", label: "Viewer", description: "Read-only system role." },
  ];

  function defaultModuleMap(value) {
    return MODULES.reduce((acc, m) => ((acc[m.key] = value), acc), {});
  }

  function emptyEditForm() {
    return {
      visible: false,
      id: "",
      username: "",
      email: "",
      role: "viewer",
      modulePermissions: defaultModuleMap(false),
      moduleRoles: defaultModuleMap("viewer"),
      password: "",
    };
  }

  export default {
    name: "UsersList",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        users: [],
        loading: false,
        search: "",
        message: { type: "", text: "" },
        modules: MODULES,
        moduleKeys: MODULES.map((m) => m.key),
        systemRoles: SYSTEM_ROLES,
        busyId: "",
        editForm: emptyEditForm(),
        editError: "",
        editSubmitting: false,
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      activeCount() {
        return this.users.filter((u) => u.active).length;
      },
      disabledCount() {
        return this.users.filter((u) => !u.active).length;
      },
      filteredUsers() {
        const q = this.search.trim().toLowerCase();
        if (!q) return this.users;
        return this.users.filter((u) =>
          (u.username || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q) ||
          (u.employee?.employeeId || "").toLowerCase().includes(q) ||
          (this.formatEmployeeName(u.employee) || "").toLowerCase().includes(q)
        );
      },
      currentUserId() {
        try {
          return JSON.parse(localStorage.getItem("auth_user") || "null")?.id || "";
        } catch {
          return "";
        }
      },
    },
    methods: {
      isSelf(user) {
        return String(user.id) === String(this.currentUserId);
      },
      moduleLabel(key) {
        return MODULES.find((m) => m.key === key)?.title || key;
      },
      hasAnyModule(user) {
        return MODULES.some((m) => user.modulePermissions?.[m.key]);
      },
      formatEmployeeName(emp) {
        if (!emp) return "";
        return [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(" ").trim();
      },
      roleBadgeClass(role) {
        const m = {
          admin: "bg-primary/15 text-primary",
          officer: "bg-blue-500/15 text-blue-300",
          viewer: "bg-gray-500/15 text-gray-300",
        };
        return m[role] || "bg-gray-500/15 text-gray-300";
      },
      async loadUsers() {
        this.loading = true;
        this.message = { type: "", text: "" };
        try {
          const res = await API.get("/auth/users");
          this.users = Array.isArray(res.data?.users) ? res.data.users : [];
        } catch (err) {
          this.message = { type: "error", text: err.response?.data?.message || "Unable to load users." };
        } finally {
          this.loading = false;
        }
      },
      openEdit(user) {
        this.editError = "";
        this.editForm = {
          visible: true,
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || "viewer",
          modulePermissions: { ...defaultModuleMap(false), ...(user.modulePermissions || {}) },
          moduleRoles: { ...defaultModuleMap("viewer"), ...(user.moduleRoles || {}) },
          password: "",
        };
      },
      closeEdit() {
        if (this.editSubmitting) return;
        this.editForm = emptyEditForm();
        this.editError = "";
      },
      openConfirmationDialog({ title, description, confirmText }) {
        this.confirmationDialog = { visible: true, title, description, confirmText };
        return new Promise((resolve) => {
          this.confirmationResolver = resolve;
        });
      },
      closeConfirmationDialog(confirmed) {
        this.confirmationDialog = createConfirmationDialogState();
        resolveConfirmation(this.confirmationResolver, confirmed);
        this.confirmationResolver = null;
      },
      async submitEdit() {
        const id = this.editForm.id;
        if (!id) return;
        const confirmed = await this.openConfirmationDialog({
          title: "Update this account?",
          description: `Apply role, module assignments${this.editForm.password ? ", and reset password" : ""} for ${this.editForm.username}.`,
          confirmText: "Yes, update",
        });
        if (!confirmed) return;

        this.editSubmitting = true;
        this.editError = "";
        try {
          const payload = {
            role: this.editForm.role,
            modulePermissions: { ...this.editForm.modulePermissions },
            moduleRoles: { ...this.editForm.moduleRoles },
          };
          if (this.editForm.password) payload.password = this.editForm.password;

          const res = await API.put(`/auth/users/${id}`, payload);
          const updated = res.data?.user;
          if (updated) {
            const idx = this.users.findIndex((u) => u.id === id);
            if (idx >= 0) this.users.splice(idx, 1, { ...this.users[idx], ...updated });
          }
          this.message = { type: "success", text: `Updated ${this.editForm.username}.` };
          this.editForm = emptyEditForm();
        } catch (err) {
          this.editError = err.response?.data?.message || "Unable to update user.";
        } finally {
          this.editSubmitting = false;
        }
      },
      async confirmDisable(user) {
        if (this.isSelf(user)) return;
        const confirmed = await this.openConfirmationDialog({
          title: "Disable this account?",
          description: `${user.username} will no longer be able to sign in. You can re-enable the account later.`,
          confirmText: "Yes, disable",
        });
        if (!confirmed) return;
        this.busyId = user.id;
        this.message = { type: "", text: "" };
        try {
          const res = await API.put(`/auth/users/${user.id}`, { active: false });
          const updated = res.data?.user;
          const idx = this.users.findIndex((u) => u.id === user.id);
          if (idx >= 0 && updated) this.users.splice(idx, 1, { ...this.users[idx], ...updated });
          this.message = { type: "success", text: `Disabled ${user.username}.` };
        } catch (err) {
          this.message = { type: "error", text: err.response?.data?.message || "Unable to disable user." };
        } finally {
          this.busyId = "";
        }
      },
      async confirmEnable(user) {
        const confirmed = await this.openConfirmationDialog({
          title: "Re-enable this account?",
          description: `${user.username} will be able to sign in again.`,
          confirmText: "Yes, enable",
        });
        if (!confirmed) return;
        this.busyId = user.id;
        this.message = { type: "", text: "" };
        try {
          const res = await API.put(`/auth/users/${user.id}`, { active: true });
          const updated = res.data?.user;
          const idx = this.users.findIndex((u) => u.id === user.id);
          if (idx >= 0 && updated) this.users.splice(idx, 1, { ...this.users[idx], ...updated });
          this.message = { type: "success", text: `Enabled ${user.username}.` };
        } catch (err) {
          this.message = { type: "error", text: err.response?.data?.message || "Unable to enable user." };
        } finally {
          this.busyId = "";
        }
      },
    },
    mounted() {
      this.loadUsers();
    },
  };
</script>
