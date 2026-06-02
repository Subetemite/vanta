<template>
  <div class="min-h-screen bg-case-bg px-6 py-8 sm:px-10 lg:px-12">
    <header class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs uppercase tracking-[0.35em] text-primary">ADMIN / Calendar</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">Calendar of Activities</h1>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="employeeFilter"
          class="rounded-xl border border-case-border bg-case-surface px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
          @change="loadFeed"
        >
          <option value="">All employees</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
        </select>
        <button
          type="button"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500"
          @click="openActivityForm()"
        >
          + Add Activity
        </button>
      </div>
    </header>

    <!-- Month nav + legend -->
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <button type="button" class="rounded-md border border-case-border bg-case-surface px-3 py-1.5 text-sm text-gray-300 hover:bg-case-card" @click="navigateMonth(-1)">‹ Prev</button>
        <button type="button" class="rounded-md border border-case-border bg-case-surface px-3 py-1.5 text-sm text-gray-300 hover:bg-case-card" @click="goToToday">Today</button>
        <button type="button" class="rounded-md border border-case-border bg-case-surface px-3 py-1.5 text-sm text-gray-300 hover:bg-case-card" @click="navigateMonth(1)">Next ›</button>
        <h2 class="ml-3 text-lg font-semibold text-white">{{ monthLabel }}</h2>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-xs">
        <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-amber-400"></span><span class="text-gray-400">Activity</span></span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-rose-400"></span><span class="text-gray-400">Leave</span></span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-blue-400"></span><span class="text-gray-400">Special Order</span></span>
        <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-emerald-400"></span><span class="text-gray-400">Operation</span></span>
      </div>
    </div>

    <div v-if="errorMessage" class="mb-3 rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">{{ errorMessage }}</div>

    <!-- Grid -->
    <div class="overflow-hidden rounded-2xl border border-case-border bg-case-surface">
      <div class="grid grid-cols-7 border-b border-case-border bg-case-elevated text-xs uppercase tracking-[0.2em] text-gray-500">
        <div v-for="d in weekdays" :key="d" class="px-3 py-2 text-center font-medium">{{ d }}</div>
      </div>
      <div class="grid grid-cols-7">
        <button
          v-for="(day, idx) in calendarDays"
          :key="idx"
          type="button"
          class="group flex min-h-[110px] flex-col gap-1 border-b border-r border-case-border p-2 text-left transition hover:bg-case-card"
          :class="{
            'bg-case-bg/40 text-gray-600': !day.inMonth,
            'ring-1 ring-inset ring-primary/40': day.isToday,
          }"
          @click="openDayDetail(day)"
        >
          <span class="text-xs font-semibold tabular-nums" :class="day.isToday ? 'text-primary' : (day.inMonth ? 'text-gray-300' : 'text-gray-600')">
            {{ day.date.getUTCDate() }}
          </span>
          <div class="flex-1 space-y-1 overflow-hidden">
            <div
              v-for="ev in day.events.slice(0, 3)"
              :key="`${ev.source}-${ev.id}`"
              class="overflow-hidden rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight"
              :class="eventChipClass(ev)"
              :title="chipTooltip(ev)"
            >
              <template v-if="ev.source === 'leave'">
                <div class="truncate font-semibold">{{ leaveAttendeeName(ev) }}</div>
                <div class="truncate text-[9px] uppercase tracking-wider opacity-80">{{ leaveAbbrev(ev.type) }}</div>
              </template>
              <div v-else class="truncate">{{ ev.title }}</div>
            </div>
            <div v-if="day.events.length > 3" class="text-[10px] font-medium text-gray-500">
              +{{ day.events.length - 3 }} more
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Day detail modal -->
    <div v-if="dayDetail.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeDayDetail">
      <div class="w-full max-w-2xl max-h-[85vh] overflow-auto rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Day View</p>
            <h3 class="mt-1 text-xl font-semibold text-white">{{ formatLongDate(dayDetail.date) }}</h3>
          </div>
          <button type="button" class="text-2xl text-gray-500 hover:text-gray-300" @click="closeDayDetail">×</button>
        </div>

        <p v-if="!dayDetail.events.length" class="rounded-xl border border-dashed border-case-border px-4 py-8 text-center text-sm text-gray-500">
          Nothing scheduled for this day.
        </p>

        <section v-for="group in groupedDayEvents" v-else :key="group.source" class="mb-5 last:mb-0">
          <div class="mb-2 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full" :class="legendDotClass(group.source)"></span>
            <h4 class="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">{{ group.label }}</h4>
            <span class="text-xs text-gray-500">({{ group.items.length }})</span>
          </div>
          <ul class="space-y-2">
            <li v-for="ev in group.items" :key="`${ev.source}-${ev.id}`" class="rounded-xl border border-case-border bg-case-card p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="text-sm font-semibold text-white">{{ ev.title }}</p>
                  <p class="mt-0.5 text-xs text-gray-500">
                    {{ formatRange(ev) }}
                    <span v-if="ev.location"> · {{ ev.location }}</span>
                  </p>
                  <p v-if="ev.attendees && ev.attendees.length" class="mt-1 text-xs text-gray-400">
                    <span class="text-gray-500">People:</span> {{ ev.attendees.map((a) => a.fullName).join(", ") }}
                  </p>
                </div>
                <div v-if="ev.source === 'activity'" class="flex flex-shrink-0 items-center gap-1">
                  <button type="button" class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20" @click="editActivity(ev)">Edit</button>
                  <button type="button" class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/20" @click="deleteActivity(ev)">Delete</button>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <div class="mt-6 flex justify-end">
          <button type="button" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500" @click="openActivityForm({ defaultDate: dayDetail.date })">+ Add Activity for this day</button>
        </div>
      </div>
    </div>

    <!-- Activity form modal -->
    <div v-if="activityForm.visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeActivityForm">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-case-border bg-case-surface p-6 shadow-2xl shadow-black/60">
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary">{{ activityForm.editingId ? "Edit Activity" : "New Activity" }}</p>
        <form class="mt-5 space-y-4" @submit.prevent="submitActivity">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Title <span class="text-primary">*</span></label>
              <input v-model="activityForm.title" type="text" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
            </div>
            <div>
              <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Type</label>
              <select v-model="activityForm.type" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
                <option v-for="t in activityTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Start Date <span class="text-primary">*</span></label><input v-model="activityForm.startDate" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">End Date <span class="text-primary">*</span></label><input v-model="activityForm.endDate" type="date" required class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Start Time</label><input v-model="activityForm.startTime" type="time" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
            <div><label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">End Time</label><input v-model="activityForm.endTime" type="time" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" /></div>
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Location</label>
            <input v-model="activityForm.location" type="text" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary" />
          </div>
          <div>
            <label class="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">Description</label>
            <textarea v-model="activityForm.description" rows="2" class="w-full rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"></textarea>
          </div>
          <div>
            <div class="mb-1 flex items-center justify-between">
              <label class="block text-xs uppercase tracking-[0.2em] text-gray-500">Attendees</label>
              <button type="button" class="text-xs text-primary hover:underline" @click="addAttendee">+ Add</button>
            </div>
            <div v-for="(a, idx) in activityForm.attendees" :key="idx" class="mb-2 flex items-center gap-2">
              <select v-model="a.employee" class="flex-1 rounded-xl border border-case-border bg-case-card px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary">
                <option value="">Select employee...</option>
                <option v-for="e in employees" :key="e.id" :value="e.id">{{ e.fullName }} ({{ e.employeeId }})</option>
              </select>
              <button type="button" class="text-xs text-red-400 hover:underline" @click="activityForm.attendees.splice(idx,1)">Remove</button>
            </div>
            <p v-if="!activityForm.attendees.length" class="text-xs text-gray-600">No attendees added.</p>
          </div>
          <div v-if="activityForm.error" class="rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">{{ activityForm.error }}</div>
          <div class="flex justify-end gap-2">
            <button type="button" class="rounded-xl border border-case-border px-4 py-2 text-sm text-gray-400 hover:bg-case-elevated" @click="closeActivityForm">Cancel</button>
            <button type="submit" class="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:opacity-50" :disabled="activityForm.isSubmitting">{{ activityForm.isSubmitting ? "Saving..." : (activityForm.editingId ? "Save" : "Add") }}</button>
          </div>
        </form>
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
  import API from "@/services/api";
  import ConfirmationDialog from "@/components/ConfirmationDialog.vue";
  import { createConfirmationDialogState, resolveConfirmation } from "@/helper/record-confirmation";

  const ACTIVITY_TYPES = ["Meeting", "Conference", "Training", "Holiday", "Event", "Other"];
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const LEAVE_ABBREVIATIONS = {
    "Vacation Leave": "VL",
    "Sick Leave": "SL",
    "Mandatory/Forced Leave": "ML",
    "Special Privilege Leave": "SPL",
    "Maternity Leave": "MatL",
    "Paternity Leave": "PatL",
    "Solo Parent Leave": "SoloPL",
    "Study Leave": "StL",
    "10-Day VAWC Leave": "VAWC",
    "Rehabilitation Leave": "RehL",
    "Special Leave Benefit for Women": "SLBW",
    "Adoption Leave": "AdpL",
    "Special Emergency Leave": "SEL",
    Other: "OL",
  };

  function ymd(date) {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  function emptyActivityForm() {
    return {
      visible: false,
      editingId: "",
      title: "",
      type: ACTIVITY_TYPES[0],
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      location: "",
      description: "",
      attendees: [],
      isSubmitting: false,
      error: "",
    };
  }

  export default {
    name: "AdminCalendar",
    components: { ConfirmationDialog },
    data() {
      return {
        viewYear: 0,
        viewMonth: 0, // 0-indexed
        events: [],
        employees: [],
        employeeFilter: "",
        weekdays: WEEKDAYS,
        activityTypes: ACTIVITY_TYPES,
        errorMessage: "",
        dayDetail: { visible: false, date: null, events: [] },
        activityForm: emptyActivityForm(),
        confirmationDialog: createConfirmationDialogState(),
        confirmationResolver: null,
      };
    },
    computed: {
      monthLabel() {
        return `${MONTH_NAMES[this.viewMonth]} ${this.viewYear}`;
      },
      calendarDays() {
        const firstOfMonth = new Date(Date.UTC(this.viewYear, this.viewMonth, 1));
        const startOffset = firstOfMonth.getUTCDay();
        const cells = [];
        const todayKey = ymd(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())));

        for (let i = 0; i < 42; i++) {
          const d = new Date(Date.UTC(this.viewYear, this.viewMonth, 1 - startOffset + i));
          const dayEvents = this.events.filter((ev) => {
            const start = new Date(ev.startDate);
            const end = new Date(ev.endDate);
            return d >= startOfDay(start) && d <= startOfDay(end);
          });
          cells.push({
            date: d,
            inMonth: d.getUTCMonth() === this.viewMonth,
            isToday: ymd(d) === todayKey,
            events: dayEvents,
          });
        }
        return cells;
      },
      groupedDayEvents() {
        const groups = [
          { source: "activity", label: "Activities", items: [] },
          { source: "leave", label: "On Leave", items: [] },
          { source: "special-order", label: "Special Orders", items: [] },
          { source: "operation", label: "Official Operations", items: [] },
        ];
        for (const ev of this.dayDetail.events) {
          const g = groups.find((x) => x.source === ev.source);
          if (g) g.items.push(ev);
        }
        return groups.filter((g) => g.items.length);
      },
      feedRange() {
        const from = new Date(Date.UTC(this.viewYear, this.viewMonth, 1));
        from.setUTCDate(from.getUTCDate() - from.getUTCDay()); // back up to Sunday
        const to = new Date(from);
        to.setUTCDate(to.getUTCDate() + 41);
        return { from: ymd(from), to: ymd(to) };
      },
    },
    methods: {
      openConfirmationDialog(p) { this.confirmationDialog = { visible: true, ...p }; return new Promise((r) => { this.confirmationResolver = r; }); },
      closeConfirmationDialog(c) { this.confirmationDialog = createConfirmationDialogState(); resolveConfirmation(this.confirmationResolver, c); this.confirmationResolver = null; },
      formatLongDate(d) {
        if (!d) return "";
        return new Date(d).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
      },
      formatRange(ev) {
        const start = ymd(new Date(ev.startDate));
        const end = ymd(new Date(ev.endDate));
        const datePart = start === end ? start : `${start} → ${end}`;
        if (ev.startTime || ev.endTime) {
          return `${datePart}${ev.startTime ? ` · ${ev.startTime}` : ""}${ev.endTime ? `–${ev.endTime}` : ""}`;
        }
        return datePart;
      },
      attendeesShort(ev) {
        if (!ev.attendees || !ev.attendees.length) return "—";
        if (ev.attendees.length === 1) return ev.attendees[0].fullName;
        return `${ev.attendees[0].fullName} +${ev.attendees.length - 1}`;
      },
      leaveAttendeeName(ev) {
        return ev.attendees?.[0]?.fullName || "Unknown";
      },
      leaveAbbrev(type) {
        return LEAVE_ABBREVIATIONS[type] || type;
      },
      chipTooltip(ev) {
        if (ev.source === "leave") {
          return `${this.leaveAttendeeName(ev)} — ${ev.type}`;
        }
        return `${ev.title} — ${this.attendeesShort(ev)}`;
      },
      eventChipClass(ev) {
        const map = {
          activity: "bg-amber-500/15 text-amber-200",
          leave: "bg-rose-500/15 text-rose-200",
          "special-order": "bg-blue-500/15 text-blue-200",
          operation: "bg-emerald-500/15 text-emerald-200",
        };
        return map[ev.source] || "bg-gray-500/15 text-gray-200";
      },
      legendDotClass(source) {
        const map = {
          activity: "bg-amber-400",
          leave: "bg-rose-400",
          "special-order": "bg-blue-400",
          operation: "bg-emerald-400",
        };
        return map[source] || "bg-gray-400";
      },
      navigateMonth(delta) {
        const d = new Date(Date.UTC(this.viewYear, this.viewMonth + delta, 1));
        this.viewYear = d.getUTCFullYear();
        this.viewMonth = d.getUTCMonth();
        this.loadFeed();
      },
      goToToday() {
        const now = new Date();
        this.viewYear = now.getUTCFullYear();
        this.viewMonth = now.getUTCMonth();
        this.loadFeed();
      },
      async loadEmployees() {
        try {
          const res = await API.get("/admin/hris/employees");
          this.employees = res.data?.employees || [];
        } catch { this.employees = []; }
      },
      async loadFeed() {
        this.errorMessage = "";
        try {
          const { from, to } = this.feedRange;
          const params = new URLSearchParams({ from, to });
          if (this.employeeFilter) params.set("employee", this.employeeFilter);
          const res = await API.get(`/admin/calendar/feed?${params.toString()}`);
          this.events = Array.isArray(res.data?.events) ? res.data.events : [];
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to load calendar.";
        }
      },
      openDayDetail(day) {
        this.dayDetail = { visible: true, date: day.date, events: day.events };
      },
      closeDayDetail() {
        this.dayDetail = { visible: false, date: null, events: [] };
      },
      openActivityForm({ defaultDate } = {}) {
        this.activityForm = emptyActivityForm();
        this.activityForm.visible = true;
        if (defaultDate) {
          const key = ymd(defaultDate);
          this.activityForm.startDate = key;
          this.activityForm.endDate = key;
        }
      },
      editActivity(ev) {
        this.closeDayDetail();
        const f = emptyActivityForm();
        f.visible = true;
        f.editingId = ev.id;
        f.title = ev.title;
        f.type = ev.type;
        f.startDate = ymd(new Date(ev.startDate));
        f.endDate = ymd(new Date(ev.endDate));
        f.startTime = ev.startTime || "";
        f.endTime = ev.endTime || "";
        f.location = ev.location || "";
        f.description = ev.description || "";
        f.attendees = (ev.attendees || []).map((a) => ({ employee: String(a.employee || "") }));
        this.activityForm = f;
      },
      closeActivityForm() {
        this.activityForm = emptyActivityForm();
      },
      addAttendee() {
        this.activityForm.attendees.push({ employee: "" });
      },
      async submitActivity() {
        this.activityForm.error = "";
        const isEdit = Boolean(this.activityForm.editingId);
        const confirmed = await this.openConfirmationDialog(
          isEdit
            ? { title: "Update activity?", description: `Apply changes to "${this.activityForm.title}".`, confirmText: "Yes, update" }
            : { title: "Save activity?", description: `Add "${this.activityForm.title}" to the calendar.`, confirmText: "Yes, save" }
        );
        if (!confirmed) return;
        this.activityForm.isSubmitting = true;
        const payload = {
          title: this.activityForm.title,
          type: this.activityForm.type,
          startDate: this.activityForm.startDate,
          endDate: this.activityForm.endDate,
          startTime: this.activityForm.startTime,
          endTime: this.activityForm.endTime,
          location: this.activityForm.location,
          description: this.activityForm.description,
          attendees: this.activityForm.attendees.filter((a) => a.employee).map((a) => ({ employee: a.employee })),
        };
        try {
          if (isEdit) await API.put(`/admin/calendar/activities/${this.activityForm.editingId}`, payload);
          else await API.post("/admin/calendar/activities", payload);
          this.closeActivityForm();
          await this.loadFeed();
        } catch (err) {
          this.activityForm.error = err.response?.data?.message || "Unable to save activity.";
        } finally {
          this.activityForm.isSubmitting = false;
        }
      },
      async deleteActivity(ev) {
        const confirmed = await this.openConfirmationDialog({
          title: "Delete activity?",
          description: `Activity "${ev.title}" will be permanently removed.`,
          confirmText: "Yes, delete",
        });
        if (!confirmed) return;
        try {
          await API.delete(`/admin/calendar/activities/${ev.id}`);
          this.closeDayDetail();
          await this.loadFeed();
        } catch (err) {
          this.errorMessage = err.response?.data?.message || "Unable to delete activity.";
        }
      },
    },
    mounted() {
      const now = new Date();
      this.viewYear = now.getUTCFullYear();
      this.viewMonth = now.getUTCMonth();
      this.loadEmployees();
      this.loadFeed();
    },
  };

  function startOfDay(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
</script>
