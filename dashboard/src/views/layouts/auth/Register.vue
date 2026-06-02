<template>
  <div class="min-h-screen bg-case-bg p-6 sm:p-8">
    <div class="mx-auto max-w-3xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">System / User &amp; Account</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Create Account</h1>
        <p class="mt-1 text-sm text-gray-500">Provision a new user. Optionally pick an HRIS employee with no account yet, then assign modules and roles.</p>
      </div>

      <div
        v-if="message.text"
        :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ message.text }}
      </div>

      <!-- Pending employees panel -->
      <section class="rounded-xl border border-case-border bg-case-surface p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Employees Without Account</h2>
            <p class="mt-1 text-xs text-gray-500">Pick one to pre-fill credentials and link the new account to their HRIS profile.</p>
          </div>
          <span class="rounded-full bg-case-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
            {{ unlinkedEmployees.length }} pending
          </span>
        </div>

        <div v-if="form.linkedEmployee" class="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Linked Employee</p>
              <p class="mt-1 text-sm font-semibold text-white truncate">{{ form.linkedEmployee.fullName }}</p>
              <p class="text-xs text-gray-400 truncate">
                {{ form.linkedEmployee.employeeId }}<span v-if="form.linkedEmployee.position"> · {{ form.linkedEmployee.position }}</span>
              </p>
              <p v-if="form.linkedEmployee.department" class="text-[11px] text-gray-500 truncate">{{ form.linkedEmployee.department }}</p>
            </div>
            <button
              type="button"
              class="flex-shrink-0 rounded-md border border-case-border bg-case-card px-2.5 py-1 text-[11px] text-gray-300 hover:bg-case-elevated hover:text-gray-100"
              @click="clearLink"
            >
              Clear
            </button>
          </div>
        </div>

        <template v-else>
          <div class="relative mb-3">
            <Icon icon="mdi:magnify" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
            <input
              v-model="employeeSearch"
              type="text"
              placeholder="Search by name, employee ID, position..."
              class="w-full rounded-lg border border-case-border bg-case-card pl-9 pr-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none"
            />
          </div>

          <div v-if="loadingUnlinked" class="rounded-xl border border-dashed border-case-border px-4 py-6 text-center text-xs text-gray-500">
            Loading unlinked employees...
          </div>
          <div v-else-if="!unlinkedEmployees.length" class="rounded-xl border border-dashed border-case-border px-4 py-6 text-center text-xs text-gray-500">
            All employees already have user accounts.
          </div>
          <div v-else-if="!filteredUnlinked.length" class="rounded-xl border border-dashed border-case-border px-4 py-6 text-center text-xs text-gray-500">
            No employees match "{{ employeeSearch }}".
          </div>
          <ul v-else class="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            <li
              v-for="emp in filteredUnlinked"
              :key="emp.id"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 rounded-lg border border-case-border bg-case-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-case-elevated"
                @click="linkEmployee(emp)"
              >
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-200 truncate">{{ emp.fullName }}</p>
                  <p class="text-[11px] text-gray-500 truncate">
                    <span class="font-medium tabular-nums text-gray-400">{{ emp.employeeId }}</span>
                    <span v-if="emp.position"> · {{ emp.position }}</span>
                    <span v-if="emp.department"> · {{ emp.department }}</span>
                  </p>
                </div>
                <span class="flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  Use <Icon icon="mdi:arrow-right" class="ml-0.5 inline-block align-text-bottom" />
                </span>
              </button>
            </li>
          </ul>
        </template>
      </section>

      <form @submit.prevent="handleRegister" class="space-y-6">

        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <h2 class="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Credentials</h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="username" class="mb-2 block text-sm font-medium text-gray-400">Username</label>
              <input
                id="username"
                v-model.trim="form.username"
                type="text"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="agent.name"
              />
            </div>
            <div>
              <label for="email" class="mb-2 block text-sm font-medium text-gray-400">Email address</label>
              <input
                id="email"
                v-model.trim="form.email"
                type="email"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="agent@agency.gov"
              />
            </div>
            <div>
              <label for="password" class="mb-2 block text-sm font-medium text-gray-400">Password</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Create a strong password"
              />
            </div>
            <div>
              <label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-400">Confirm password</label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                class="w-full rounded-xl border border-case-border bg-case-card px-4 py-3 text-gray-200 outline-none transition placeholder:text-gray-600 focus:border-primary focus:ring-4 focus:ring-primary/10"
                placeholder="Re-enter password"
              />
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">System Role</h2>
            <p class="text-xs text-gray-600">Used for system-wide checks (e.g. user management).</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <label
              v-for="opt in systemRoles"
              :key="opt.value"
              class="flex cursor-pointer items-start gap-3 rounded-xl border bg-case-card p-3 transition"
              :class="form.role === opt.value ? 'border-primary/60 ring-2 ring-primary/20' : 'border-case-border hover:border-case-elevated'"
            >
              <input v-model="form.role" :value="opt.value" type="radio" name="systemRole" class="mt-1 h-4 w-4 text-primary focus:ring-primary/30" />
              <div>
                <p class="text-sm font-semibold text-gray-200">{{ opt.label }}</p>
                <p class="mt-0.5 text-xs text-gray-500">{{ opt.description }}</p>
              </div>
            </label>
          </div>
        </section>

        <section class="rounded-xl border border-case-border bg-case-surface p-6">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <h2 class="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Module Assignments</h2>
              <p class="mt-1 text-xs text-gray-500">Pick which modules the user can open, then choose their role inside each.</p>
            </div>
            <span class="rounded-full bg-case-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
              {{ assignedCount }} / {{ modules.length }} assigned
            </span>
          </div>

          <div class="space-y-3">
            <div
              v-for="mod in modules"
              :key="mod.key"
              class="flex flex-col gap-3 rounded-xl border bg-case-card p-4 transition sm:flex-row sm:items-center sm:justify-between"
              :class="form.modulePermissions[mod.key] ? 'border-primary/40' : 'border-case-border'"
            >
              <label class="flex flex-1 cursor-pointer items-start gap-3">
                <input
                  v-model="form.modulePermissions[mod.key]"
                  type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-case-border bg-case-elevated text-primary focus:ring-primary/30"
                />
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-200">{{ mod.title }}</p>
                  <p class="mt-0.5 text-xs text-gray-500">{{ mod.description }}</p>
                </div>
              </label>

              <div class="flex items-center gap-2 sm:w-52">
                <label class="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">Role</label>
                <select
                  v-model="form.moduleRoles[mod.key]"
                  :disabled="!form.modulePermissions[mod.key]"
                  class="flex-1 rounded-lg border border-case-border bg-case-elevated px-3 py-1.5 text-xs text-gray-200 outline-none transition focus:border-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
          </div>

          <p v-if="!assignedCount" class="mt-3 text-xs text-amber-400">
            <span class="font-semibold">Heads up:</span> the user will land on the home page with no modules to open.
          </p>
        </section>

        <label class="flex cursor-pointer items-start gap-3 text-sm text-gray-500">
          <input
            v-model="form.acceptTerms"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-case-border bg-case-card text-primary focus:ring-primary/30"
          />
          <span>I confirm this account should be created with the selected role and module assignments.</span>
        </label>

        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            @click="$router.back()"
            class="rounded-xl border border-case-border px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSubmitting ? "Saving..." : "Create user" }}
          </button>
        </div>

      </form>

      <ConfirmationDialog
        :visible="confirmationDialog.visible"
        :title="confirmationDialog.title"
        :description="confirmationDialog.description"
        :confirm-text="confirmationDialog.confirmText"
        @cancel="closeConfirmationDialog(false)"
        @confirm="closeConfirmationDialog(true)"
      />
    </div>
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
    { key: "admin", title: "ADMIN", description: "Personnel, DTR, OPCR, calendar, document tracking." },
    { key: "cases", title: "Case Management", description: "Records, focus operations, crime clusters, NALECC-SCOC." },
    { key: "logistics", title: "Assets Management", description: "Inventory, vehicles, requisitions, suppliers, maintenance." },
    { key: "operations", title: "Operations", description: "Missions, deployments, SITREPs, after-action reports." },
    { key: "social", title: "Communication", description: "Social accounts, posts, alerts, analyst campaigns." },
  ];

  const SYSTEM_ROLES = [
    { value: "admin", label: "Admin", description: "Full system control, user management." },
    { value: "officer", label: "Officer", description: "Operational user, can act on assigned modules." },
    { value: "viewer", label: "Viewer", description: "Read-only across the system." },
  ];

  function suggestUsername(emp) {
    const first = String(emp?.firstName || "").trim().toLowerCase();
    const last = String(emp?.lastName || "").trim().toLowerCase();
    const stripped = (s) => s.replace(/[^a-z0-9]+/g, "");
    if (first && last) return `${stripped(first)}.${stripped(last)}`;
    if (last) return stripped(last);
    if (first) return stripped(first);
    return "";
  }

  function emptyForm() {
    return {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "officer",
      modulePermissions: MODULES.reduce((acc, m) => ((acc[m.key] = false), acc), {}),
      moduleRoles: MODULES.reduce((acc, m) => ((acc[m.key] = "viewer"), acc), {}),
      acceptTerms: false,
      linkedEmployee: null,
    };
  }

  export default {
    name: "RegisterPage",
    components: { Icon, ConfirmationDialog },
    data() {
      return {
        isSubmitting: false,
        message: { type: "", text: "" },
        modules: MODULES,
        systemRoles: SYSTEM_ROLES,
        form: emptyForm(),
        unlinkedEmployees: [],
        loadingUnlinked: false,
        employeeSearch: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      assignedCount() {
        return Object.values(this.form.modulePermissions).filter(Boolean).length;
      },
      filteredUnlinked() {
        const q = this.employeeSearch.trim().toLowerCase();
        if (!q) return this.unlinkedEmployees;
        return this.unlinkedEmployees.filter((e) =>
          (e.fullName || "").toLowerCase().includes(q) ||
          (e.employeeId || "").toLowerCase().includes(q) ||
          (e.position || "").toLowerCase().includes(q) ||
          (e.department || "").toLowerCase().includes(q) ||
          (e.email || "").toLowerCase().includes(q)
        );
      },
    },
    methods: {
      async loadUnlinked() {
        this.loadingUnlinked = true;
        try {
          const res = await API.get("/admin/hris/employees/unlinked");
          this.unlinkedEmployees = Array.isArray(res.data?.employees) ? res.data.employees : [];
        } catch {
          this.unlinkedEmployees = [];
        } finally {
          this.loadingUnlinked = false;
        }
      },
      linkEmployee(emp) {
        this.form.linkedEmployee = {
          id: emp.id,
          employeeId: emp.employeeId || "",
          firstName: emp.firstName || "",
          middleName: emp.middleName || "",
          lastName: emp.lastName || "",
          fullName: emp.fullName || "",
          department: emp.department || "",
          position: emp.position || "",
          dateHired: emp.dateHired || null,
        };
        if (!this.form.username) this.form.username = suggestUsername(emp);
        if (!this.form.email && emp.email) this.form.email = emp.email;
      },
      clearLink() {
        this.form.linkedEmployee = null;
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
      async handleRegister() {
        this.message = { type: "", text: "" };

        if (!this.form.username || !this.form.email || !this.form.password) {
          this.message = { type: "error", text: "Username, email, and password are required." };
          return;
        }
        if (this.form.password !== this.form.confirmPassword) {
          this.message = { type: "error", text: "Password confirmation does not match." };
          return;
        }
        if (!this.form.acceptTerms) {
          this.message = { type: "error", text: "Confirm the selected role and module assignments before creating the user." };
          return;
        }

        const linked = this.form.linkedEmployee;
        const subject = linked?.fullName || this.form.username;
        const confirmed = await this.openConfirmationDialog({
          title: "Create this account?",
          description: linked
            ? `A user account will be created for ${subject} (${linked.employeeId}) with the selected role and module assignments.`
            : `A user account "${this.form.username}" will be created with the selected role and module assignments.`,
          confirmText: "Yes, create",
        });
        if (!confirmed) return;

        this.isSubmitting = true;
        try {
          const response = await API.post("/auth/register", {
            username: this.form.username,
            email: this.form.email,
            password: this.form.password,
            role: this.form.role,
            modulePermissions: { ...this.form.modulePermissions },
            moduleRoles: { ...this.form.moduleRoles },
            ...(linked
              ? {
                  employee: {
                    employeeId: linked.employeeId,
                    firstName: linked.firstName,
                    middleName: linked.middleName,
                    lastName: linked.lastName,
                    department: linked.department,
                    position: linked.position,
                    dateHired: linked.dateHired,
                  },
                }
              : {}),
          });
          this.message = { type: "success", text: response.data.message || "User created successfully." };
          this.form = emptyForm();
          this.employeeSearch = "";
          await this.loadUnlinked();
        } catch (error) {
          this.message = {
            type: "error",
            text: error.response?.data?.message || "Unable to save the user right now.",
          };
        } finally {
          this.isSubmitting = false;
        }
      },
    },
    mounted() {
      this.loadUnlinked();
    },
  };
</script>
