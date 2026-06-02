import { createRouter, createWebHistory } from "vue-router";

// Shared
import ModulesHome from "../views/ModulesHome.vue";
import Files from "../views/Files.vue";
import Tables from "../views/cases/tables.vue";

// Auth
import Login from "../views/layouts/auth/Login.vue";
import Register from "../views/layouts/auth/Register.vue";
import ForgotPassword from "../views/layouts/auth/forgot-password.vue";

// System
import LoginHistory from "../views/system/LoginHistory.vue";
import PasswordChange from "../views/system/PasswordChange.vue";
import GeneralSettings from "../views/system/GeneralSettings.vue";
import SecuritySettings from "../views/system/SecuritySettings.vue";
import UsersList from "../views/system/UsersList.vue";
import MyProfile from "../views/system/MyProfile.vue";
import MySettings from "../views/system/MySettings.vue";

// Admin module
import AdminDashboard from "../views/admin/AdminDashboard.vue";
import AdminHris from "../views/admin/hris/Hris.vue";
import AdminHrisEmployeeForm from "../views/admin/hris/EmployeeForm.vue";
import AdminHrisProfile from "../views/admin/hris/EmployeeProfile.vue";
import AdminDtr from "../views/admin/dtr/Dtr.vue";
import AdminDtrTimeLogs from "../views/admin/dtr/TimeLogs.vue";
import AdminDtrLeaves from "../views/admin/dtr/Leaves.vue";
import AdminDtrSpecialOrders from "../views/admin/dtr/SpecialOrders.vue";
import AdminDtrOperations from "../views/admin/dtr/OfficialOperations.vue";
import AdminOpcr from "../views/admin/opcr/Opcr.vue";
import AdminOpcrForm from "../views/admin/opcr/OpcrForm.vue";
import AdminOpcrView from "../views/admin/opcr/OpcrView.vue";
import AdminCalendar from "../views/admin/calendar/Calendar.vue";
import AdminDocuments from "../views/admin/documents/Documents.vue";
import AdminDocumentsNew from "../views/admin/documents/NewRecord.vue";
import AdminDocumentsView from "../views/admin/documents/ViewRecord.vue";

// Cases module
import CasesDashboard from "../views/cases/CasesDashboard.vue";
import RecordRegistration from "../views/cases/records/RegisterRecord.vue";
import Operations from "../views/cases/operations/Operations.vue";
import FocusOperations from "../views/cases/FocusOperations.vue";
import CrimeClusters from "../views/cases/CrimeClusters.vue";
import NaleccScoc from "../views/cases/NaleccScoc.vue";
import InterAgency from "../views/cases/InterAgency.vue";
import AccomplishmentReports from "../views/cases/AccomplishmentReports.vue";
import SoctaHandbook from "../views/cases/SoctaHandbook.vue";

// Logistics module
import LogisticsDashboard from "../views/logistics/LogisticsDashboard.vue";
import LogisticsInventory from "../views/logistics/Inventory.vue";
import LogisticsVehicles from "../views/logistics/Vehicles.vue";
import LogisticsRequisitions from "../views/logistics/Requisitions.vue";
import LogisticsSuppliers from "../views/logistics/Suppliers.vue";
import LogisticsMaintenance from "../views/logistics/Maintenance.vue";
import LogisticsIct from "../views/logistics/IctAssets.vue";

// Operations module
import OperationsDashboard from "../views/operations/OperationsDashboard.vue";
import OperationsMissions from "../views/operations/Missions.vue";
import OperationsDeployments from "../views/operations/Deployments.vue";
import OperationsSitreps from "../views/operations/Sitreps.vue";
import OperationsAfterActions from "../views/operations/AfterActions.vue";
import OperationsCaseInventory from "../views/operations/CaseInventory.vue";

// Social Media module
import SocialDashboard from "../views/social/SocialDashboard.vue";
import SocialAccounts from "../views/social/Accounts.vue";
import SocialPosts from "../views/social/Posts.vue";
import SocialAlerts from "../views/social/Alerts.vue";
import SocialCampaigns from "../views/social/Campaigns.vue";

// UI component demos
import Valert from "../views/components/alert.vue";
import Vaccrodion from "../views/components/accordion.vue";
import Vbreadcumb from "../views/components/breadcumbs.vue";
import Vbutton from "../views/components/button.vue";
import Vcard from "../views/components/card.vue";
import Vdropdown from "../views/components/dropdown.vue";
import Vmodal from "../views/components/modal.vue";

// Layouts + errors
import Blank from "../views/layouts/Blank.vue";
import Page404 from "../views/layouts/error/404.vue";
import Page500 from "../views/layouts/error/500.vue";
import PageMaintenance from "../views/layouts/error/maintenance.vue";

import API from "../services/api";

const appname = " - VANTA";

const routes = [
  // Landing + auth
  { path: "/", name: "LoginLanding", component: Login, meta: { title: "Login" + appname, hideNav: true } },
  { path: "/auth/login", name: "Login", component: Login, meta: { title: "Login" + appname, hideNav: true } },
  { path: "/auth/register", name: "Register", component: Register, meta: { title: "Register" + appname, hideNav: true } },
  { path: "/auth/forgot-password", name: "ForgotPassword", component: ForgotPassword, meta: { title: "Forgot Password" + appname, hideNav: true } },

  // Modules home (post-login landing)
  { path: "/home", name: "Home", component: ModulesHome, meta: { title: "Home" + appname } },

  // Admin module
  { path: "/admin", name: "AdminDashboard", component: AdminDashboard, meta: { title: "Admin" + appname, module: "admin" } },
  { path: "/admin/hris", name: "AdminHris", component: AdminHris, meta: { title: "HRIS" + appname, module: "admin" } },
  { path: "/admin/hris/new", name: "AdminHrisNew", component: AdminHrisEmployeeForm, meta: { title: "New Employee" + appname, module: "admin", requiresEdit: true } },
  { path: "/admin/hris/:id/edit", name: "AdminHrisEdit", component: AdminHrisEmployeeForm, meta: { title: "Edit Employee" + appname, module: "admin", requiresEdit: true } },
  { path: "/admin/hris/:id", name: "AdminHrisProfile", component: AdminHrisProfile, meta: { title: "Employee" + appname, module: "admin" } },
  { path: "/admin/dtr", name: "AdminDtr", component: AdminDtr, meta: { title: "DTR" + appname, module: "admin" } },
  { path: "/admin/dtr/time-logs", name: "AdminDtrTimeLogs", component: AdminDtrTimeLogs, meta: { title: "Time Logs" + appname, module: "admin" } },
  { path: "/admin/dtr/leaves", name: "AdminDtrLeaves", component: AdminDtrLeaves, meta: { title: "Leaves" + appname, module: "admin" } },
  { path: "/admin/dtr/special-orders", name: "AdminDtrSpecialOrders", component: AdminDtrSpecialOrders, meta: { title: "Special Orders" + appname, module: "admin" } },
  { path: "/admin/dtr/operations", name: "AdminDtrOperations", component: AdminDtrOperations, meta: { title: "Official Operations" + appname, module: "admin" } },
  { path: "/admin/opcr", name: "AdminOpcr", component: AdminOpcr, meta: { title: "OPCR" + appname, module: "admin" } },
  { path: "/admin/opcr/new", name: "AdminOpcrNew", component: AdminOpcrForm, meta: { title: "New OPCR" + appname, module: "admin", requiresEdit: true } },
  { path: "/admin/opcr/:id/edit", name: "AdminOpcrEdit", component: AdminOpcrForm, meta: { title: "Edit OPCR" + appname, module: "admin", requiresEdit: true } },
  { path: "/admin/opcr/:id", name: "AdminOpcrView", component: AdminOpcrView, meta: { title: "OPCR" + appname, module: "admin" } },
  { path: "/admin/calendar", name: "AdminCalendar", component: AdminCalendar, meta: { title: "Calendar" + appname, module: "admin" } },
  { path: "/admin/documents", name: "AdminDocuments", component: AdminDocuments, meta: { title: "Documents Tracking System" + appname, module: "admin" } },
  { path: "/admin/documents/new", name: "AdminDocumentsNew", component: AdminDocumentsNew, meta: { title: "New Record" + appname, module: "admin", requiresEdit: true } },
  { path: "/admin/documents/:id/edit", name: "AdminDocumentsEdit", component: AdminDocumentsNew, meta: { title: "Edit Record" + appname, module: "admin" } },
  { path: "/admin/documents/:id", name: "AdminDocumentsView", component: AdminDocumentsView, meta: { title: "View Record" + appname, module: "admin" } },

  // Cases module
  { path: "/cases", name: "CasesDashboard", component: CasesDashboard, meta: { title: "Case Management" + appname, module: "cases" } },
  { path: "/cases/focus-operations", name: "CasesFocusOperations", component: FocusOperations, meta: { title: "4-Focus Operations" + appname, module: "cases" } },
  { path: "/cases/crime-clusters", name: "CasesCrimeClusters", component: CrimeClusters, meta: { title: "18 Crime Clusters" + appname, module: "cases" } },
  { path: "/cases/nalecc-scoc", name: "CasesNaleccScoc", component: NaleccScoc, meta: { title: "NALECC-SCOC" + appname, module: "cases" } },
  { path: "/cases/inter-agency", name: "CasesInterAgency", component: InterAgency, meta: { title: "Inter-Agency Coordinations" + appname, module: "cases" } },
  { path: "/cases/accomplishment-reports", name: "CasesAccomplishmentReports", component: AccomplishmentReports, meta: { title: "Accomplishment Reports" + appname, module: "cases" } },
  { path: "/cases/socta-handbook", name: "CasesSoctaHandbook", component: SoctaHandbook, meta: { title: "SOCTA Handbook" + appname, module: "cases" } },
  { path: "/cases/records", name: "CasesRecords", component: RecordRegistration, meta: { title: "Records" + appname, module: "cases", requiresEdit: true } },
  { path: "/cases/operations", name: "CasesOperations", component: Operations, meta: { title: "Operations" + appname, module: "cases" } },
  { path: "/cases/tables", name: "CasesTables", component: Tables, meta: { title: "Tables" + appname, module: "cases" } },

  // Assets Management module
  { path: "/logistics", name: "LogisticsDashboard", component: LogisticsDashboard, meta: { title: "Assets Management" + appname, module: "logistics" } },
  { path: "/logistics/inventory", name: "LogisticsInventory", component: LogisticsInventory, meta: { title: "Inventory" + appname, module: "logistics" } },
  { path: "/logistics/vehicles", name: "LogisticsVehicles", component: LogisticsVehicles, meta: { title: "Fleet & Vehicles" + appname, module: "logistics" } },
  { path: "/logistics/requisitions", name: "LogisticsRequisitions", component: LogisticsRequisitions, meta: { title: "Requisitions" + appname, module: "logistics" } },
  { path: "/logistics/suppliers", name: "LogisticsSuppliers", component: LogisticsSuppliers, meta: { title: "Suppliers" + appname, module: "logistics" } },
  { path: "/logistics/maintenance", name: "LogisticsMaintenance", component: LogisticsMaintenance, meta: { title: "Maintenance" + appname, module: "logistics" } },
  { path: "/logistics/ict", name: "LogisticsIct", component: LogisticsIct, meta: { title: "ICT Assets" + appname, module: "logistics" } },

  // Operations module
  { path: "/operations", name: "OperationsDashboard", component: OperationsDashboard, meta: { title: "Operations" + appname, module: "operations" } },
  { path: "/operations/missions", name: "OperationsMissions", component: OperationsMissions, meta: { title: "Missions" + appname, module: "operations" } },
  { path: "/operations/deployments", name: "OperationsDeployments", component: OperationsDeployments, meta: { title: "Deployments" + appname, module: "operations" } },
  { path: "/operations/sitreps", name: "OperationsSitreps", component: OperationsSitreps, meta: { title: "SITREPs" + appname, module: "operations" } },
  { path: "/operations/after-actions", name: "OperationsAfterActions", component: OperationsAfterActions, meta: { title: "After-Action Reports" + appname, module: "operations" } },
  { path: "/operations/case-inventory", name: "OperationsCaseInventory", component: OperationsCaseInventory, meta: { title: "Case Inventory" + appname, module: "operations" } },

  // Social Media module
  { path: "/social", name: "SocialDashboard", component: SocialDashboard, meta: { title: "Social Media" + appname, module: "social" } },
  { path: "/social/accounts", name: "SocialAccounts", component: SocialAccounts, meta: { title: "Accounts" + appname, module: "social" } },
  { path: "/social/posts", name: "SocialPosts", component: SocialPosts, meta: { title: "Posts" + appname, module: "social" } },
  { path: "/social/alerts", name: "SocialAlerts", component: SocialAlerts, meta: { title: "Alerts" + appname, module: "social" } },
  { path: "/social/campaigns", name: "SocialCampaigns", component: SocialCampaigns, meta: { title: "Campaigns" + appname, module: "social" } },

  // Shared
  { path: "/files", name: "Files", component: Files, meta: { title: "Files" + appname } },
  { path: "/profile", name: "MyProfile", component: MyProfile, meta: { title: "My Profile" + appname } },
  { path: "/settings", name: "MySettings", component: MySettings, meta: { title: "Settings" + appname } },

  // System (shared, admin)
  { path: "/system/users", name: "UsersList", component: UsersList, meta: { title: "User Management" + appname } },
  { path: "/system/users/create", name: "CreateAccount", component: Register, meta: { title: "Create Account" + appname } },
  { path: "/system/users/passwords", name: "PasswordChange", component: PasswordChange, meta: { title: "Password Change" + appname } },
  { path: "/system/users/login-history", name: "LoginHistory", component: LoginHistory, meta: { title: "Login History" + appname } },
  { path: "/system/settings/general", name: "GeneralSettings", component: GeneralSettings, meta: { title: "General Settings" + appname } },
  { path: "/system/settings/security", name: "SecuritySettings", component: SecuritySettings, meta: { title: "Security Settings" + appname } },

  // UI demos
  { path: "/component/alert", name: "Valert", component: Valert, meta: { title: "Alert" + appname } },
  { path: "/component/accordion", name: "Vaccordion", component: Vaccrodion, meta: { title: "Accordion" + appname } },
  { path: "/component/breadcumb", name: "Vbreadcumb", component: Vbreadcumb, meta: { title: "Breadcumb" + appname } },
  { path: "/component/button", name: "Vbutton", component: Vbutton, meta: { title: "Button" + appname } },
  { path: "/component/card", name: "Vcard", component: Vcard, meta: { title: "Card" + appname } },
  { path: "/component/dropdown", name: "Vdropdown", component: Vdropdown, meta: { title: "Dropdown" + appname } },
  { path: "/component/modal", name: "Vmodal", component: Vmodal, meta: { title: "Modal" + appname } },

  // Layouts + errors
  { path: "/Blank", name: "Blank Page", component: Blank, meta: { title: "Blank Page" + appname } },
  { path: "/500", name: "Page500", component: Page500, meta: { title: "Server Internal Error" + appname, hideNav: true } },
  { path: "/maintenance", name: "maintenance", component: PageMaintenance, meta: { title: "Maintenance" + appname, hideNav: true } },
  { path: "/:pathMatch(.*)*", name: "Page404", component: Page404, meta: { title: "404" + appname, hideNav: true } },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  linkExactActiveClass: "exact-active",
});

let authValidationPromise = null;

function clearStoredSession() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("auth_user") || "null");
  } catch {
    return null;
  }
}

function hasModuleAccess(user, moduleKey) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return Boolean(user.modulePermissions?.[moduleKey]);
}

function canEditModule(user, moduleKey) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!user.modulePermissions?.[moduleKey]) return false;
  return user.moduleRoles?.[moduleKey] === "admin";
}

async function validateStoredSession() {
  const token = localStorage.getItem("auth_token");
  if (!token) return false;

  if (!authValidationPromise) {
    authValidationPromise = API.get("/auth/me")
      .then((response) => {
        localStorage.setItem("auth_user", JSON.stringify(response.data.user));
        return true;
      })
      .catch(() => {
        clearStoredSession();
        return false;
      })
      .finally(() => {
        authValidationPromise = null;
      });
  }

  return authValidationPromise;
}

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title;

  const isAuthenticated = await validateStoredSession();
  const isAuthPage = to.path === "/" || to.path.startsWith("/auth/");
  const requiresAuth = !to.meta.hideNav;

  if (requiresAuth && !isAuthenticated) {
    next("/auth/login");
    return;
  }

  if (isAuthPage && isAuthenticated && to.path !== "/auth/forgot-password") {
    next("/home");
    return;
  }

  if (to.meta.module && isAuthenticated) {
    const user = getStoredUser();
    if (!hasModuleAccess(user, to.meta.module)) {
      next("/home");
      return;
    }
    if (to.meta.requiresEdit && !canEditModule(user, to.meta.module)) {
      next(`/${to.meta.module}`);
      return;
    }
  }

  next();
});

export default router;
