<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Fleet &amp; Vehicles</h1>
      </div>
      <button @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Add Vehicle
      </button>
    </header>

    <!-- Scope tabs -->
    <div class="inline-flex rounded-lg border border-case-border bg-case-surface p-1 gap-1">
      <button v-for="s in SCOPES" :key="s.key" @click="setScope(s.key)" type="button"
        class="px-4 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex items-center gap-2"
        :class="filterScope === s.key ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-200'">
        <Icon :icon="s.icon" />{{ s.label }}
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by plate, engine, chassis, owner, make..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none" />
      </div>
      <select v-model="filterStatus" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="filterType" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Types</option>
        <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <section v-if="loading" class="space-y-2">
      <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded bg-case-elevated"></div>
    </section>
    <section v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</section>
    <section v-else-if="vehicles.length" class="rounded-xl border border-case-border bg-case-surface overflow-hidden">
      <div class="px-4 py-2.5 border-b border-case-border bg-case-card">
        <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-300 text-center">Vehicle Description</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-[11px] text-gray-300 border-collapse">
          <thead class="bg-case-card text-gray-400">
            <tr>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border w-12">No.</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border w-16">Photo</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Make/Type</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Year Model</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Color</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Plate/CS No.</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Engine No.</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Chassis No.</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Registered Owner</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Address</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border">Remarks</th>
              <th class="px-3 py-2 text-left font-semibold uppercase tracking-wide border-b border-case-border w-20">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, idx) in vehicles" :key="v._id" @click="openEdit(v)"
              class="cursor-pointer hover:bg-case-elevated transition-colors border-b border-case-border last:border-b-0">
              <td class="px-3 py-2 align-top tabular-nums text-gray-500">{{ idx + 1 }}</td>
              <td class="px-3 py-2 align-middle">
                <div class="h-10 w-14 rounded border border-case-border bg-case-card overflow-hidden flex items-center justify-center">
                  <img v-if="v.photoUrl" :src="v.photoUrl" :alt="v.plateNo" class="h-full w-full object-cover" @click.stop="openPhoto(v.photoUrl)" />
                  <Icon v-else icon="mdi:image-off-outline" class="text-gray-700 text-base" />
                </div>
              </td>
              <td class="px-3 py-2 align-top">
                <p class="text-gray-100 font-medium">{{ [v.make, v.model].filter(Boolean).join(" ") || "—" }}</p>
                <p class="text-[10px] text-gray-500 mt-0.5 capitalize">{{ v.type }}</p>
              </td>
              <td class="px-3 py-2 align-top tabular-nums">{{ v.year || "—" }}</td>
              <td class="px-3 py-2 align-top">{{ v.color || "—" }}</td>
              <td class="px-3 py-2 align-top font-mono text-gray-100">{{ v.plateNo || "—" }}</td>
              <td class="px-3 py-2 align-top font-mono text-gray-300">{{ v.engineNo || "—" }}</td>
              <td class="px-3 py-2 align-top font-mono text-gray-300">{{ v.chassisNo || "—" }}</td>
              <td class="px-3 py-2 align-top">{{ v.registeredOwner || "—" }}</td>
              <td class="px-3 py-2 align-top text-gray-400 max-w-xs">{{ v.ownerAddress || "—" }}</td>
              <td class="px-3 py-2 align-top text-gray-400 max-w-xs">{{ v.notes || "—" }}</td>
              <td class="px-3 py-2 align-top">
                <span class="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wide font-medium" :class="statusBadge(v.status)">
                  {{ v.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section v-else class="bg-case-surface border border-case-border rounded-xl py-16 flex flex-col items-center justify-center">
      <Icon icon="mdi:truck-fast-outline" class="text-3xl text-gray-700 mb-2" />
      <p class="text-xs text-gray-500">No vehicles {{ searchQuery ? "match your search" : "in fleet yet" }}.</p>
      <button v-if="!searchQuery" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Add the first vehicle</button>
    </section>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-2xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit Vehicle" : "Add Vehicle" }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>
          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Vehicle Photo</label>
              <div class="flex items-start gap-4">
                <div class="h-28 w-40 flex-shrink-0 rounded-md border border-dashed border-case-border bg-case-card overflow-hidden flex items-center justify-center">
                  <img v-if="photoPreview" :src="photoPreview" alt="Preview" class="h-full w-full object-cover" />
                  <div v-else class="text-center text-gray-600 px-2">
                    <Icon icon="mdi:image-plus-outline" class="text-2xl" />
                    <p class="text-[10px] mt-1">No photo</p>
                  </div>
                </div>
                <div class="flex-1 flex flex-col gap-2">
                  <input ref="photoInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" @change="onPhotoSelected" />
                  <button type="button" @click="$refs.photoInput.click()"
                    class="rounded-md border border-case-border bg-case-card px-3 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors flex items-center gap-2 w-fit">
                    <Icon icon="mdi:upload" /> {{ photoPreview ? "Replace photo" : "Upload photo" }}
                  </button>
                  <button v-if="photoPreview" type="button" @click="clearPhoto"
                    class="text-[11px] text-red-400 hover:underline w-fit">Remove photo</button>
                  <p class="text-[10px] text-gray-600">JPG, PNG, WEBP, or GIF • max 5 MB.</p>
                  <p v-if="photoError" class="text-[10px] text-red-400">{{ photoError }}</p>
                </div>
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Inventory Type</label>
              <div class="inline-flex rounded-lg border border-case-border bg-case-card p-1 gap-1">
                <button v-for="s in SCOPES" :key="s.key" @click="form.scope = s.key" type="button"
                  class="px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors flex items-center gap-2"
                  :class="form.scope === s.key ? 'bg-primary text-black' : 'text-gray-400 hover:text-gray-200'">
                  <Icon :icon="s.icon" />{{ s.label }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Plate/CS No. <span class="text-primary">*</span></label>
              <input v-model.trim="form.plateNo" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Type</label>
              <select v-model="form.type" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Engine No.</label>
              <input v-model.trim="form.engineNo" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none font-mono" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Chassis No.</label>
              <input v-model.trim="form.chassisNo" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none font-mono" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Make</label>
              <input v-model.trim="form.make" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Model</label>
              <input v-model.trim="form.model" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Year Model</label>
              <input v-model.number="form.year" type="number" min="1900" max="2100" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Color</label>
              <input v-model.trim="form.color" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Name of Registered Owner</label>
              <input v-model.trim="form.registeredOwner" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Address</label>
              <input v-model.trim="form.ownerAddress" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
              <select v-model="form.status" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Mileage (km)</label>
              <input v-model.number="form.mileage" type="number" min="0" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Assigned Unit</label>
              <input v-model.trim="form.assignedUnit" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Current Driver</label>
              <input v-model.trim="form.currentDriver" type="text" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Registration Expiry</label>
              <input v-model="form.registrationExpiry" type="date" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Insurance Expiry</label>
              <input v-model="form.insuranceExpiry" type="date" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Remarks</label>
              <textarea v-model="form.notes" rows="3" placeholder="e.g. 2-flat tires" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
            </div>
            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>
          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" type="button" @click="confirmDelete"
              class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">Cancel</button>
              <button @click="submit" :disabled="!form.plateNo?.trim() || submitting"
                class="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
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

  const TYPES = ["patrol", "transport", "motorcycle", "utility", "armored", "other"];
  const STATUSES = ["available", "dispatched", "maintenance", "retired"];
  const SCOPES = [
    { key: "office", label: "Office Inventory", icon: "mdi:office-building-outline" },
    { key: "case", label: "Case Inventory", icon: "mdi:shield-search" },
  ];

  function emptyForm(scope = "office") {
    return {
      plateNo: "", scope, engineNo: "", chassisNo: "",
      type: "patrol", make: "", model: "", year: null, color: "",
      registeredOwner: "", ownerAddress: "",
      status: "available", mileage: 0, assignedUnit: "", currentDriver: "",
      registrationExpiry: "", insuranceExpiry: "", notes: "",
    };
  }

  function dateForInput(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }

  export default {
    name: "Vehicles",
    components: { Icon },
    data() {
      return {
        TYPES, STATUSES, SCOPES,
        vehicles: [], loading: false, error: "",
        searchQuery: "", searchDebounce: null,
        filterScope: "office", filterStatus: "", filterType: "",
        showModal: false, editing: null, form: emptyForm(), submitting: false, submitError: "",
        photoPreview: "", photoBase64: "", photoFileName: "", photoCleared: false, photoError: "",
      };
    },
    methods: {
      statusBadge(status) {
        const map = {
          available: "bg-emerald-950/40 text-emerald-400",
          dispatched: "bg-cyan-950/40 text-cyan-400",
          maintenance: "bg-amber-950/40 text-amber-400",
          retired: "bg-case-elevated text-gray-500",
        };
        return map[status] || "bg-case-elevated text-gray-400";
      },
      onSearchInput() {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => this.load(), 300);
      },
      async load() {
        this.loading = true; this.error = "";
        try {
          const params = new URLSearchParams();
          params.set("scope", this.filterScope);
          if (this.searchQuery.trim()) params.set("q", this.searchQuery.trim());
          if (this.filterStatus) params.set("status", this.filterStatus);
          if (this.filterType) params.set("type", this.filterType);
          const res = await API.get(`/logistics/vehicles?${params}`);
          this.vehicles = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load vehicles.";
        } finally {
          this.loading = false;
        }
      },
      setScope(scope) {
        if (this.filterScope === scope) return;
        this.filterScope = scope;
        this.load();
      },
      resetPhotoState() {
        this.photoPreview = "";
        this.photoBase64 = "";
        this.photoFileName = "";
        this.photoCleared = false;
        this.photoError = "";
        if (this.$refs.photoInput) this.$refs.photoInput.value = "";
      },
      openCreate() {
        this.editing = null;
        this.form = emptyForm(this.filterScope);
        this.submitError = "";
        this.resetPhotoState();
        this.showModal = true;
      },
      openEdit(vehicle) {
        this.editing = vehicle;
        this.form = {
          ...emptyForm(),
          ...vehicle,
          registrationExpiry: dateForInput(vehicle.registrationExpiry),
          insuranceExpiry: dateForInput(vehicle.insuranceExpiry),
        };
        this.submitError = "";
        this.resetPhotoState();
        if (vehicle.photoUrl) this.photoPreview = vehicle.photoUrl;
        this.showModal = true;
      },
      closeModal() {
        if (this.submitting) return;
        this.showModal = false;
        this.editing = null;
        this.resetPhotoState();
      },
      onPhotoSelected(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          this.photoError = "Please choose an image file."; return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.photoError = "Photo must be 5 MB or smaller."; return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.photoPreview = reader.result;
          this.photoBase64 = String(reader.result).replace(/^data:[^;]+;base64,/i, "");
          this.photoFileName = file.name;
          this.photoCleared = false;
          this.photoError = "";
        };
        reader.onerror = () => { this.photoError = "Unable to read the selected file."; };
        reader.readAsDataURL(file);
      },
      clearPhoto() {
        this.photoPreview = "";
        this.photoBase64 = "";
        this.photoFileName = "";
        this.photoCleared = true;
        this.photoError = "";
        if (this.$refs.photoInput) this.$refs.photoInput.value = "";
      },
      openPhoto(url) {
        if (url) window.open(url, "_blank", "noopener");
      },
      async submit() {
        if (!this.form.plateNo?.trim() || this.submitting) return;
        this.submitting = true; this.submitError = "";
        try {
          const payload = { ...this.form };
          payload.registrationExpiry = payload.registrationExpiry || null;
          payload.insuranceExpiry = payload.insuranceExpiry || null;
          if (this.photoBase64) {
            payload.photoBase64 = this.photoBase64;
            payload.photoFileName = this.photoFileName;
          } else if (this.photoCleared) {
            payload.clearPhoto = true;
          }
          let res;
          if (this.editing?._id) {
            res = await API.put(`/logistics/vehicles/${this.editing._id}`, payload);
          } else {
            res = await API.post("/logistics/vehicles", payload);
          }
          const v = res.data?.vehicle;
          const idx = this.vehicles.findIndex((x) => x._id === v._id);
          if (idx >= 0) this.vehicles.splice(idx, 1, v); else this.vehicles.unshift(v);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save vehicle.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.editing?._id) return;
        if (!window.confirm(`Delete vehicle ${this.editing.plateNo}?`)) return;
        this.submitting = true;
        try {
          await API.delete(`/logistics/vehicles/${this.editing._id}`);
          this.vehicles = this.vehicles.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete vehicle.";
        } finally {
          this.submitting = false;
        }
      },
      async quickDispatch(v) {
        const driver = window.prompt("Driver name:", "");
        if (driver === null) return;
        const unit = window.prompt("Assigned unit:", "");
        if (unit === null) return;
        try {
          const res = await API.post(`/logistics/vehicles/${v._id}/dispatch`, { driver, unit });
          const updated = res.data?.vehicle;
          const idx = this.vehicles.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.vehicles.splice(idx, 1, updated);
        } catch (err) {
          alert(err.response?.data?.message || "Unable to dispatch.");
        }
      },
      async quickReturn(v) {
        const mileageStr = window.prompt("Updated mileage (km):", String(v.mileage || 0));
        if (mileageStr === null) return;
        try {
          const res = await API.post(`/logistics/vehicles/${v._id}/return`, { mileage: Number(mileageStr) || 0 });
          const updated = res.data?.vehicle;
          const idx = this.vehicles.findIndex((x) => x._id === updated._id);
          if (idx >= 0) this.vehicles.splice(idx, 1, updated);
        } catch (err) {
          alert(err.response?.data?.message || "Unable to return vehicle.");
        }
      },
    },
    mounted() { this.load(); },
  };
</script>
