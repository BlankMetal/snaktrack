import { identityCopy } from "./config/identity.config.js";
import { createSnackDashboard } from "./controllers/snack-dashboard.controller.js";
import { createSnackRequestsService } from "./services/snack-requests.service.js";

const dashboardRoot = document.querySelector("#snack-dashboard");
const pageParams = new URLSearchParams(window.location.search);
const snackRequestsService = createSnackRequestsService(undefined, {
  demoMode: pageParams.get("demo"),
});

applyShellIdentity(identityCopy);

createSnackDashboard({
  root: dashboardRoot,
  snackRequestsService,
  identity: identityCopy,
});

if (pageParams.has("debugSnackState")) {
  window.snackRequestsService = snackRequestsService;
}

function applyShellIdentity(identity) {
  document.title = identity.shell.documentTitle;

  setText("[data-product-line]", identity.shell.productLine);
  setText("[data-company-line]", identity.shell.companyLine);
  setText("[data-nav-requests]", identity.shell.navItems.requests);
  setText("[data-loading-message]", identity.shell.loadingMessage);
  setText("[data-shell-footer]", identity.shell.footerLegal);

  const homeLink = document.querySelector("[data-shell-home]");

  if (homeLink) {
    homeLink.setAttribute("aria-label", identity.shell.homeLabel);
  }
}

function setText(selector, text) {
  const node = document.querySelector(selector);

  if (node) {
    node.textContent = text;
  }
}
