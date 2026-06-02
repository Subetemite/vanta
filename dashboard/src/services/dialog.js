import { reactive } from "vue";

/**
 * App-wide imperative dialog service.
 *
 * Mount <GlobalConfirmationDialog /> once at the app root (App.vue),
 * then call from anywhere:
 *
 *   import { dialog } from "@/services/dialog";
 *   if (await dialog.confirm({ title: "Delete?", description: "..." })) { ... }
 *   await dialog.alert({ title: "Saved", tone: "success" });
 *   await dialog.error("Network error.");
 */

const defaults = {
  visible: false,
  title: "",
  description: "",
  details: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  loadingText: "Working...",
  tone: "primary",
  icon: "",
  confirmIcon: "",
  singleButton: false,
  loading: false,
  dismissOnBackdrop: true,
};

const state = reactive({ ...defaults });

let resolver = null;

function reset() {
  Object.assign(state, defaults, { visible: false });
  resolver = null;
}

function open(opts, { singleButton } = {}) {
  return new Promise((resolve) => {
    resolver = resolve;
    Object.assign(state, defaults, opts, { visible: true, singleButton: Boolean(singleButton) });
  });
}

export const dialogState = state;

export const dialog = {
  /** Show a confirm dialog. Resolves true on confirm, false on cancel. */
  confirm(opts = {}) {
    return open(opts, { singleButton: false });
  },
  /** Show an info-tone alert with a single OK button. Resolves when dismissed. */
  alert(opts = {}) {
    return open(
      {
        confirmText: "OK",
        tone: "info",
        ...(typeof opts === "string" ? { title: opts } : opts),
      },
      { singleButton: true }
    );
  },
  /** Show a danger-tone alert (e.g. for surfaced API errors). */
  error(message, opts = {}) {
    const text = typeof message === "string" ? message : message?.title || "Something went wrong.";
    return open(
      {
        title: typeof opts.title === "string" ? opts.title : "Error",
        description: typeof opts.description === "string" ? opts.description : text,
        confirmText: "OK",
        tone: "danger",
        ...opts,
      },
      { singleButton: true }
    );
  },
  /** Show a success-tone alert. */
  success(message, opts = {}) {
    const text = typeof message === "string" ? message : message?.description || "";
    return open(
      {
        title: typeof opts.title === "string" ? opts.title : "Success",
        description: text,
        confirmText: "OK",
        tone: "success",
        ...opts,
      },
      { singleButton: true }
    );
  },
  /** Set/clear the loading state on the open dialog (e.g. while awaiting confirm). */
  setLoading(loading) {
    state.loading = Boolean(loading);
  },
  /** Resolve and close from inside the dialog component. */
  _accept() {
    const r = resolver;
    reset();
    if (r) r(true);
  },
  _cancel() {
    const r = resolver;
    reset();
    if (r) r(false);
  },
};

export default dialog;
