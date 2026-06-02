<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / HRIS</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Personnel</h1>
        <p class="mt-1 text-sm text-gray-500">Employee profiles and 201 file documents.</p>
      </div>
      <button
        v-if="canEdit"
        type="button"
        class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500"
        @click="$router.push('/admin/hris/new')"
      >
        + Add Employee
      </button>
      <span v-else class="rounded-full border border-case-border bg-case-elevated px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
        Read-only
      </span>
    </header>

    <div class="mb-5 flex items-center rounded-xl border border-case-border bg-case-surface px-3 py-2">
      <Icon icon="mdi:magnify" class="text-lg text-gray-500" />
      <input
        v-model="search"
        type="search"
        placeholder="Search by employee ID, name, position, department..."
        class="w-full bg-transparent px-2 py-1 text-sm text-gray-200 outline-none placeholder:text-gray-600"
        @input="onSearchInput"
      />
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {{ errorMessage }}
    </div>

    <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
      <table class="w-full text-left text-sm">
        <thead class="bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium w-14"></th>
            <th class="px-4 py-3 font-medium">Employee ID</th>
            <th class="px-4 py-3 font-medium">Full Name</th>
            <th class="px-4 py-3 font-medium">Position</th>
            <th class="px-4 py-3 font-medium">Department</th>
            <th class="px-4 py-3 font-medium">Status</th>
            <th class="px-4 py-3 font-medium">Docs</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-case-border text-gray-300">
          <tr v-if="isLoading">
            <td colspan="8" class="px-4 py-6 text-center text-gray-500">Loading employees...</td>
          </tr>
          <tr v-else-if="!employees.length">
            <td colspan="8" class="px-4 py-6 text-center text-gray-500">No employees yet.</td>
          </tr>
          <tr
            v-for="employee in employees"
            :key="employee.id"
            class="hover:bg-case-card transition-colors cursor-pointer"
            @click="$router.push(`/admin/hris/${employee.id}`)"
          >
            <td class="px-4 py-3">
              <div class="h-10 w-10 overflow-hidden rounded-full border border-case-border bg-primary/15">
                <img
                  v-if="employee.profilePicture?.url"
                  :src="employee.profilePicture.url"
                  :alt="employee.fullName"
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                  {{ initialsFor(employee) }}
                </div>
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-white tabular-nums">{{ employee.employeeId }}</td>
            <td class="px-4 py-3">{{ employee.fullName }}</td>
            <td class="px-4 py-3 text-gray-400">{{ employee.position || '—' }}</td>
            <td class="px-4 py-3 text-gray-400">{{ employee.department || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="statusBadgeClass(employee.status)" class="rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]">
                {{ employee.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-400 tabular-nums">{{ employee.documentCount }}</td>
            <td class="px-4 py-3 text-right" @click.stop>
              <div class="inline-flex items-center gap-1">
                <button
                  type="button"
                  class="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  @click="$router.push(`/admin/hris/${employee.id}`)"
                >
                  View
                </button>
                <button
                  v-if="canEdit"
                  type="button"
                  class="rounded-md bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20"
                  @click="$router.push(`/admin/hris/${employee.id}/edit`)"
                >
                  Edit
                </button>
                <button
                  v-if="canEdit"
                  type="button"
                  class="rounded-md bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="deletingId === employee.id"
                  @click="confirmDelete(employee)"
                >
                  {{ deletingId === employee.id ? "…" : "Delete" }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
  import { canEditModule } from "@/services/access";
  import {
    createConfirmationDialogState,
    resolveConfirmation,
  } from "@/helper/record-confirmation";

  export default {
    name: "AdminHris",
    components: { Icon, ConfirmationDialog },
    computed: {
      canEdit() {
        return canEditModule("admin");
      },
    },
    data() {
      return {
        employees: [],
        search: "",
        searchTimer: null,
        isLoading: false,
        errorMessage: "",
        deletingId: "",
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    methods: {
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
      async loadEmployees() {
        this.isLoading = true;
        this.errorMessage = "";
        try {
          const path = this.search.trim()
            ? `/admin/hris/employees?q=${encodeURIComponent(this.search.trim())}`
            : "/admin/hris/employees";
          const res = await API.get(path);
          this.employees = Array.isArray(res.data?.employees) ? res.data.employees : [];
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load employees.";
        } finally {
          this.isLoading = false;
        }
      },
      onSearchInput() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.loadEmployees(), 300);
      },
      async confirmDelete(employee) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete employee?",
          description: `Employee "${employee.fullName}" (${employee.employeeId}) and ALL related documents will be permanently removed. This cannot be undone.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        this.deletingId = employee.id;
        try {
          await API.delete(`/admin/hris/employees/${employee.id}`);
          await this.loadEmployees();
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete employee.";
        } finally {
          this.deletingId = "";
        }
      },
      statusBadgeClass(status) {
        const map = {
          Active: "bg-emerald-500/15 text-emerald-300",
          "On Leave": "bg-amber-500/15 text-amber-300",
          Resigned: "bg-gray-500/15 text-gray-300",
          Retired: "bg-blue-500/15 text-blue-300",
          Terminated: "bg-red-500/15 text-red-300",
        };
        return map[status] || "bg-gray-500/15 text-gray-300";
      },
      initialsFor(employee) {
        const a = (employee?.firstName || " ").charAt(0);
        const b = (employee?.lastName || " ").charAt(0);
        const initials = `${a}${b}`.trim().toUpperCase();
        return initials || "?";
      },
    },
    mounted() {
      this.loadEmployees();
    },
    beforeUnmount() {
      clearTimeout(this.searchTimer);
    },
  };
</script>
