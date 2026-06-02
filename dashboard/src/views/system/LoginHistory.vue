<template>
  <div class="min-h-screen bg-case-bg p-6 sm:p-8">
    <div class="mx-auto max-w-5xl space-y-6">

      <div class="border-b border-case-border pb-5">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">System / User &amp; Account</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Login History</h1>
        <p class="mt-1 text-sm text-gray-500">Review recent sign-ins and check who accessed the system.</p>
      </div>

      <div class="flex items-center justify-between">
        <p class="text-sm text-gray-500">{{ entries.length }} entr{{ entries.length !== 1 ? "ies" : "y" }}</p>
        <button
          type="button"
          class="rounded-xl border border-case-border px-4 py-2 text-sm font-medium text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
          :disabled="isLoading"
          @click="fetchHistory"
        >
          {{ isLoading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <div
        v-if="message.text"
        :class="message.type === 'error' ? 'border-red-900/50 bg-red-950/30 text-red-400' : 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ message.text }}
      </div>

      <div v-if="isLoading" class="space-y-2">
        <div v-for="i in 5" :key="i" class="h-12 animate-pulse rounded-xl bg-case-elevated"></div>
      </div>

      <div v-else-if="!entries.length" class="py-12 text-center text-sm text-gray-600">
        No login history records found yet.
      </div>

      <div v-else class="rounded-xl border border-case-border bg-case-surface overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-case-border">
            <thead class="bg-case-card">
              <tr class="text-left text-[10px] uppercase tracking-[0.22em] text-gray-600">
                <th class="px-4 py-3 font-medium">User</th>
                <th class="px-4 py-3 font-medium">Role</th>
                <th class="px-4 py-3 font-medium">Time</th>
                <th class="px-4 py-3 font-medium">IP Address</th>
                <th class="px-4 py-3 font-medium">Device</th>
                <th class="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-case-border/50">
              <tr
                v-for="entry in entries"
                :key="entry.id"
                class="align-top hover:bg-case-card transition-colors"
              >
                <td class="px-4 py-3.5">
                  <div class="font-medium text-gray-200">{{ entry.username || "Unknown" }}</div>
                  <div class="mt-0.5 text-xs text-gray-500">{{ entry.email || "—" }}</div>
                </td>
                <td class="px-4 py-3.5">
                  <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.15em] text-primary">
                    {{ entry.role || "viewer" }}
                  </span>
                </td>
                <td class="px-4 py-3.5 text-sm text-gray-400">{{ formatDate(entry.createdAt) }}</td>
                <td class="px-4 py-3.5 font-mono text-xs text-gray-500">{{ entry.ipAddress || "—" }}</td>
                <td class="px-4 py-3.5 text-xs text-gray-500 max-w-[180px]">
                  <span class="truncate block">{{ entry.userAgent || "—" }}</span>
                </td>
                <td class="px-4 py-3.5">
                  <span
                    :class="entry.status === 'success' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-red-900/20 text-red-400'"
                    class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.15em]"
                  >
                    {{ entry.status || "success" }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
  import API from "@/services/api";

  export default {
    name: "LoginHistoryPage",
    data() {
      return {
        isLoading: false,
        entries: [],
        message: { type: "", text: "" },
      };
    },
    mounted() {
      this.fetchHistory();
    },
    methods: {
      async fetchHistory() {
        this.isLoading = true;
        this.message = { type: "", text: "" };
        try {
          const response = await API.get("/auth/login-history");
          this.entries = response.data.entries || [];
        } catch (error) {
          this.message = {
            type: "error",
            text: error.response?.data?.message || "Unable to load login history right now.",
          };
        } finally {
          this.isLoading = false;
        }
      },
      formatDate(value) {
        if (!value) return "—";
        return new Intl.DateTimeFormat("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        }).format(new Date(value));
      },
    },
  };
</script>
