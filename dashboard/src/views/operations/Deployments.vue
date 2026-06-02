<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Operations</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Deployments</h1>
      </div>
      <button @click="openCreate" class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> New Deployment
      </button>
    </header>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by personnel, mission, location..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterStatus" @change="load" class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <section class="bg-case-surface border border-case-border rounded-xl">
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>
        <table v-else-if="deployments.length" class="w-full text-sm">
          <thead>
            <tr class="border-b border-case-border">
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Personnel</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Mission</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Role</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Vehicle</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Location</th>
              <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              <th class="py-2.5 px-3 text-right text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in deployments" :key="d._id" class="border-b border-case-border/40 hover:bg-case-card transition-colors">
              <td @click="openEdit(d)" class="py-2.5 px-3 cursor-pointer">
                <p class="text-gray-200 font-medium">{{ d.personnel?.name }}</p>
                <p class="text-[10px] text-gray-500">{{ d.personnel?.rank }} {{ d.personnel?.unit }}</p>
              </td>
              <td @click="openEdit(d)" class="py-2.5 px-3 text-gray-400 text-xs cursor-pointer">{{ d.missionCodeName }}</td>
              <td @click="openEdit(d)" class="py-2.5 px-3 text-gray-500 text-xs cursor-pointer">{{ d.role || "—" }}</td>
              <td @click="openEdit(d)" class="py-2.5 px-3 text-gray-500 text-xs cursor-pointer">{{ d.vehiclePlate || "—" }}</td>
              <td @click="openEdit(d)" class="py-2.5 px-3 text-gray-500 text-xs cursor-pointer">{{ d.deploymentLocation || "—" }}</td>
              <td @click="openEdit(d)" class="py-2.5 px-3 cursor-pointer">
                <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="statusBadge(d.status)">{{ d.status }}</span>
              </td>
              <td class="py-2.5 px-3 text-right">
                <div class="inline-flex gap-1">
                  <button v-if="d.status === 'scheduled'" @click.stop="markDeployed(d)" title="Mark deployed"
                    class="rounded p-1 text-cyan-400 hover:bg-cyan-950/40"><Icon icon="mdi:rocket-launch-outline" /></button>
                  <button v-if="d.status === 'deployed'" @click.stop="markReturned(d)" title="Mark returned"
                    class="rounded p-1 text-emerald-400 hover:bg-emerald-950/40"><Icon icon="mdi:arrow-u-left-bottom" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:account-group-outline" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No deployments {{ searchQuery ? "match your search" : "logged yet" }}.</p>
          <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Log first deployment</button>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit Deployment" : "New Deployment" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Mission <span class="text-primary">*</span></label>
              <select v-model="form.mission" @change="onMissionChange" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option value="">Select mission...</option>
                <option v-for="m in missionOptions" :key="m._id" :value="m._id">{{ m.codeName }} ({{ m.missionId }})</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Name <span class="text-primary">*</span></label>
              <input v-model.trim="form.personnel.name" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Rank</label>
              <input v-model.trim="form.personnel.rank" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Unit</label>
              <input v-model.trim="form.personnel.unit" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Contact</label>
              <input v-model.trim="form.personnel.contact" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Role</label>
              <input v-model.trim="form.role" type="text" placeholder="e.g. Sniper, Negotiator" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Vehicle Plate</label>
              <input v-model.trim="form.vehiclePlate" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select v-model="form.status" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Deployment Location</label>
              <input v-model.trim="form.deploymentLocation" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Notes</label>
              <textarea v-model="form.notes" rows="3" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" @click="confirmDelete" class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated">Cancel</button>
              <button @click="submit" :disabled="!canSubmit || submitting" class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                <Icon v-if="submitting" icon="mdi:loading" class="animate-spin" />
                <Icon v-else icon="mdi:content-save-outline" />
                {{ submitting ? "Saving..." : (editing?._id ? "Update" : "Save") }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";

  const STATUSES = ["scheduled", "deployed", "returned", "extracted", "cancelled"];

  function emptyForm() {
    return {
      mission: "", missionCodeName: "", role: "", status: "scheduled",
      personnel: { name: "", rank: "", unit: "", contact: "" },
      vehiclePlate: "", deploymentLocation: "", notes: "",
    };
  }

  export default {
    name: "Deployments",
    components: { Icon },
    data() {
      return { STATUSES, deployments: [], missionOptions: [], loading: false, error: "", searchQuery: "", searchDebounce: null, filterStatus: "", showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "" };
    },
    computed: {
      canSubmit() { return !!(this.form.mission && this.form.personnel?.name?.trim()); },
    },
    methods: {
      statusBadge(s) {
        const m = { scheduled: "bg-case-elevated text-gray-400", deployed: "bg-cyan-950/40 text-cyan-400", returned: "bg-emerald-950/40 text-emerald-400", extracted: "bg-amber-950/40 text-amber-400", cancelled: "bg-red-950/40 text-red-400" };
        return m[s] || "bg-case-elevated text-gray-400";
      },
      onSearchInput() { clearTimeout(this.searchDebounce); this.searchDebounce = setTimeout(() => this.load(), 300); },
      onMissionChange() {
        const m = this.missionOptions.find((x) => x._id === this.form.mission);
        this.form.missionCodeName = m?.codeName || "";
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterStatus) params.set("status", this.filterStatus);
          const res = await API.get(`/operations/deployments${params.toString() ? `?${params}` : ""}`);
          this.deployments = Array.isArray(res.data) ? res.data : [];
        } catch (err) { this.error = err.response?.data?.message || "Unable to load deployments."; }
        finally { this.loading = false; }
      },
      async loadMissions() {
        try {
          const res = await API.get("/operations/missions");
          this.missionOptions = Array.isArray(res.data) ? res.data : [];
        } catch { /* non-fatal */ }
      },
      openCreate() { this.editing = null; this.form = emptyForm(); this.submitError = ""; this.showModal = true; },
      openEdit(d) {
        this.editing = d;
        this.form = { ...emptyForm(), ...d, personnel: { ...emptyForm().personnel, ...(d.personnel || {}) } };
        this.submitError = ""; this.showModal = true;
      },
      closeModal() { if (!this.submitting) { this.showModal = false; this.editing = null; } },
      async submit() {
        if (!this.canSubmit || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          let res;
          if (this.editing?._id) res = await API.put(`/operations/deployments/${this.editing._id}`, this.form);
          else res = await API.post("/operations/deployments", this.form);
          const d = res.data?.deployment;
          const idx = this.deployments.findIndex((x) => x._id === d._id);
          if (idx >= 0) this.deployments.splice(idx, 1, d); else this.deployments.unshift(d);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to save."; }
        finally { this.submitting = false; }
      },
      async confirmDelete() {
        if (!this.editing?._id || !window.confirm("Delete this deployment?")) return;
        this.submitting = true;
        try {
          await API.delete(`/operations/deployments/${this.editing._id}`);
          this.deployments = this.deployments.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) { this.submitError = err.response?.data?.message || "Unable to delete."; }
        finally { this.submitting = false; }
      },
      async markDeployed(d) {
        try {
          const res = await API.post(`/operations/deployments/${d._id}/deploy`);
          const u = res.data?.deployment;
          const idx = this.deployments.findIndex((x) => x._id === u._id);
          if (idx >= 0) this.deployments.splice(idx, 1, u);
        } catch (err) { alert(err.response?.data?.message || "Failed."); }
      },
      async markReturned(d) {
        try {
          const res = await API.post(`/operations/deployments/${d._id}/return`);
          const u = res.data?.deployment;
          const idx = this.deployments.findIndex((x) => x._id === u._id);
          if (idx >= 0) this.deployments.splice(idx, 1, u);
        } catch (err) { alert(err.response?.data?.message || "Failed."); }
      },
    },
    mounted() { this.load(); this.loadMissions(); },
  };
</script>
