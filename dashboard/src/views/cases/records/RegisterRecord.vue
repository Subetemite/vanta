<template>
  <div class="flex flex-col h-screen bg-case-bg overflow-hidden">

    <!-- Top bar -->
    <div class="flex-shrink-0 px-3 sm:px-5 pt-3 sm:pt-5 space-y-3">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Case / Personnel</p>
          <h1 class="mt-1 text-xl font-semibold text-white">Personnel Records</h1>
        </div>
        <button
          v-if="canEdit"
          @click="openNewForm"
          class="flex items-center gap-2 rounded-xl bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-black transition hover:bg-amber-500"
        >
          <Icon icon="ic:outline-add" class="text-base" />
          Add Record
        </button>
      </div>

      <!-- Search + count -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[160px] max-w-sm">
          <Icon icon="ei:search" class="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-600 pointer-events-none" />
          <input
            v-model.trim="peopleSearch"
            type="text"
            placeholder="Search by name, alias, nationality, or country…"
            class="w-full rounded-xl border border-case-border bg-case-card pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <p class="text-xs text-gray-600">{{ filteredPeople.length }} record{{ filteredPeople.length !== 1 ? "s" : "" }}</p>
      </div>

      <!-- Bulk delete bar -->
      <div
        v-if="selectedIds.length && canDelete"
        class="flex items-center justify-between gap-3 rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2.5"
      >
        <span class="text-sm text-red-400 font-medium">{{ selectedIds.length }} record{{ selectedIds.length !== 1 ? "s" : "" }} selected</span>
        <div class="flex items-center gap-2">
          <button
            @click="selectedIds = []"
            class="text-xs text-gray-500 hover:text-gray-300 transition"
          >Clear</button>
          <button
            @click="deleteBulk"
            :disabled="isDeletingBulk"
            class="flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            <Icon icon="ic:outline-delete" class="text-sm" />
            {{ isDeletingBulk ? "Deleting…" : `Delete ${selectedIds.length}` }}
          </button>
        </div>
      </div>

      <!-- Page-level message (shown after modal closes) -->
      <div
        v-if="message.text && !showForm && !detailPerson"
        :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
        class="rounded-xl border px-4 py-3 text-sm"
      >
        {{ message.text }}
      </div>

      <!-- Error -->
      <div v-if="peopleError" class="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
        {{ peopleError }}
      </div>
    </div>

    <!-- Table (fills remaining height) -->
    <div class="flex-1 min-h-0 px-3 sm:px-5 pb-3 sm:pb-5 pt-3 flex flex-col">
      <div class="flex-1 min-h-0 rounded-xl border border-case-border bg-case-surface overflow-hidden flex flex-col">
        <div v-if="isLoadingPeople" class="space-y-2 p-4">
          <div v-for="i in 6" :key="i" class="h-10 animate-pulse rounded-lg bg-case-elevated"></div>
        </div>
        <div v-else-if="!filteredPeople.length" class="py-14 text-center text-sm text-gray-600">
          No personnel records found.
        </div>
        <div v-else class="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-case-card">
            <tr class="text-left text-[10px] uppercase tracking-[0.18em] text-gray-600">
              <th v-if="canDelete" class="pl-4 pr-2 py-3 w-8" @click.stop>
                <input
                  type="checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected"
                  @change="toggleSelectAll"
                  class="h-3.5 w-3.5 rounded border-case-border accent-primary cursor-pointer"
                />
              </th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Name</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Alias</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Birthday</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Nationality</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Country</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Operation Name</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Operation Address</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Operation Date</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Disposition</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Visa Status</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Remarks</th>
              <th class="px-4 py-3 font-medium whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-case-border/50">
            <tr
              v-for="person in filteredPeople"
              :key="person._id"
              class="hover:bg-case-card transition-colors cursor-pointer"
              :class="{ 'bg-red-950/10 border-l-2 border-red-700/50': selectedIds.includes(person._id) }"
              @click="openDetail(person)"
            >
              <td v-if="canDelete" class="pl-4 pr-2 py-3 w-8" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(person._id)"
                  @change="toggleSelect(person._id)"
                  class="h-3.5 w-3.5 rounded border-case-border accent-primary cursor-pointer"
                />
              </td>
              <td class="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">
                <div class="flex items-center gap-2.5">
                  <img
                    v-if="person.profilePhoto?.dataUrl"
                    :src="person.profilePhoto.dataUrl"
                    class="h-7 w-7 rounded-full object-cover ring-1 ring-case-border flex-shrink-0 cursor-zoom-in hover:ring-primary transition"
                    @click.stop="lightboxSrc = person.profilePhoto.dataUrl"
                  />
                  <div
                    v-else
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-case-elevated text-[10px] font-bold uppercase text-gray-500 flex-shrink-0"
                  >
                    {{ getPersonInitials(person) }}
                  </div>
                  {{ formatPersonName(person) || "—" }}
                </div>
              </td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{{ person.personalInformation?.alias || "—" }}</td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{{ formatShortDate(person.personalInformation?.birthDate) }}</td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{{ person.personalInformation?.nationality || "—" }}</td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{{ person.personalInformation?.country || "—" }}</td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap">{{ person.operationDetails?.operationName || "—" }}</td>
              <td class="px-4 py-3 text-gray-500 max-w-[180px]">
                <span class="truncate block text-xs">{{ person.operationDetails?.operationAddress || "—" }}</span>
              </td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{{ formatShortDate(person.operationDetails?.operationDate) }}</td>
              <td class="px-4 py-3 whitespace-nowrap">
                <span v-if="person.operationDetails?.disposition" class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary">
                  {{ person.operationDetails.disposition }}
                </span>
                <span v-else class="text-gray-600 text-xs">—</span>
              </td>
              <td class="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{{ person.operationDetails?.visaStatus || "—" }}</td>
              <td class="px-4 py-3 text-gray-500 max-w-[150px]">
                <span class="truncate block text-xs">{{ person.operationDetails?.remarks || "—" }}</span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap" @click.stop>
                <div class="flex gap-1.5">
                  <button
                    @click="openDetail(person)"
                    class="rounded-lg border border-case-border px-2.5 py-1 text-xs text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
                  >
                    View
                  </button>
                  <button
                    v-if="canEdit"
                    @click="openEditForm(person)"
                    class="rounded-lg border border-case-border px-2.5 py-1 text-xs text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    v-if="canDelete"
                    @click="deleteRecord(person)"
                    class="rounded-lg border border-red-900/40 px-2.5 py-1 text-xs text-red-500 transition hover:bg-red-950/30 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <!-- ── Detail modal ──────────────────────────────────────────────── -->
    <div
      v-if="detailPerson"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-2 sm:px-4 pt-4 sm:pt-10 pb-6 backdrop-blur-sm"
      @click.self="detailPerson = null"
    >
      <div class="w-full max-w-2xl flex flex-col rounded-2xl border border-case-border bg-case-surface shadow-2xl shadow-black/60">
        <!-- Modal header -->
        <div class="flex items-center gap-4 border-b border-case-border p-5 flex-shrink-0">
          <img
            v-if="detailPerson.profilePhoto?.dataUrl"
            :src="detailPerson.profilePhoto.dataUrl"
            class="h-12 w-12 rounded-xl object-cover ring-1 ring-case-border"
          />
          <div v-else class="flex h-12 w-12 items-center justify-center rounded-xl bg-case-elevated text-sm font-bold uppercase text-gray-500">
            {{ getPersonInitials(detailPerson) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Personnel Record</p>
            <h3 class="mt-0.5 text-lg font-semibold text-white truncate">{{ formatPersonName(detailPerson) || "Unknown" }}</h3>
          </div>
          <button @click="detailPerson = null" class="text-gray-500 hover:text-gray-300 text-2xl leading-none flex-shrink-0">&times;</button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-case-border flex-shrink-0">
          <button
            @click="detailTab = 'details'"
            :class="detailTab === 'details' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-300'"
            class="px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition"
          >Details</button>
          <button
            @click="detailTab = 'history'; loadHistory(detailPerson._id)"
            :class="detailTab === 'history' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-300'"
            class="px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition"
          >Change History</button>
        </div>

        <!-- Modal body -->
        <div class="overflow-y-auto flex-1">

          <!-- History tab -->
          <div v-if="detailTab === 'history'" class="p-5 space-y-3">
            <div v-if="historyLoading" class="space-y-2">
              <div v-for="i in 4" :key="i" class="h-12 animate-pulse rounded-xl bg-case-elevated"></div>
            </div>
            <div v-else-if="!historyEntries.length" class="py-10 text-center text-sm text-gray-600">
              No change history found for this record.
            </div>
            <div v-else class="relative pl-4">
              <div class="absolute left-1.5 top-0 bottom-0 w-px bg-case-border"></div>
              <div v-for="entry in historyEntries" :key="entry._id || entry.timestamp" class="relative mb-4 pl-5">
                <div class="absolute -left-[3px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-case-bg"></div>
                <p class="text-xs text-gray-600">{{ formatHistoryDate(entry.timestamp || entry.createdAt) }}</p>
                <p class="mt-0.5 text-sm font-medium text-gray-200 capitalize">{{ entry.action || entry.event || "Record updated" }}</p>
                <p v-if="entry.changedBy || entry.user" class="mt-0.5 text-xs text-gray-500">
                  by {{ entry.changedBy || entry.user?.username || "unknown" }}
                </p>
                <div v-if="entry.changes && Object.keys(entry.changes).length" class="mt-2 rounded-lg border border-case-border bg-case-card px-3 py-2 text-xs text-gray-500 space-y-1">
                  <p v-for="(val, field) in entry.changes" :key="field">
                    <span class="text-gray-400">{{ field }}:</span>
                    <span class="ml-1 line-through text-red-500/60">{{ val.from ?? "—" }}</span>
                    <span class="ml-1 text-emerald-400/80">{{ val.to ?? "—" }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Details tab -->
          <div v-else>

            <!-- ── Personal Information ───────────────────────── -->
            <div class="p-5 border-b border-case-border/60">
              <div class="flex items-center gap-2 mb-4">
                <span class="h-3.5 w-1 rounded-full bg-primary flex-shrink-0"></span>
                <h4 class="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Personal Information</h4>
              </div>

              <div class="flex gap-4 items-start">
                <!-- Photo -->
                <div v-if="detailPerson.profilePhoto?.dataUrl" class="flex-shrink-0 w-28 sm:w-36">
                  <img
                    :src="detailPerson.profilePhoto.dataUrl"
                    class="w-full rounded-xl object-contain bg-case-card ring-1 ring-case-border/60 cursor-zoom-in hover:ring-primary transition"
                    @click="lightboxSrc = detailPerson.profilePhoto.dataUrl"
                  />
                </div>
                <div v-else class="flex-shrink-0 flex h-28 w-28 items-center justify-center rounded-xl bg-case-elevated text-2xl font-bold uppercase text-gray-600 ring-1 ring-case-border/60">
                  {{ getPersonInitials(detailPerson) }}
                </div>

                <!-- Fields -->
                <div class="flex-1 min-w-0 space-y-2">
                  <!-- Name row -->
                  <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                    <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Name</p>
                    <p class="mt-0.5 text-sm font-semibold text-white">{{ detailPerson.personalInformation?.name || "—" }}</p>
                  </div>
                  <!-- 2-col rows -->
                  <div class="grid grid-cols-2 gap-2">
                    <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                      <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Birth Date</p>
                      <p class="mt-0.5 text-xs text-gray-200">{{ formatLongDate(detailPerson.personalInformation?.birthDate) }}</p>
                    </div>
                    <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                      <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Sex</p>
                      <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.sex || "—" }}</p>
                    </div>
                    <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                      <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Alias</p>
                      <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.alias || "—" }}</p>
                    </div>
                    <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                      <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Civil Status</p>
                      <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.civilStatus || "—" }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Bottom fields -->
              <div class="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Nationality</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.nationality || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Country</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.country || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Contact</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.contactNumber || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 col-span-2 sm:col-span-1">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Email</p>
                  <p class="mt-0.5 text-xs text-gray-200 break-all">{{ detailPerson.personalInformation?.emailAddress || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 col-span-2">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Address</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.personalInformation?.address || "—" }}</p>
                </div>
              </div>
            </div>

            <!-- ── Operation Details ──────────────────────────── -->
            <div class="p-5 border-b border-case-border/60">
              <div class="flex items-center gap-2 mb-4">
                <span class="h-3.5 w-1 rounded-full bg-primary flex-shrink-0"></span>
                <h4 class="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Operation Details</h4>
              </div>

              <!-- Highlight bar: name + date + disposition -->
              <div class="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
                <div class="flex-1 min-w-0">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-primary/60">Operation</p>
                  <p class="mt-0.5 text-sm font-semibold text-white truncate">{{ detailPerson.operationDetails?.operationName || "—" }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-primary/60">Date</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ formatLongDate(detailPerson.operationDetails?.operationDate) }}</p>
                </div>
                <span
                  v-if="detailPerson.operationDetails?.disposition"
                  class="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-black"
                >{{ detailPerson.operationDetails.disposition }}</span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Visa Status</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.operationDetails?.visaStatus || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 col-span-2">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Operation Address</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.operationDetails?.operationAddress || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 sm:col-span-3">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Remarks</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.operationDetails?.remarks || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 sm:col-span-3">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Actions Taken</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.operationDetails?.actions || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 sm:col-span-3">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Message</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.operationDetails?.message || "—" }}</p>
                </div>
              </div>
            </div>

            <!-- ── Biometrics ─────────────────────────────────── -->
            <div v-if="hasBiometrics(detailPerson)" class="p-5">
              <div class="flex items-center gap-2 mb-4">
                <span class="h-3.5 w-1 rounded-full bg-primary flex-shrink-0"></span>
                <h4 class="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Biometrics</h4>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Height</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.heightCm ? detailPerson.biometrics.heightCm + ' cm' : '—' }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Weight</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.weightKg ? detailPerson.biometrics.weightKg + ' kg' : '—' }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Blood Type</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.bloodType || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Eye Color</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.eyeColor || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Hair Color</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.hairColor || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Complexion</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.complexion || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Fingerprint Code</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.fingerprintCode || "—" }}</p>
                </div>
                <div class="rounded-lg bg-case-card/60 px-3 py-2.5 sm:col-span-2">
                  <p class="text-[9px] font-semibold uppercase tracking-[0.25em] text-gray-600">Distinguishing Marks</p>
                  <p class="mt-0.5 text-xs text-gray-200">{{ detailPerson.biometrics?.distinguishingMarks || "—" }}</p>
                </div>
              </div>
            </div>

          </div><!-- end details tab -->
        </div>

        <!-- Modal footer -->
        <div class="flex items-center justify-between gap-2 border-t border-case-border p-4 flex-shrink-0">
          <button
            v-if="canDelete"
            @click="deleteRecord(detailPerson); detailPerson = null"
            class="rounded-xl border border-red-900/40 px-4 py-2 text-sm text-red-500 transition hover:bg-red-950/30 hover:text-red-400"
          >Delete</button>
          <div v-else></div>
          <div class="flex gap-2">
            <button
              @click="detailPerson = null"
              class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
            >Close</button>
            <button
              v-if="canEdit"
              @click="openEditForm(detailPerson); detailPerson = null"
              class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500"
            >Edit Record</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Form modal (create / edit) ───────────────────────────────── -->
    <div
      v-if="showForm"
      class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-2 sm:px-4 pt-4 sm:pt-10 pb-6 backdrop-blur-sm"
      @click.self="showForm = false"
    >
      <div class="w-full max-w-3xl flex flex-col rounded-2xl border border-case-border bg-case-surface shadow-2xl shadow-black/60">
        <!-- Form header -->
        <div class="border-b border-case-border flex-shrink-0">
          <div class="flex items-center justify-between p-5">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{{ isEditing ? "Edit Record" : "New Record" }}</p>
              <h3 class="mt-0.5 text-lg font-semibold text-white">{{ isEditing ? "Update personnel record" : "Register new personnel" }}</h3>
            </div>
            <button @click="showForm = false" class="text-gray-500 hover:text-gray-300 text-2xl leading-none">&times;</button>
          </div>
          <div v-if="!isEditing" class="flex px-5">
            <button
              @click="formTab = 'manual'"
              :class="formTab === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-300'"
              class="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition"
            >Manual Entry</button>
            <button
              v-if="canEdit"
              @click="formTab = 'import'"
              :class="formTab === 'import' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-300'"
              class="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition"
            >Import File</button>
          </div>
        </div>

        <!-- Form body -->
        <div class="overflow-y-auto p-5 flex-1">
          <!-- Import tab -->
          <div v-if="formTab === 'import'" class="space-y-5">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">Upload File</label>
              <label
                for="importFile"
                class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-case-border bg-case-card px-6 py-10 cursor-pointer transition hover:border-primary/50 hover:bg-case-elevated"
                @dragover.prevent
                @drop.prevent="handleImportDrop"
              >
                <Icon icon="mdi:file-upload-outline" class="text-4xl text-gray-600" />
                <div class="text-center">
                  <p class="text-sm text-gray-400">Drop a CSV or Excel file here, or <span class="text-primary">browse</span></p>
                  <p class="text-xs text-gray-600 mt-1">Accepts .csv, .xlsx, .xls</p>
                </div>
                <input id="importFile" type="file" accept=".csv,.xlsx,.xls" class="hidden" @change="handleImportFile" />
              </label>
            </div>
            <div class="flex justify-end">
              <button type="button" @click="downloadTemplate" class="text-xs text-primary hover:text-amber-500 underline">Download CSV template</button>
            </div>
            <div v-if="importError" class="rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ importError }}</div>
            <div v-if="importPreview.length" class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-xs text-gray-500">{{ importRows.length }} row(s) found — showing first {{ importPreview.length }}</p>
                <span v-if="unmappedColumns.length" class="rounded-full bg-amber-900/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-400">
                  Unrecognized: {{ unmappedColumns.join(", ") }}
                </span>
              </div>
              <div class="overflow-x-auto rounded-xl border border-case-border">
                <table class="min-w-full text-xs">
                  <thead class="bg-case-card">
                    <tr>
                      <th v-for="col in importColumns" :key="col" class="px-3 py-2 text-left text-gray-500 font-medium whitespace-nowrap">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-case-border/50">
                    <tr v-for="(row, idx) in importPreview" :key="idx" class="text-gray-400">
                      <td v-for="col in importColumns" :key="col" class="px-3 py-2 whitespace-nowrap">{{ row[col] || "—" }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-if="isImporting" class="space-y-2">
              <div class="flex justify-between text-xs text-gray-500">
                <span>Importing…</span>
                <span>{{ importProgress }} / {{ importTotal }}</span>
              </div>
              <div class="h-1.5 rounded-full bg-case-elevated overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all" :style="{ width: importTotal ? `${(importProgress / importTotal) * 100}%` : '0%' }"></div>
              </div>
            </div>
            <button
              v-if="importRows.length && !isImporting"
              type="button"
              @click="runImport"
              class="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-amber-500"
            >
              Import {{ importRows.length }} record{{ importRows.length !== 1 ? "s" : "" }}
            </button>
          </div>
          <form v-else id="recordForm" @submit.prevent="handleSubmit" class="space-y-6">
            <div
              ref="messageBanner"
              v-if="message.text"
              :class="message.type === 'success' ? 'border-emerald-800/50 bg-emerald-950/30 text-emerald-400' : 'border-red-900/50 bg-red-950/30 text-red-400'"
              class="rounded-xl border px-4 py-3 text-sm"
            >
              {{ message.text }}
            </div>

            <!-- Personal Information -->
            <div>
              <div class="mb-4 flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-200">Personal Information</h4>
                <span class="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Required</span>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="Name" for-id="name" wrapper-class="sm:col-span-2">
                  <input id="name" v-model.trim="form.personalInformation.name" type="text" :class="fieldClass" placeholder="Juan Santos Dela Cruz" />
                </FormField>
                <FormField label="Alias" for-id="alias">
                  <input id="alias" v-model.trim="form.personalInformation.alias" type="text" :class="fieldClass" placeholder="Jun" />
                </FormField>
                <FormField label="Birth date" for-id="birthDate">
                  <input id="birthDate" v-model="form.personalInformation.birthDate" type="date" :class="fieldClass" />
                </FormField>
                <FormField label="Sex" for-id="sex">
                  <select id="sex" v-model="form.personalInformation.sex" :class="fieldClass">
                    <option disabled value="">Select sex</option>
                    <option v-for="s in selectOptions.sex" :key="s" :value="s">{{ s }}</option>
                  </select>
                </FormField>
                <FormField label="Civil status" for-id="civilStatus">
                  <select id="civilStatus" v-model="form.personalInformation.civilStatus" :class="fieldClass">
                    <option disabled value="">Select civil status</option>
                    <option v-for="c in selectOptions.civilStatus" :key="c" :value="c">{{ c }}</option>
                  </select>
                </FormField>
                <FormField label="Contact number" for-id="contactNumber">
                  <input id="contactNumber" v-model.trim="form.personalInformation.contactNumber" type="text" :class="fieldClass" placeholder="09171234567" />
                </FormField>
                <FormField label="Email address" for-id="emailAddress">
                  <input id="emailAddress" v-model.trim="form.personalInformation.emailAddress" type="email" :class="fieldClass" placeholder="juan@example.com" />
                </FormField>
                <FormField label="Nationality" for-id="nationality">
                  <select id="nationality" v-model="form.personalInformation.nationality" :class="fieldClass">
                    <option disabled value="">Select nationality</option>
                    <option v-for="n in selectOptions.nationality" :key="n" :value="n">{{ n }}</option>
                  </select>
                </FormField>
                <FormField label="Country" for-id="country">
                  <select id="country" v-model="form.personalInformation.country" :class="fieldClass">
                    <option disabled value="">Select country</option>
                    <option v-for="c in selectOptions.country" :key="c" :value="c">{{ c }}</option>
                  </select>
                </FormField>
                <FormField label="Address" for-id="address" wrapper-class="sm:col-span-2">
                  <textarea id="address" v-model.trim="form.personalInformation.address" rows="2" :class="fieldClass" placeholder="House no., street, barangay, municipality" />
                </FormField>
              </div>
            </div>

            <!-- Operation Details -->
            <div>
              <div class="mb-4 flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-200">Operation Details</h4>
                <span class="rounded-full bg-case-elevated px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">Additional</span>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="Operation name" for-id="operationName">
                  <select id="operationName" v-model="form.operationDetails.operationName" @change="handleOperationSelection" :class="fieldClass">
                    <option disabled value="">Select operation</option>
                    <option v-for="op in operationOptions" :key="op._id" :value="op.operationCodeName">{{ formatOperationOption(op) }}</option>
                  </select>
                </FormField>
                <FormField label="Operation date" for-id="operationDate">
                  <input id="operationDate" v-model="form.operationDetails.operationDate" type="date" :class="fieldClass" />
                </FormField>
                <FormField label="Operation address" for-id="operationAddress" wrapper-class="sm:col-span-2">
                  <textarea id="operationAddress" v-model.trim="form.operationDetails.operationAddress" rows="2" :class="fieldClass" placeholder="Street, barangay, municipality, province" />
                </FormField>
                <FormField label="Disposition" for-id="disposition">
                  <select id="disposition" v-model="form.operationDetails.disposition" :class="fieldClass">
                    <option disabled value="">Select disposition</option>
                    <option v-for="d in selectOptions.disposition" :key="d" :value="d">{{ d }}</option>
                  </select>
                </FormField>
                <FormField label="Visa status" for-id="visaStatus">
                  <select id="visaStatus" v-model="form.operationDetails.visaStatus" :class="fieldClass">
                    <option disabled value="">Select visa status</option>
                    <option v-for="v in selectOptions.visaStatus" :key="v" :value="v">{{ v }}</option>
                  </select>
                </FormField>
                <FormField label="Remarks" for-id="remarks" wrapper-class="sm:col-span-2">
                  <textarea id="remarks" v-model.trim="form.operationDetails.remarks" rows="2" :class="fieldClass" placeholder="Additional notes" />
                </FormField>
                <FormField label="Actions taken" for-id="actions" wrapper-class="sm:col-span-2">
                  <textarea id="actions" v-model.trim="form.operationDetails.actions" rows="2" :class="fieldClass" placeholder="Documented actions taken" />
                </FormField>
                <FormField label="Message" for-id="message" wrapper-class="sm:col-span-2">
                  <textarea id="message" v-model.trim="form.operationDetails.message" rows="2" :class="fieldClass" placeholder="Additional message or notes" />
                </FormField>
              </div>
            </div>

            <!-- Biometrics -->
            <div>
              <div class="mb-4 flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-200">Biometrics</h4>
                <span class="rounded-full bg-cyan-900/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">Optional</span>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <FormField label="Height (cm)" for-id="heightCm">
                  <input id="heightCm" v-model="form.biometrics.heightCm" type="number" min="0" step="0.01" :class="fieldClass" placeholder="165" />
                </FormField>
                <FormField label="Weight (kg)" for-id="weightKg">
                  <input id="weightKg" v-model="form.biometrics.weightKg" type="number" min="0" step="0.01" :class="fieldClass" placeholder="60" />
                </FormField>
                <FormField label="Blood type" for-id="bloodType">
                  <select id="bloodType" v-model="form.biometrics.bloodType" :class="fieldClass">
                    <option disabled value="">Select blood type</option>
                    <option v-for="b in selectOptions.bloodType" :key="b" :value="b">{{ b }}</option>
                  </select>
                </FormField>
                <FormField label="Fingerprint code" for-id="fingerprintCode">
                  <input id="fingerprintCode" v-model.trim="form.biometrics.fingerprintCode" type="text" :class="fieldClass" placeholder="FP-2026-0001" />
                </FormField>
                <FormField label="Eye color" for-id="eyeColor">
                  <select id="eyeColor" v-model="form.biometrics.eyeColor" :class="fieldClass">
                    <option disabled value="">Select eye color</option>
                    <option v-for="e in selectOptions.eyeColor" :key="e" :value="e">{{ e }}</option>
                  </select>
                </FormField>
                <FormField label="Hair color" for-id="hairColor">
                  <select id="hairColor" v-model="form.biometrics.hairColor" :class="fieldClass">
                    <option disabled value="">Select hair color</option>
                    <option v-for="h in selectOptions.hairColor" :key="h" :value="h">{{ h }}</option>
                  </select>
                </FormField>
                <FormField label="Complexion" for-id="complexion">
                  <select id="complexion" v-model="form.biometrics.complexion" :class="fieldClass">
                    <option disabled value="">Select complexion</option>
                    <option v-for="c in selectOptions.complexion" :key="c" :value="c">{{ c }}</option>
                  </select>
                </FormField>
                <FormField label="Distinguishing marks" for-id="distinguishingMarks" wrapper-class="sm:col-span-2">
                  <textarea id="distinguishingMarks" v-model.trim="form.biometrics.distinguishingMarks" rows="2" :class="fieldClass" placeholder="Birthmark on left cheek, scar on right hand" />
                </FormField>
              </div>
            </div>

            <!-- Profile photo -->
            <ProfileUploadSection
              :file-name="form.profilePhoto.fileName"
              :profile-summary="profileSummary"
              :profile-preview="profilePreview"
              @change="handleProfileUpload"
            />
          </form>
        </div>

        <!-- Form footer -->
        <div class="flex items-center justify-end gap-2 border-t border-case-border p-4 flex-shrink-0">
          <button
            type="button"
            @click="showForm = false"
            class="rounded-xl border border-case-border px-4 py-2.5 text-sm text-gray-400 transition hover:bg-case-elevated hover:text-gray-200"
          >Cancel</button>
          <button
            v-if="formTab === 'manual'"
            type="submit"
            form="recordForm"
            :disabled="isSubmitting"
            class="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSubmitting ? "Saving…" : (isEditing ? "Update record" : "Save record") }}
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

    <!-- ── Photo lightbox ────────────────────────────────────────────── -->
    <div
      v-if="lightboxSrc"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      @click="lightboxSrc = null"
    >
      <img
        :src="lightboxSrc"
        class="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
        @click.stop
      />
      <button
        class="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
        @click="lightboxSrc = null"
      >
        <Icon icon="ic:outline-close" class="text-xl" />
      </button>
    </div>
  </div>
</template>

<script>
  import { nextTick } from "vue";
  import * as XLSX from "xlsx";
  import { Icon } from "@iconify/vue";
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import FormField from "@/components/FormField.vue";
  import ProfileUploadSection from "@/components/ProfileUploadSection.vue";
  import {
    createConfirmationDialogState,
    createRecordConfirmationDialog,
    resolveConfirmation,
  } from "@/helper/record-confirmation";
  import {
    createEmptyProfilePhoto,
    createFormFromRecord,
    createInitialForm,
    fieldClass,
    selectOptions,
  } from "@/helper/record-form";
  import { createProfilePhotoFromFile } from "@/helper/record-upload";
  import { formatPersonName, getPersonInitials } from "@/helper/record-person";

  export default {
    name: "RegisterRecord",
    components: { Icon, ConfirmationDialog, FormField, ProfileUploadSection },
    data() {
      return {
        form: createInitialForm(),
        selectedRecordId: "",
        isSubmitting: false,
        profilePreview: "",
        people: [],
        operationOptions: [],
        peopleSearch: "",
        isLoadingPeople: false,
        peopleError: "",
        showForm: false,
        formTab: "manual",
        importRows: [],
        importPreview: [],
        importColumns: [],
        importError: "",
        importProgress: 0,
        importTotal: 0,
        isImporting: false,
        detailPerson: null,
        detailTab: "details",
        historyEntries: [],
        historyLoading: false,
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
        fieldClass,
        selectOptions,
        message: { type: "", text: "" },
        lightboxSrc: null,
        currentUser: { role: "", permissions: {} },
        selectedIds: [],
        isDeletingBulk: false,
      };
    },
    computed: {
      isEditing() { return Boolean(this.selectedRecordId); },
      canEdit() {
        return this.currentUser.role === "admin" || Boolean(this.currentUser.permissions?.editIncidents);
      },
      canDelete() {
        return this.currentUser.role === "admin" || Boolean(this.currentUser.permissions?.deleteRecords);
      },
      allSelected() {
        return this.filteredPeople.length > 0 && this.filteredPeople.every(p => this.selectedIds.includes(p._id));
      },
      someSelected() {
        return this.selectedIds.length > 0 && !this.allSelected;
      },
      unmappedColumns() {
        const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
        const known = new Set([
          "name","fullname","completename","alias","nickname",
          "birthdate","dateofbirth","dob","bday","sex","gender","civilstatus","maritalstatus","status",
          "contactnumber","contact","phone","mobile","cellphone","email","emailaddress","nationality",
          "country","address","operationname","operation","codename","opname","operationdate","opdate",
          "operationaddress","opaddress","disposition","visastatus","visa","remarks","notes","actions",
          "actionstaken","message","heightcm","height","weightkg","weight","bloodtype","blood","eyecolor","eyes",
          "haircolor","hair","complexion","skintone","fingerprintcode","fingerprint","distinguishingmarks","marks",
        ]);
        return this.importColumns.filter(col => !known.has(normalize(col)));
      },
      filteredPeople() {
        const kw = this.peopleSearch.toLowerCase();
        if (!kw) return this.people;
        return this.people.filter((p) => {
          const i = p.personalInformation || {};
          return [i.name, i.alias, i.nationality, i.country]
            .filter(Boolean).join(" ").toLowerCase().includes(kw);
        });
      },
      profileSummary() {
        if (!this.form.profilePhoto.fileName) return "No image selected yet.";
        const kb = this.form.profilePhoto.size ? `${(this.form.profilePhoto.size / 1024).toFixed(1)} KB` : "Unknown size";
        return `${this.form.profilePhoto.mimeType || "Image"} | ${kb}`;
      },
    },
    methods: {
      formatPersonName,
      getPersonInitials,
      formatShortDate(v) {
        if (!v) return "—";
        const d = new Date(v);
        if (isNaN(d)) return v;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      },
      formatLongDate(v) {
        if (!v) return "—";
        const d = new Date(v);
        if (isNaN(d)) return v;
        return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      },
      hasBiometrics(person) {
        const b = person?.biometrics || {};
        return Object.values(b).some(Boolean);
      },
      formatOperationOption(op) {
        return [op.operationCodeName, op.operationId ? `(${op.operationId})` : null].filter(Boolean).join(" ");
      },
      openDetail(person) {
        this.detailPerson = person;
        this.detailTab = "details";
        this.historyEntries = [];
      },
      async loadHistory(id) {
        this.historyLoading = true;
        this.historyEntries = [];
        try {
          const res = await API.get(`/cases/records/${id}/history`);
          this.historyEntries = Array.isArray(res.data) ? res.data : (res.data.history || []);
        } catch {
          this.historyEntries = [];
        } finally {
          this.historyLoading = false;
        }
      },
      async deleteRecord(person) {
        const confirmed = await new Promise(resolve => {
          this.confirmationDialog = {
            visible: true,
            title: "Delete record",
            description: `Permanently delete the record for ${this.formatPersonName(person) || "this person"}? This cannot be undone.`,
            confirmText: "Delete",
          };
          this.confirmationResolver = resolve;
        });
        if (!confirmed) return;
        try {
          const name = this.formatPersonName(person) || "Record";
          await API.delete(`/cases/records/${person._id}`);
          this.selectedIds = this.selectedIds.filter(id => id !== person._id);
          await this.loadPeople();
          this.showMessage("success", `${name} has been deleted successfully.`);
        } catch (err) {
          this.peopleError = err.response?.data?.message || "Unable to delete this record.";
        }
      },
      toggleSelect(id) {
        const idx = this.selectedIds.indexOf(id);
        if (idx === -1) this.selectedIds.push(id);
        else this.selectedIds.splice(idx, 1);
      },
      toggleSelectAll() {
        if (this.allSelected) {
          this.selectedIds = [];
        } else {
          this.selectedIds = this.filteredPeople.map(p => p._id);
        }
      },
      async deleteBulk() {
        const count = this.selectedIds.length;
        const confirmed = await new Promise(resolve => {
          this.confirmationDialog = {
            visible: true,
            title: "Delete selected records",
            description: `Permanently delete ${count} selected record${count !== 1 ? "s" : ""}? This cannot be undone.`,
            confirmText: "Delete all",
          };
          this.confirmationResolver = resolve;
        });
        if (!confirmed) return;
        this.isDeletingBulk = true;
        try {
          await Promise.all(this.selectedIds.map(id => API.delete(`/cases/records/${id}`)));
          const deleted = count;
          this.selectedIds = [];
          await this.loadPeople();
          this.showMessage("success", `${deleted} record${deleted !== 1 ? "s" : ""} deleted successfully.`);
        } catch (err) {
          this.peopleError = err.response?.data?.message || "Some records could not be deleted.";
        } finally {
          this.isDeletingBulk = false;
        }
      },
      showMessage(type, text) {
        this.message = { type, text };
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => { this.message = { type: "", text: "" }; }, 5000);
      },
      formatHistoryDate(v) {
        if (!v) return "—";
        return new Intl.DateTimeFormat("en-US", {
          month: "short", day: "numeric", year: "numeric",
          hour: "numeric", minute: "2-digit",
        }).format(new Date(v));
      },
      openNewForm() {
        this.selectedRecordId = "";
        this.form = createInitialForm();
        this.profilePreview = "";
        this.message = { type: "", text: "" };
        this.formTab = "manual";
        this.importRows = [];
        this.importPreview = [];
        this.importColumns = [];
        this.importError = "";
        this.importProgress = 0;
        this.isImporting = false;
        this.showForm = true;
      },
      openEditForm(person) {
        this.selectedRecordId = person._id;
        this.form = createFormFromRecord(person);
        this.profilePreview = person.profilePhoto?.dataUrl || "";
        this.message = { type: "", text: "" };
        this.showForm = true;
      },
      async setMessage(type, text) {
        this.message = { type, text };
        await nextTick();
        this.$refs.messageBanner?.scrollIntoView({ behavior: "smooth", block: "center" });
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(() => { this.message = { type: "", text: "" }; }, 5000);
      },
      async loadPeople() {
        this.isLoadingPeople = true;
        this.peopleError = "";
        try {
          const res = await API.get("/cases/records");
          this.people = Array.isArray(res.data) ? res.data : [];
        } catch (err) {
          this.peopleError = err.response?.data?.message || "Unable to load records.";
        } finally {
          this.isLoadingPeople = false;
        }
      },
      async loadOperations() {
        try {
          const res = await API.get("/cases/operations");
          this.operationOptions = Array.isArray(res.data) ? res.data : [];
        } catch { this.operationOptions = []; }
      },
      handleOperationSelection() {
        const op = this.operationOptions.find(o => o.operationCodeName === this.form.operationDetails.operationName);
        if (!op) return;
        const d = op.actualDateTime || op.plannedDateTime;
        this.form.operationDetails.operationDate = d ? new Date(d).toISOString().slice(0, 10) : "";
        this.form.operationDetails.operationAddress = op.fullAddress || "";
      },
      openConfirmationDialog() {
        this.confirmationDialog = createRecordConfirmationDialog(this.isEditing);
        return new Promise(resolve => { this.confirmationResolver = resolve; });
      },
      closeConfirmationDialog(confirmed) {
        this.confirmationDialog = createConfirmationDialogState();
        resolveConfirmation(this.confirmationResolver, confirmed);
        this.confirmationResolver = null;
      },
      async handleProfileUpload(event) {
        this.message = { type: "", text: "" };
        const [file] = event.target.files || [];
        if (!file) { this.form.profilePhoto = createEmptyProfilePhoto(); this.profilePreview = ""; return; }
        if (file.size > 2 * 1024 * 1024) {
          await this.setMessage("error", "Please upload an image that is 2 MB or smaller.");
          event.target.value = "";
          return;
        }
        this.form.profilePhoto = await createProfilePhotoFromFile(file);
        this.profilePreview = this.form.profilePhoto.dataUrl;
      },
      async handleSubmit() {
        this.message = { type: "", text: "" };
        const pi = this.form.personalInformation;
        if (!pi.name || !pi.sex || !pi.birthDate) {
          await this.setMessage("error", "Name, sex, and birth date are required.");
          return;
        }
        const confirmed = await this.openConfirmationDialog();
        if (!confirmed) return;
        this.isSubmitting = true;
        try {
          const response = this.isEditing
            ? await API.put(`/cases/records/${this.selectedRecordId}`, this.form)
            : await API.post("/cases/records", this.form);
          const successMsg = response.data.message || (this.isEditing ? "Record updated." : "Record saved.");
          await this.loadPeople();
          this.showForm = false;
          await this.setMessage("success", successMsg);
        } catch (err) {
          await this.setMessage("error", err.response?.data?.message || "Unable to save the record.");
        } finally {
          this.isSubmitting = false;
        }
      },
      async handleImportFile(event) {
        const file = event.target.files?.[0];
        if (file) await this.parseAndPreviewFile(file);
      },
      async handleImportDrop(event) {
        const file = event.dataTransfer.files?.[0];
        if (file) await this.parseAndPreviewFile(file);
      },
      normalizeImportDate(val) {
        if (!val || val === "-") return "";
        if (val instanceof Date) {
          return isNaN(val.getTime()) ? "" : val.toISOString().slice(0, 10);
        }
        const s = String(val).trim();
        if (!s || s === "-") return "";
        // Already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        // Already YYYY/MM/DD
        const ymd = s.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
        if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
        // Slash-separated: DD/MM/YYYY or MM/DD/YYYY — detect which
        const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (slash) {
          const a = parseInt(slash[1], 10);
          const b = parseInt(slash[2], 10);
          const y = slash[3];
          if (a > 12) {
            // first part can't be month → DD/MM/YYYY
            return `${y}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
          } else if (b > 12) {
            // second part can't be month → MM/DD/YYYY
            return `${y}-${String(a).padStart(2,"0")}-${String(b).padStart(2,"0")}`;
          } else {
            // ambiguous — default DD/MM/YYYY (PH/Asia convention)
            return `${y}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
          }
        }
        // Dash-separated: DD-MM-YYYY
        const dmy = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (dmy) {
          const a = parseInt(dmy[1], 10);
          const b = parseInt(dmy[2], 10);
          const y = dmy[3];
          if (a > 12) {
            return `${y}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
          } else if (b > 12) {
            return `${y}-${String(a).padStart(2,"0")}-${String(b).padStart(2,"0")}`;
          } else {
            return `${y}-${String(b).padStart(2,"0")}-${String(a).padStart(2,"0")}`;
          }
        }
        // Fallback: JS Date parse ("Jan 15 1990", "January 15, 1990", etc.)
        const d = new Date(s);
        return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
      },
      async parseAndPreviewFile(file) {
        this.importError = "";
        this.importRows = [];
        this.importPreview = [];
        this.importColumns = [];
        try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: "array", cellDates: true });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          // Use header:1 so row 0 is explicitly the header array — avoids
          // XLSX auto-detection issues with merged cells or title rows.
          const rawArrays = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

          // Skip leading blank rows to find the real header row
          let headerIdx = 0;
          while (headerIdx < rawArrays.length && rawArrays[headerIdx].every(c => c === "" || c === null)) {
            headerIdx++;
          }
          if (headerIdx >= rawArrays.length - 1) {
            this.importError = "The file appears to be empty or has no data rows.";
            return;
          }

          const headers = rawArrays[headerIdx].map(h => String(h ?? "").trim());
          const dataRows = rawArrays.slice(headerIdx + 1).filter(r => r.some(c => c !== "" && c !== null));

          const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

          const rows = dataRows.map(row => {
            const obj = {};
            headers.forEach((h, i) => {
              const v = row[i];
              obj[h] = v instanceof Date
                ? (isNaN(v.getTime()) ? "-" : v.toISOString().slice(0, 10))
                : (v === "" || v === null || v === undefined ? "-" : v);
            });
            return obj;
          });

          if (!rows.length) {
            this.importError = "No data rows found after the header.";
            return;
          }

          // Show which columns were not recognized
          const knownNorm = new Set(Object.keys({
            name:1,fullname:1,completename:1,alias:1,nickname:1,
            birthdate:1,birthday:1,dateofbirth:1,dob:1,bday:1,
            sex:1,gender:1,civilstatus:1,maritalstatus:1,status:1,
            contactnumber:1,contact:1,phone:1,mobile:1,cellphone:1,
            email:1,emailaddress:1,nationality:1,country:1,address:1,
            operationname:1,operation:1,codename:1,opname:1,
            operationdate:1,opdate:1,operationaddress:1,opaddress:1,
            disposition:1,visastatus:1,visa:1,remarks:1,notes:1,
            actions:1,actionstaken:1,heightcm:1,height:1,weightkg:1,
            weight:1,bloodtype:1,blood:1,eyecolor:1,eyes:1,
            haircolor:1,hair:1,complexion:1,skintone:1,
            fingerprintcode:1,fingerprint:1,distinguishingmarks:1,marks:1,
          }));

          this.importColumns = headers;
          this.importRows = rows;
          this.importPreview = rows.slice(0, 5);
          this._unmappedCols = headers.filter(h => h && !knownNorm.has(normalize(h)));
        } catch (e) {
          this.importError = "Unable to read the file. Please use a valid CSV or Excel file.";
        }
      },
      rowToFormData(row) {
        const form = createInitialForm();
        const normalize = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
        const map = {
          "name":               ["personalInformation", "name"],
          "fullname":           ["personalInformation", "name"],
          "completename":       ["personalInformation", "name"],
          "alias":              ["personalInformation", "alias"],
          "nickname":           ["personalInformation", "alias"],
          "birthdate":          ["personalInformation", "birthDate"],
          "birthday":           ["personalInformation", "birthDate"],
          "dateofbirth":        ["personalInformation", "birthDate"],
          "dob":                ["personalInformation", "birthDate"],
          "bday":               ["personalInformation", "birthDate"],
          "sex":                ["personalInformation", "sex"],
          "gender":             ["personalInformation", "sex"],
          "civilstatus":        ["personalInformation", "civilStatus"],
          "maritalstatus":      ["personalInformation", "civilStatus"],
          "status":             ["personalInformation", "civilStatus"],
          "contactnumber":      ["personalInformation", "contactNumber"],
          "contactnum":         ["personalInformation", "contactNumber"],
          "contactno":          ["personalInformation", "contactNumber"],
          "contact":            ["personalInformation", "contactNumber"],
          "phone":              ["personalInformation", "contactNumber"],
          "mobile":             ["personalInformation", "contactNumber"],
          "cellphone":          ["personalInformation", "contactNumber"],
          "email":              ["personalInformation", "emailAddress"],
          "emailaddress":       ["personalInformation", "emailAddress"],
          "nationality":        ["personalInformation", "nationality"],
          "country":            ["personalInformation", "country"],
          "address":            ["personalInformation", "address"],
          "operationname":      ["operationDetails", "operationName"],
          "operation":          ["operationDetails", "operationName"],
          "codename":           ["operationDetails", "operationName"],
          "opname":             ["operationDetails", "operationName"],
          "operationdate":      ["operationDetails", "operationDate"],
          "opdate":             ["operationDetails", "operationDate"],
          "operationaddress":   ["operationDetails", "operationAddress"],
          "opaddress":          ["operationDetails", "operationAddress"],
          "disposition":        ["operationDetails", "disposition"],
          "visastatus":         ["operationDetails", "visaStatus"],
          "visa":               ["operationDetails", "visaStatus"],
          "remarks":            ["operationDetails", "remarks"],
          "notes":              ["operationDetails", "remarks"],
          "actions":            ["operationDetails", "actions"],
          "actionstaken":       ["operationDetails", "actions"],
          "message":            ["operationDetails", "message"],
          "heightcm":           ["biometrics", "heightCm"],
          "height":             ["biometrics", "heightCm"],
          "weightkg":           ["biometrics", "weightKg"],
          "weight":             ["biometrics", "weightKg"],
          "bloodtype":          ["biometrics", "bloodType"],
          "blood":              ["biometrics", "bloodType"],
          "eyecolor":           ["biometrics", "eyeColor"],
          "eyes":               ["biometrics", "eyeColor"],
          "haircolor":          ["biometrics", "hairColor"],
          "hair":               ["biometrics", "hairColor"],
          "complexion":         ["biometrics", "complexion"],
          "skintone":           ["biometrics", "complexion"],
          "fingerprintcode":    ["biometrics", "fingerprintCode"],
          "fingerprint":        ["biometrics", "fingerprintCode"],
          "distinguishingmarks":["biometrics", "distinguishingMarks"],
          "marks":              ["biometrics", "distinguishingMarks"],
        };
        const dateFields = new Set(["birthDate", "operationDate"]);
        Object.entries(row).forEach(([col, val]) => {
          const entry = map[normalize(col)];
          if (!entry) return;
          if (val === undefined || val === null || val === "" || val === "-") return;
          const [section, field] = entry;
          form[section][field] = dateFields.has(field)
            ? this.normalizeImportDate(val)
            : String(val).trim();
        });
        return form;
      },
      async runImport() {
        this.isImporting = true;
        this.importProgress = 0;
        this.importTotal = this.importRows.length;
        this.importError = "";
        const failedRows = [];
        let successCount = 0;
        for (let i = 0; i < this.importRows.length; i++) {
          const formData = this.rowToFormData(this.importRows[i]);
          const pi = formData.personalInformation;
          if (!pi.name) {
            const detected = Object.keys(this.importRows[i]).slice(0, 4).join(", ");
            failedRows.push(`Row ${i + 2}: Name not found. Detected columns: [${detected}]`);
            this.importProgress++;
            continue;
          }
          try {
            await API.post("/cases/records", formData);
            successCount++;
          } catch (err) {
            const reason = err.response?.data?.message || "server error";
            failedRows.push(`Row ${i + 2}: ${reason}`);
          }
          this.importProgress++;
        }
        this.isImporting = false;
        await this.loadPeople();
        if (failedRows.length) {
          this.importError = `${failedRows.length} row(s) failed:\n${failedRows.slice(0, 5).join("\n")}${failedRows.length > 5 ? `\n…and ${failedRows.length - 5} more` : ""}`;
        }
        if (successCount) {
          this.showForm = false;
          await this.setMessage("success", `Successfully imported ${successCount} record(s).${failedRows.length ? ` ${failedRows.length} failed — check your file for missing required fields.` : ""}`);
        }
      },
      downloadTemplate() {
        const headers = [
          "Name", "Alias", "Birth Date",
          "Sex", "Civil Status", "Contact Number", "Email", "Nationality", "Country", "Address",
          "Operation Name", "Operation Date", "Operation Address", "Disposition", "Visa Status", "Remarks", "Actions Taken", "Message",
          "Height (cm)", "Weight (kg)", "Blood Type", "Eye Color", "Hair Color", "Complexion", "Fingerprint Code", "Distinguishing Marks",
        ];
        const csv = headers.join(",") + "\n";
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "personnel_template.csv";
        a.click();
        URL.revokeObjectURL(a.href);
      },
    },
    mounted() {
      this.loadPeople();
      this.loadOperations();
      try {
        const stored = localStorage.getItem("auth_user");
        if (stored) this.currentUser = JSON.parse(stored);
      } catch {}
    },
  };
</script>

<style scoped>
  /* thin amber scrollbar inside modals */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: rgba(217, 119, 6, 0.4) #1c1f28;
  }
  .overflow-y-auto::-webkit-scrollbar { width: 5px; }
  .overflow-y-auto::-webkit-scrollbar-track { background: #1c1f28; }
  .overflow-y-auto::-webkit-scrollbar-thumb { background: rgba(217, 119, 6, 0.5); border-radius: 9999px; }
</style>
