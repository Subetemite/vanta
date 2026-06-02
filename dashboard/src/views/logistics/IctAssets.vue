<template>
  <div class="min-h-screen bg-case-bg p-3 sm:p-5 space-y-5">

    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary">Assets Management</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">ICT Assets</h1>
        <p class="mt-1 text-xs text-gray-500">Information &amp; Communications Technology equipment, software licenses and network gear.</p>
      </div>
      <button @click="openCreate"
        class="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-black hover:bg-primary/90 transition-colors flex items-center gap-2">
        <Icon icon="mdi:plus" class="text-base" /> Add ICT Asset
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

    <!-- Stat strip -->
    <section class="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <div v-for="stat in stats" :key="stat.label"
        class="bg-case-surface border border-case-border rounded-xl p-4">
        <div class="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-gray-500">
          <Icon :icon="stat.icon" class="text-sm text-primary" />
          {{ stat.label }}
        </div>
        <p class="mt-2 text-xl font-semibold text-white tabular-nums">{{ stat.value }}</p>
      </div>
    </section>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative flex-1 max-w-md">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-base" />
        <input v-model="searchQuery" @input="onSearchInput" type="text" placeholder="Search by tag, serial, hostname, IP, assignee..."
          class="w-full rounded-md border border-case-border bg-case-surface pl-9 pr-3 py-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-primary focus:outline-none transition-colors" />
      </div>
      <select v-model="filterCategory" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Categories</option>
        <option v-for="c in CATEGORIES" :key="c" :value="c">{{ categoryLabel(c) }}</option>
      </select>
      <select v-model="filterStatus" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Status</option>
        <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
      </select>
      <select v-model="filterCondition" @change="load"
        class="rounded-md border border-case-border bg-case-surface px-3 py-2 text-xs text-gray-200 focus:border-primary focus:outline-none">
        <option value="">All Conditions</option>
        <option v-for="c in CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
      </select>
    </div>

    <!-- Table -->
    <section class="bg-case-surface border border-case-border rounded-xl">
      <div class="p-5">
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded bg-case-elevated"></div>
        </div>
        <div v-else-if="error" class="rounded-md border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">{{ error }}</div>
        <div v-else-if="items.length" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-case-border">
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium w-14">Photo</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Tag</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Asset</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Category</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Serial</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Assigned</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Location</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Condition</th>
                <th class="py-2.5 px-3 text-left text-[10px] uppercase tracking-[0.18em] text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item._id" @click="openEdit(item)"
                class="border-b border-case-border/40 hover:bg-case-card transition-colors cursor-pointer">
                <td class="py-2.5 px-3">
                  <div class="h-10 w-10 rounded-md border border-case-border bg-case-card overflow-hidden flex items-center justify-center">
                    <img v-if="item.photoUrl" :src="item.photoUrl" :alt="item.name"
                      class="h-full w-full object-cover" @click.stop="openPhoto(item.photoUrl)" />
                    <Icon v-else :icon="categoryIcon(item.category)" class="text-gray-700 text-lg" />
                  </div>
                </td>
                <td class="py-2.5 px-3 text-primary text-xs font-mono">{{ item.assetTag }}</td>
                <td class="py-2.5 px-3 text-gray-200 font-medium">
                  <div>{{ item.name }}</div>
                  <div class="text-[10px] text-gray-600">{{ [item.brand, item.model].filter(Boolean).join(" · ") || "—" }}</div>
                </td>
                <td class="py-2.5 px-3 text-gray-500 text-xs">{{ categoryLabel(item.category) }}</td>
                <td class="py-2.5 px-3 text-gray-500 text-xs font-mono">{{ item.serialNo || "—" }}</td>
                <td class="py-2.5 px-3 text-gray-300 text-xs">
                  <div>{{ item.assignedTo || "—" }}</div>
                  <div v-if="item.department" class="text-[10px] text-gray-600">{{ item.department }}</div>
                </td>
                <td class="py-2.5 px-3 text-gray-500 text-xs">{{ item.location || "—" }}</td>
                <td class="py-2.5 px-3">
                  <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="conditionBadge(item.condition)">
                    {{ item.condition }}
                  </span>
                </td>
                <td class="py-2.5 px-3">
                  <span class="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium" :class="statusBadge(item.status)">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="py-12 flex flex-col items-center justify-center text-center">
          <Icon icon="mdi:laptop" class="text-3xl text-gray-700 mb-2" />
          <p class="text-xs text-gray-500">No ICT assets {{ searchQuery || filterCategory || filterStatus || filterCondition ? "match your filters" : "registered yet" }}.</p>
          <button v-if="!searchQuery && !filterCategory && !filterStatus && !filterCondition" @click="openCreate" class="mt-3 text-xs text-primary hover:underline">Register the first asset</button>
        </div>
      </div>
    </section>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4" @click.self="closeModal">
        <div class="relative w-full max-w-4xl my-8 bg-case-surface border border-case-border rounded-xl shadow-2xl">
          <header class="flex items-center justify-between border-b border-case-border px-6 py-4">
            <div>
              <h2 class="text-lg font-semibold text-white">{{ editing?._id ? "Edit ICT Asset" : "New ICT Asset" }}</h2>
              <p v-if="editing?._id" class="text-[10px] text-gray-500 font-mono mt-0.5">{{ editing.assetTag }}</p>
            </div>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-200"><Icon icon="mdi:close" class="text-xl" /></button>
          </header>

          <div class="px-6 pt-4">
            <div class="flex flex-wrap gap-1 border-b border-case-border">
              <button v-for="t in tabs" :key="t.key" @click="activeTab = t.key" type="button"
                class="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors border-b-2 -mb-px"
                :class="activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-300'">
                <Icon :icon="t.icon" class="inline mr-1" /> {{ t.label }}
              </button>
            </div>
          </div>

          <div class="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- IDENTITY TAB -->
            <template v-if="activeTab === 'identity'">
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Equipment Photo</label>
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
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Asset Name <span class="text-primary">*</span></label>
                <input v-model.trim="form.name" type="text" placeholder="e.g. Patrol Office Laptop #4"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Asset Tag</label>
                <input v-model.trim="form.assetTag" type="text" placeholder="auto-generated if blank"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Category</label>
                <select v-model="form.category" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                  <option v-for="c in CATEGORIES" :key="c" :value="c">{{ categoryLabel(c) }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Brand / Manufacturer</label>
                <input v-model.trim="form.brand" type="text" placeholder="e.g. Dell, HP, Cisco"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Model</label>
                <input v-model.trim="form.model" type="text" placeholder="e.g. Latitude 5430"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Serial Number</label>
                <input v-model.trim="form.serialNo" type="text"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Status</label>
                <select v-model="form.status" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                  <option v-for="s in STATUSES" :key="s" :value="s">{{ statusLabel(s) }}</option>
                </select>
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Condition</label>
                <select v-model="form.condition" class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none">
                  <option v-for="c in CONDITIONS" :key="c" :value="c">{{ titleCase(c) }}</option>
                </select>
              </div>
            </template>

            <!-- TECHNICAL TAB -->
            <template v-if="activeTab === 'technical'">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Hostname</label>
                <input v-model.trim="form.hostname" type="text" placeholder="e.g. PAOCC-LT-04"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Operating System</label>
                <input v-model.trim="form.operatingSystem" type="text" placeholder="e.g. Windows 11 Pro"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">IP Address</label>
                <input v-model.trim="form.ipAddress" type="text" placeholder="e.g. 192.168.1.42"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">MAC Address</label>
                <input v-model.trim="form.macAddress" type="text" placeholder="AA:BB:CC:DD:EE:FF"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">CPU / Processor</label>
                <input v-model.trim="form.cpu" type="text" placeholder="e.g. Intel Core i7-12700H"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">RAM (GB)</label>
                <input v-model.number="form.ramGb" type="number" min="0"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Storage</label>
                <input v-model.trim="form.storage" type="text" placeholder="e.g. 512GB NVMe SSD"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>

              <div v-if="form.category === 'software'" class="sm:col-span-2 mt-2 pt-4 border-t border-case-border/60">
                <p class="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary mb-3">Software License Details</p>
              </div>
              <div v-if="form.category === 'software'" class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">License Key</label>
                <input v-model.trim="form.licenseKey" type="text"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div v-if="form.category === 'software'">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">License Seats</label>
                <input v-model.number="form.licenseSeats" type="number" min="0"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div v-if="form.category === 'software'">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">License Expiry</label>
                <input v-model="form.licenseExpiry" type="date"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
            </template>

            <!-- ASSIGNMENT TAB -->
            <template v-if="activeTab === 'assignment'">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Assigned To</label>
                <input v-model.trim="form.assignedTo" type="text" placeholder="Full name of custodian"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Department / Unit</label>
                <input v-model.trim="form.department" type="text" placeholder="e.g. ICT Division"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Location</label>
                <input v-model.trim="form.location" type="text" placeholder="e.g. HQ · 3F · Room 305"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Deployment Date</label>
                <input v-model="form.deployedAt" type="date"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
            </template>

            <!-- ACQUISITION TAB -->
            <template v-if="activeTab === 'acquisition'">
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Supplier / Vendor</label>
                <input v-model.trim="form.supplierName" type="text"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">PO / Reference No.</label>
                <input v-model.trim="form.poNumber" type="text"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 font-mono focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Purchase Date</label>
                <input v-model="form.purchaseDate" type="date"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Purchase Cost (PHP)</label>
                <input v-model.number="form.purchaseCost" type="number" min="0" step="0.01"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Warranty Expiry</label>
                <input v-model="form.warrantyExpiry" type="date"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none" />
                <p v-if="warrantyState" class="mt-1 text-[10px] uppercase tracking-wide" :class="warrantyState.color">{{ warrantyState.label }}</p>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 mb-2">Notes</label>
                <textarea v-model="form.notes" rows="4"
                  class="w-full rounded-md border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 focus:border-primary focus:outline-none resize-y"></textarea>
              </div>
            </template>

            <div v-if="submitError" class="sm:col-span-2 rounded-md border border-red-900/50 bg-red-950/30 p-3 text-xs text-red-400">{{ submitError }}</div>
          </div>

          <footer class="flex items-center justify-between gap-2 border-t border-case-border px-6 py-4">
            <button v-if="editing?._id" type="button" @click="confirmDelete"
              class="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition-colors flex items-center gap-2">
              <Icon icon="mdi:trash-can-outline" /> Delete
            </button><span v-else></span>
            <div class="flex gap-2">
              <button @click="closeModal" class="rounded-md border border-case-border bg-case-surface px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-case-elevated transition-colors">Cancel</button>
              <button @click="submit" :disabled="!form.name?.trim() || submitting"
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

  const CATEGORIES = [
    "desktop", "laptop", "server", "monitor", "printer", "scanner",
    "network", "storage", "mobile", "tablet", "peripheral",
    "software", "communication", "other",
  ];
  const STATUSES = ["in-use", "in-storage", "deployed", "for-repair", "for-disposal", "retired", "lost"];
  const CONDITIONS = ["new", "good", "fair", "poor", "damaged"];
  const SCOPES = [
    { key: "office", label: "Office Inventory", icon: "mdi:office-building-outline" },
    { key: "case", label: "Case Inventory", icon: "mdi:shield-search" },
  ];

  const CATEGORY_LABELS = {
    desktop: "Desktop", laptop: "Laptop", server: "Server",
    monitor: "Monitor / Display", printer: "Printer", scanner: "Scanner",
    network: "Network Device", storage: "Storage Device",
    mobile: "Mobile Phone", tablet: "Tablet", peripheral: "Peripheral",
    software: "Software / License", communication: "Comms Equipment",
    other: "Other",
  };

  const STATUS_LABELS = {
    "in-use": "In Use", "in-storage": "In Storage", "deployed": "Deployed",
    "for-repair": "For Repair", "for-disposal": "For Disposal",
    "retired": "Retired", "lost": "Lost / Missing",
  };

  const CATEGORY_ICONS = {
    desktop: "mdi:desktop-tower-monitor",
    laptop: "mdi:laptop",
    server: "mdi:server",
    monitor: "mdi:monitor",
    printer: "mdi:printer",
    scanner: "mdi:scanner",
    network: "mdi:router-network",
    storage: "mdi:harddisk",
    mobile: "mdi:cellphone",
    tablet: "mdi:tablet",
    peripheral: "mdi:keyboard-outline",
    software: "mdi:license",
    communication: "mdi:radio-handheld",
    other: "mdi:devices",
  };

  function emptyForm(scope = "office") {
    return {
      name: "", assetTag: "", scope, category: "laptop",
      brand: "", model: "", serialNo: "",
      hostname: "", operatingSystem: "", ipAddress: "", macAddress: "",
      cpu: "", ramGb: 0, storage: "",
      licenseKey: "", licenseSeats: 0, licenseExpiry: "",
      status: "in-storage", condition: "good",
      assignedTo: "", department: "", location: "", deployedAt: "",
      supplierName: "", poNumber: "", purchaseDate: "", purchaseCost: 0, warrantyExpiry: "",
      notes: "",
    };
  }

  function toDateInput(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  export default {
    name: "IctAssets",
    components: { Icon },
    data() {
      return {
        CATEGORIES, STATUSES, CONDITIONS, SCOPES,
        items: [], loading: false, error: "",
        searchQuery: "", searchDebounce: null,
        filterScope: "office", filterCategory: "", filterStatus: "", filterCondition: "",
        showModal: false, editing: null, form: emptyForm(),
        submitting: false, submitError: "",
        photoPreview: "", photoBase64: "", photoFileName: "", photoCleared: false, photoError: "",
        activeTab: "identity",
        tabs: [
          { key: "identity", label: "Identity", icon: "mdi:identifier" },
          { key: "technical", label: "Technical", icon: "mdi:chip" },
          { key: "assignment", label: "Assignment", icon: "mdi:account-arrow-right-outline" },
          { key: "acquisition", label: "Acquisition", icon: "mdi:cart-outline" },
        ],
      };
    },
    computed: {
      stats() {
        const inUse = this.items.filter((x) => x.status === "in-use" || x.status === "deployed").length;
        const repair = this.items.filter((x) => x.status === "for-repair").length;
        const storage = this.items.filter((x) => x.status === "in-storage").length;
        const expiringWarranty = this.items.filter((x) => {
          if (!x.warrantyExpiry) return false;
          const t = new Date(x.warrantyExpiry).getTime();
          const now = Date.now();
          const in60 = now + 60 * 24 * 60 * 60 * 1000;
          return t >= now && t <= in60;
        }).length;
        return [
          { label: "Total Assets", value: this.items.length, icon: "mdi:devices" },
          { label: "Active / Deployed", value: inUse, icon: "mdi:check-decagram-outline" },
          { label: "In Storage", value: storage, icon: "mdi:archive-outline" },
          { label: "For Repair", value: repair, icon: "mdi:wrench-outline" },
          { label: "Warranty <60d", value: expiringWarranty, icon: "mdi:shield-alert-outline" },
        ];
      },
      warrantyState() {
        if (!this.form.warrantyExpiry) return null;
        const t = new Date(this.form.warrantyExpiry).getTime();
        if (Number.isNaN(t)) return null;
        const now = Date.now();
        if (t < now) return { label: "Warranty expired", color: "text-red-400" };
        const days = Math.ceil((t - now) / (24 * 60 * 60 * 1000));
        if (days <= 60) return { label: `Warranty expires in ${days} day${days === 1 ? "" : "s"}`, color: "text-amber-400" };
        return { label: `Warranty active · ${days} days remaining`, color: "text-emerald-400" };
      },
    },
    methods: {
      categoryLabel(c) { return CATEGORY_LABELS[c] || this.titleCase(c); },
      categoryIcon(c) { return CATEGORY_ICONS[c] || "mdi:devices"; },
      statusLabel(s) { return STATUS_LABELS[s] || this.titleCase(s); },
      titleCase(s) { return String(s || "").replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()); },
      statusBadge(status) {
        const map = {
          "in-use": "bg-emerald-950/40 text-emerald-400",
          "deployed": "bg-emerald-950/40 text-emerald-400",
          "in-storage": "bg-sky-950/40 text-sky-400",
          "for-repair": "bg-amber-950/40 text-amber-400",
          "for-disposal": "bg-orange-950/40 text-orange-400",
          "retired": "bg-case-elevated text-gray-500",
          "lost": "bg-red-950/40 text-red-400",
        };
        return map[status] || "bg-case-elevated text-gray-400";
      },
      conditionBadge(condition) {
        const map = {
          "new": "bg-emerald-950/40 text-emerald-400",
          "good": "bg-sky-950/40 text-sky-400",
          "fair": "bg-amber-950/40 text-amber-400",
          "poor": "bg-orange-950/40 text-orange-400",
          "damaged": "bg-red-950/40 text-red-400",
        };
        return map[condition] || "bg-case-elevated text-gray-400";
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
          if (this.filterCategory) params.set("category", this.filterCategory);
          if (this.filterStatus) params.set("status", this.filterStatus);
          if (this.filterCondition) params.set("condition", this.filterCondition);
          const res = await API.get(`/logistics/ict?${params}`);
          this.items = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.error = err.response?.data?.message || "Unable to load ICT assets.";
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
        this.activeTab = "identity";
        this.submitError = "";
        this.resetPhotoState();
        this.showModal = true;
      },
      openEdit(item) {
        this.editing = item;
        this.form = {
          ...emptyForm(),
          ...item,
          purchaseDate: toDateInput(item.purchaseDate),
          warrantyExpiry: toDateInput(item.warrantyExpiry),
          deployedAt: toDateInput(item.deployedAt),
          licenseExpiry: toDateInput(item.licenseExpiry),
        };
        this.activeTab = "identity";
        this.submitError = "";
        this.resetPhotoState();
        if (item.photoUrl) this.photoPreview = item.photoUrl;
        this.showModal = true;
      },
      closeModal() {
        if (this.submitting) return;
        this.showModal = false;
        this.editing = null;
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
      buildPayload() {
        const payload = { ...this.form };
        ["purchaseDate", "warrantyExpiry", "deployedAt", "licenseExpiry"].forEach((k) => {
          if (!payload[k]) payload[k] = null;
        });
        delete payload.photoUrl;
        delete payload.photoStoredName;
        if (this.photoBase64) {
          payload.photoBase64 = this.photoBase64;
          payload.photoFileName = this.photoFileName;
        } else if (this.photoCleared) {
          payload.clearPhoto = true;
        }
        return payload;
      },
      async submit() {
        if (!this.form.name?.trim() || this.submitting) return;
        this.submitting = true;
        this.submitError = "";
        try {
          const payload = this.buildPayload();
          let res;
          if (this.editing?._id) {
            res = await API.put(`/logistics/ict/${this.editing._id}`, payload);
          } else {
            res = await API.post("/logistics/ict", payload);
          }
          const item = res.data?.item;
          if (item) {
            const idx = this.items.findIndex((x) => x._id === item._id);
            if (idx >= 0) this.items.splice(idx, 1, item);
            else this.items.unshift(item);
          }
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to save ICT asset.";
        } finally {
          this.submitting = false;
        }
      },
      async confirmDelete() {
        if (!this.editing?._id) return;
        if (!window.confirm(`Delete ${this.editing.name}? This cannot be undone.`)) return;
        this.submitting = true;
        try {
          await API.delete(`/logistics/ict/${this.editing._id}`);
          this.items = this.items.filter((x) => x._id !== this.editing._id);
          this.closeModal();
        } catch (err) {
          this.submitError = err.response?.data?.message || "Unable to delete ICT asset.";
        } finally {
          this.submitting = false;
        }
      },
    },
    mounted() { this.load(); },
  };
</script>
