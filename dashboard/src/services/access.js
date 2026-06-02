function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("auth_user") || "null");
  } catch {
    return null;
  }
}

export function isSystemAdmin() {
  return getCurrentUser()?.role === "admin";
}

export function hasModuleAccess(moduleKey) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  return Boolean(user.modulePermissions?.[moduleKey]);
}

export function canEditModule(moduleKey) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!user.modulePermissions?.[moduleKey]) return false;
  return user.moduleRoles?.[moduleKey] === "admin";
}

export function isModuleViewer(moduleKey) {
  return hasModuleAccess(moduleKey) && !canEditModule(moduleKey);
}

export const accessMixin = {
  computed: {
    $isSystemAdmin() {
      return isSystemAdmin();
    },
  },
  methods: {
    $canEditModule(moduleKey) {
      return canEditModule(moduleKey);
    },
    $isModuleViewer(moduleKey) {
      return isModuleViewer(moduleKey);
    },
    $hasModuleAccess(moduleKey) {
      return hasModuleAccess(moduleKey);
    },
  },
};
