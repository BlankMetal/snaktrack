import dashboardTemplate from "../templates/snack-dashboard.html?raw";
import overBudgetOverrideTemplate from "../templates/over-budget-override.html?raw";
import { identityCopy as defaultIdentity } from "../config/identity.config.js";
import {
  approveSnackRequest,
  getEmployeeTenureAtRequest,
} from "../services/approval-rules.service.js";
import {
  formatRequestAge,
  LOCAL_DEMO_REQUEST_DATE,
} from "../services/snack-requests.service.js";

const PAGE_SIZE = 50;
const REQUESTER_PRICE_CAP = 30;
const ACTING_USERS = Object.freeze({
  administrator: "ADMINISTRATOR",
  sampleEmployee: "SAMPLE EMPLOYEE",
});

export function createSnackDashboard({ root, snackRequestsService, identity = defaultIdentity }) {
  let notice = {
    tone: "info",
    text: identity.notices.initial,
  };
  let currentPage = 1;
  let actingUser = ACTING_USERS.administrator;
  let requestDraft = {
    snackName: "",
    retailPrice: "",
    notes: "",
  };
  let activeReviewRequestId = null;
  let shouldFocusReviewModal = false;

  function getRequestPage() {
    const requests = getFilteredRequests(snackRequestsService.getRequests());
    const totalRequests = requests.length;
    const pageCount = Math.max(1, Math.ceil(totalRequests / PAGE_SIZE));

    currentPage = Math.min(Math.max(currentPage, 1), pageCount);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const visibleRequests = requests.slice(startIndex, startIndex + PAGE_SIZE);

    return {
      visibleRequests,
      totalRequests,
      currentPage,
      pageCount,
      startIndex,
      endIndex: startIndex + visibleRequests.length,
    };
  }

  function getFilteredRequests(requests) {
    const statusFilter = getStatusFilterFromUrl();

    if (statusFilter === null) {
      return requests;
    }

    return requests.filter((request) => normalizeStatusFilterValue(request.status) === statusFilter);
  }

  function getStatusFilterFromUrl() {
    const query = new URLSearchParams(window.location.search);

    if (!query.has("status")) {
      return null;
    }

    // Hidden local filter hook. There is still no UI for this; try ?status=pending.
    return normalizeStatusFilterValue(query.get("status"));
  }

  function normalizeStatusFilterValue(value) {
    return String(value || "").trim().toLowerCase();
  }

  function renderDashboard() {
    const requestPage = isRequesterMode() ? null : getRequestPage();
    const statusCounts = isRequesterMode() ? null : getSummaryStatusCounts();

    root.innerHTML = dashboardTemplate;
    renderStaticCopy();
    renderNotice(root.querySelector("[data-notice]"));
    renderActingUserSwitch(root.querySelector("[data-acting-user]"));
    renderRequesterForm(root.querySelector("[data-requester-form]"));
    renderAdminWorkflow(root.querySelector("[data-admin-workflow]"), requestPage, statusCounts);
    renderRequesterHistory(root.querySelector("[data-requester-history]"));
    renderReviewModal(root.querySelector("[data-review-modal]"));
    bindActingUserButtons();
    bindRequestForm();
    bindPaginationButtons();
    bindReviewButtons();
    bindReviewModalButtons();
    focusReviewModalIfRequested();
  }

  function getSummaryStatusCounts() {
    const statusCounts = snackRequestsService.countByStatus();

    return {
      ...statusCounts,
      pending: (statusCounts.pending || 0) + (statusCounts["needs-override"] || 0),
    };
  }

  function renderStaticCopy() {
    setText("[data-dashboard-eyebrow]", identity.dashboard.eyebrow);
    setText("[data-dashboard-title]", identity.dashboard.title);
    setText("[data-dashboard-context]", identity.dashboard.context);
    setText("[data-table-caption]", identity.dashboard.tableCaption);

    Object.entries(identity.tableHeaders).forEach(([key, label]) => {
      setText(`[data-table-header="${key}"]`, label);
    });

    const complianceNode = root.querySelector("[data-compliance-items]");

    if (complianceNode) {
      complianceNode.replaceChildren(
        ...identity.dashboard.complianceItems.map(renderComplianceItem),
      );
    }
  }

  function renderComplianceItem(item) {
    const listItem = document.createElement("li");

    appendTextWithOptionalLineBreak(listItem, item.text, item.lineBreakAfter);

    return listItem;
  }

  function renderNotice(noticeNode) {
    noticeNode.className = `notice notice-${notice.tone}`;
    noticeNode.replaceChildren();

    appendTextWithOptionalLineBreak(noticeNode, notice.text, notice.lineBreakAfter);
  }

  function renderSummary(summaryNode, statusCounts) {
    summaryNode.innerHTML = identity.summary
      .map(
        ({ status, label }) => `
          <div class="summary-item">
            <span class="summary-value">${statusCounts[status] || 0}</span>
            <span class="summary-label">${label}</span>
          </div>
        `,
      )
      .join("");
  }

  function renderAdminWorkflow(workflowNode, requestPage, statusCounts) {
    if (!workflowNode) {
      return;
    }

    if (isRequesterMode()) {
      workflowNode.hidden = true;
      return;
    }

    workflowNode.hidden = false;
    renderSummary(workflowNode.querySelector("[data-summary]"), statusCounts);
    renderPagination(workflowNode.querySelector("[data-pagination]"), requestPage);
    renderRequestRows(workflowNode.querySelector("[data-request-list]"), requestPage.visibleRequests);
  }

  function renderActingUserSwitch(actingUserNode) {
    const actingUsers = [ACTING_USERS.administrator, ACTING_USERS.sampleEmployee];

    actingUserNode.innerHTML = `
      <strong class="developer-only-label">${identity.actingUser.developerLabel}</strong>
      <div class="acting-user-copy">
        <strong>${identity.actingUser.title}</strong>
        <span>${identity.actingUser.context}</span>
      </div>
      <div class="acting-user-controls" role="group" aria-label="${identity.actingUser.title}">
        ${actingUsers
          .map(
            (user) => `
              <button
                class="acting-user-button ${user === actingUser ? "is-active" : ""}"
                type="button"
                data-acting-user-value="${user}"
                aria-pressed="${user === actingUser}"
              >
                ${user}
              </button>
            `,
          )
          .join("")}
      </div>
      <p class="acting-user-current">
        <strong>${identity.actingUser.currentLabel}:</strong> ${actingUser}
      </p>
    `;
  }

  function renderRequesterForm(formNode) {
    if (!isRequesterMode()) {
      formNode.hidden = true;
      formNode.replaceChildren();
      return;
    }

    formNode.hidden = false;
    formNode.innerHTML = `
      <section class="requester-intake" aria-labelledby="requester-intake-title">
        <div class="requester-intake-copy">
          <p class="eyebrow">Local Intake Exception</p>
          <h2 id="requester-intake-title">${identity.requesterIntake.title}</h2>
          <p>${identity.requesterIntake.context}</p>
          <p class="requester-intake-owner">
            <strong>${identity.actingUser.currentLabel}:</strong> ${ACTING_USERS.sampleEmployee}
          </p>
        </div>
        <form class="request-form" data-request-form>
          <label>
            <span>${identity.requesterIntake.snackLabel}</span>
            <input
              name="snackName"
              type="text"
              maxlength="80"
              value="${escapeHtml(requestDraft.snackName)}"
              required
            />
          </label>
          <label>
            <span>${identity.requesterIntake.priceLabel}</span>
            <input
              name="retailPrice"
              type="number"
              min="0.01"
              step="0.01"
              value="${escapeHtml(requestDraft.retailPrice)}"
              required
            />
          </label>
          <label class="request-form-notes">
            <span>${identity.requesterIntake.notesLabel}</span>
            <textarea
              name="notes"
              maxlength="240"
              rows="4"
            >${escapeHtml(requestDraft.notes)}</textarea>
          </label>
          <button class="approve-button" type="submit">${identity.requesterIntake.submitAction}</button>
          <p class="request-form-help">${identity.requesterIntake.priceHelp}</p>
        </form>
      </section>
    `;
  }

  function renderRequesterHistory(historyNode) {
    if (!historyNode) {
      return;
    }

    if (!isRequesterMode()) {
      historyNode.hidden = true;
      historyNode.replaceChildren();
      return;
    }

    const employeeRequests = snackRequestsService.getRequestsByRequester(ACTING_USERS.sampleEmployee);

    historyNode.hidden = false;
    historyNode.innerHTML = `
      <section class="employee-requests" aria-labelledby="employee-requests-title">
        <div class="employee-requests-header">
          <p class="eyebrow">${identity.requesterHistory.eyebrow}</p>
          <h2 id="employee-requests-title">${identity.requesterHistory.title}</h2>
          <p>${identity.requesterHistory.context}</p>
        </div>
        ${employeeRequests.length > 0 ? renderRequesterHistoryTable(employeeRequests) : renderRequesterHistoryEmpty()}
      </section>
    `;
  }

  function renderRequesterHistoryEmpty() {
    return `
      <div class="employee-requests-empty">
        <strong>${identity.requesterHistory.emptyTitle}</strong>
        <span>${identity.requesterHistory.emptyContext}</span>
      </div>
    `;
  }

  function renderRequesterHistoryTable(requests) {
    return `
      <div class="employee-request-table-shell">
        <table class="employee-request-table">
          <caption>${identity.requesterHistory.caption}</caption>
          <thead>
            <tr>
              <th scope="col">${identity.requesterHistory.headers.request}</th>
              <th scope="col">${identity.requesterHistory.headers.snack}</th>
              <th scope="col">${identity.requesterHistory.headers.itemCost}</th>
              <th scope="col">${identity.requesterHistory.headers.status}</th>
              <th scope="col">${identity.requesterHistory.headers.requested}</th>
            </tr>
          </thead>
          <tbody>
            ${requests.map(renderRequesterHistoryRow).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderRequesterHistoryRow(request) {
    const status = escapeHtml(request.status);

    return `
      <tr>
        <th scope="row">
          <span class="request-id">${escapeHtml(request.id)}</span>
          <span class="request-note"><strong>${identity.rowCopy.noteLabel}:</strong> ${
            escapeHtml(request.notes || identity.rowCopy.noNotes)
          }</span>
        </th>
        <td>${escapeHtml(request.snack)}</td>
        <td>${formatCurrency(request.itemCost)}</td>
        <td><span class="status-badge status-${status}">${formatStatus(request.status)}</span></td>
        <td>
          <time datetime="${escapeHtml(request.requestedAt)}">${escapeHtml(request.requestedAt)}</time>
          <span class="request-age">${formatRequestAge(request.requestedAt)}</span>
        </td>
      </tr>
    `;
  }

  function renderPagination(paginationNode, requestPage) {
    if (!paginationNode) {
      return;
    }

    if (requestPage.totalRequests === 0) {
      paginationNode.innerHTML = `
        <div class="pagination-copy">
          <strong>${identity.pagination.title}</strong>
          <span>${identity.pagination.empty}</span>
        </div>
      `;
      return;
    }

    paginationNode.innerHTML = `
      <div class="pagination-copy">
        <strong>${identity.pagination.title}</strong>
        <span>${identity.pagination.rangeLabel(
          requestPage.startIndex + 1,
          requestPage.endIndex,
          requestPage.totalRequests,
        )}</span>
        <span>${identity.pagination.pageLabel(requestPage.currentPage, requestPage.pageCount)}</span>
      </div>
      <div class="pagination-actions">
        <button class="pagination-button" type="button" data-pagination-action="previous" ${
          requestPage.currentPage === 1 ? "disabled" : ""
        }>${identity.pagination.previous}</button>
        <button class="pagination-button" type="button" data-pagination-action="next" ${
          requestPage.currentPage === requestPage.pageCount ? "disabled" : ""
        }>${identity.pagination.next}</button>
      </div>
    `;
  }

  function renderRequestRows(listNode, requests) {
    listNode.innerHTML = requests.map(renderRequestRow).join("");
  }

  function renderRequestRow(request) {
    const actionMarkup = renderActionMarkup(request);
    const status = escapeHtml(request.status);

    return `
      <tr>
        <th scope="row">
          <span class="request-id">${escapeHtml(request.id)}</span>
          <span class="request-note"><strong>${identity.rowCopy.noteLabel}:</strong> ${
            escapeHtml(request.notes || identity.rowCopy.noNotes)
          }</span>
        </th>
        <td>${escapeHtml(request.requester)}</td>
        <td>${escapeHtml(request.snack)}</td>
        <td>${formatCurrency(request.itemCost)}</td>
        <td><span class="status-badge status-${status}">${formatStatus(request.status)}</span></td>
        <td>
          <time datetime="${escapeHtml(request.requestedAt)}">${escapeHtml(request.requestedAt)}</time>
          <span class="request-age">${formatRequestAge(request.requestedAt)}</span>
        </td>
        <td>${actionMarkup}</td>
      </tr>
    `;
  }

  function renderActionMarkup(request) {
    if (request.status !== "pending") {
      return `<span class="muted-action">${identity.rowCopy.lockedAction}</span>`;
    }

    if (actingUser !== ACTING_USERS.administrator) {
      return `<span class="muted-action">${identity.rowCopy.requesterPendingAction}</span>`;
    }

    return `
      <button class="approve-button review-button" type="button" data-action="review" data-request-id="${escapeHtml(
        request.id,
      )}">${identity.rowCopy.reviewAction}</button>
    `;
  }

  function renderReviewModal(modalNode) {
    if (!activeReviewRequestId) {
      modalNode.hidden = true;
      modalNode.replaceChildren();
      return;
    }

    let request;

    try {
      request = snackRequestsService.getRequestById(activeReviewRequestId);
    } catch {
      activeReviewRequestId = null;
      modalNode.hidden = true;
      modalNode.replaceChildren();
      return;
    }

    const tenure = getEmployeeTenureAtRequest(request);

    modalNode.hidden = false;
    modalNode.innerHTML = `
      <div class="review-modal-backdrop" data-review-close></div>
      <section class="review-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="review-modal-title" tabindex="-1">
        <div class="review-modal-header">
          <div>
            <p class="eyebrow">${identity.reviewModal.eyebrow}</p>
            <h2 id="review-modal-title">${escapeHtml(identity.reviewModal.title(request))}</h2>
          </div>
          <button class="modal-close-button" type="button" data-review-close aria-label="${
            identity.reviewModal.closeAction
          }">X</button>
        </div>
        <div class="review-modal-body">
          <div class="review-detail-panel">
            <h3>${identity.reviewModal.detailsTitle}</h3>
            <dl class="review-detail-list">
              ${renderReviewDetail(identity.reviewModal.fields.requester, request.requester)}
              ${renderReviewDetail(identity.reviewModal.fields.department, request.department)}
              ${renderReviewDetail(identity.reviewModal.fields.snack, request.snack)}
              ${renderReviewDetail(identity.reviewModal.fields.itemCost, formatCurrency(request.itemCost))}
              ${renderReviewDetail(identity.reviewModal.fields.status, formatStatus(request.status))}
              ${renderReviewDetail(identity.reviewModal.fields.requestedAt, request.requestedAt)}
              ${renderReviewDetail(identity.reviewModal.fields.tenure, tenure.label)}
              ${renderReviewDetail(
                identity.reviewModal.fields.notes,
                request.notes || identity.rowCopy.noNotes,
              )}
            </dl>
          </div>
          <div class="review-policy-slot" data-budget-warning-slot data-budget-override-slot hidden>
            ${overBudgetOverrideTemplate}
          </div>
        </div>
        <div class="review-modal-actions">
          <button class="reject-button" type="button" data-modal-action="reject">${identity.rowCopy.rejectAction}</button>
          <button class="approve-button" type="button" data-modal-action="approve">${identity.rowCopy.approveAction}</button>
        </div>
      </section>
    `;
  }

  function renderReviewDetail(label, value) {
    return `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>
    `;
  }

  function bindActingUserButtons() {
    root.querySelectorAll("[data-acting-user-value]").forEach((button) => {
      button.addEventListener("click", () => {
        actingUser = button.dataset.actingUserValue;
        requestDraft = {
          snackName: "",
          retailPrice: "",
          notes: "",
        };
        activeReviewRequestId = null;
        shouldFocusReviewModal = false;
        currentPage = 1;
        notice =
          actingUser === ACTING_USERS.sampleEmployee
            ? { tone: "info", text: identity.notices.requester }
            : { tone: "info", text: identity.notices.initial };
        renderDashboard();
      });
    });
  }

  function bindRequestForm() {
    const form = root.querySelector("[data-request-form]");

    if (!form) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const snackName = String(formData.get("snackName") || "").trim();
      const retailPriceValue = String(formData.get("retailPrice") || "");
      const retailPrice = Number(retailPriceValue);
      const notes = String(formData.get("notes") || "").trim();

      requestDraft = {
        snackName,
        retailPrice: retailPriceValue,
        notes,
      };

      if (!snackName) {
        notice = { tone: "warning", text: identity.requesterIntake.validation.snackRequired };
        renderDashboard();
        return;
      }

      if (!Number.isFinite(retailPrice) || retailPrice <= 0) {
        notice = { tone: "warning", text: identity.requesterIntake.validation.priceRequired };
        renderDashboard();
        return;
      }

      if (retailPrice > REQUESTER_PRICE_CAP) {
        notice = { tone: "warning", text: identity.requesterIntake.validation.priceCap };
        renderDashboard();
        return;
      }

      const request = snackRequestsService.createRequest({
        requester: ACTING_USERS.sampleEmployee,
        department: identity.requesterIntake.department,
        snack: snackName,
        itemCost: roundCurrency(retailPrice),
        requestedAt: LOCAL_DEMO_REQUEST_DATE,
        notes: notes || undefined,
      });

      requestDraft = {
        snackName: "",
        retailPrice: "",
        notes: "",
      };
      activeReviewRequestId = null;
      currentPage = 1;
      notice = { tone: "success", text: identity.requesterIntake.created(request) };
      renderDashboard();
    });
  }

  function bindPaginationButtons() {
    root.querySelectorAll("[data-pagination-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.paginationAction === "previous") {
          currentPage -= 1;
        }

        if (button.dataset.paginationAction === "next") {
          currentPage += 1;
        }

        activeReviewRequestId = null;
        shouldFocusReviewModal = false;
        renderDashboard();
      });
    });
  }

  function bindReviewButtons() {
    root.querySelectorAll("[data-action='review']").forEach((button) => {
      button.addEventListener("click", () => {
        activeReviewRequestId = button.dataset.requestId;
        shouldFocusReviewModal = true;
        renderDashboard();
      });
    });
  }

  function bindReviewModalButtons() {
    const modal = root.querySelector(".review-modal-dialog");

    if (modal) {
      modal.addEventListener("keydown", trapReviewModalFocus);
    }

    root.querySelectorAll("[data-review-close]").forEach((button) => {
      button.addEventListener("click", () => {
        closeReviewModal();
      });
    });

    const approveButton = root.querySelector("[data-modal-action='approve']");
    const rejectButton = root.querySelector("[data-modal-action='reject']");

    if (approveButton) {
      approveButton.addEventListener("click", () => {
        const request = snackRequestsService.getRequestById(activeReviewRequestId);
        const result = approveSnackRequest(request);

        if (result.ok) {
          snackRequestsService.updateRequestStatus(request.id, result.status);
          activeReviewRequestId = null;
          shouldFocusReviewModal = false;
          notice = { tone: "success", text: result.message };
          renderDashboard();
          focusAfterReviewClose(request.id);
        }
      });
    }

    if (rejectButton) {
      rejectButton.addEventListener("click", () => {
        const request = snackRequestsService.getRequestById(activeReviewRequestId);

        snackRequestsService.updateRequestStatus(request.id, "rejected");
        activeReviewRequestId = null;
        shouldFocusReviewModal = false;
        notice = { tone: "warning", text: identity.notices.rejected(request) };
        renderDashboard();
        focusAfterReviewClose(request.id);
      });
    }
  }

  function closeReviewModal() {
    const requestId = activeReviewRequestId;

    activeReviewRequestId = null;
    shouldFocusReviewModal = false;
    renderDashboard();
    focusAfterReviewClose(requestId);
  }

  function focusReviewModalIfRequested() {
    if (!shouldFocusReviewModal) {
      return;
    }

    shouldFocusReviewModal = false;

    const modal = root.querySelector(".review-modal-dialog");

    if (modal) {
      modal.focus({ preventScroll: true });
    }
  }

  function focusAfterReviewClose(requestId) {
    const reviewButton = Array.from(root.querySelectorAll("[data-action='review']")).find(
      (button) => button.dataset.requestId === requestId,
    );

    if (reviewButton) {
      reviewButton.focus({ preventScroll: true });
      return;
    }

    const dashboardTitle = root.querySelector("#dashboard-title");

    if (dashboardTitle) {
      dashboardTitle.focus({ preventScroll: true });
    }
  }

  function trapReviewModalFocus(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeReviewModal();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const modal = event.currentTarget;
    const focusableElements = getFocusableElements(modal);

    if (focusableElements.length === 0) {
      event.preventDefault();
      modal.focus({ preventScroll: true });
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus({ preventScroll: true });
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  }

  function getFocusableElements(container) {
    return Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter(
      (element) =>
        !element.disabled &&
        element.getAttribute("aria-hidden") !== "true" &&
        element.offsetParent !== null,
    );
  }

  renderDashboard();

  function isRequesterMode() {
    return actingUser === ACTING_USERS.sampleEmployee;
  }

  function formatStatus(status) {
    return escapeHtml(identity.statusLabels[status] || status);
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("en-US", {
      currency: "USD",
      style: "currency",
    });
  }

  function roundCurrency(value) {
    return Math.round(value * 100) / 100;
  }

  function setText(selector, text) {
    const node = root.querySelector(selector);

    if (node) {
      node.textContent = text;
    }
  }

  function appendTextWithOptionalLineBreak(node, text, lineBreakAfter) {
    if (!lineBreakAfter || !text.startsWith(lineBreakAfter)) {
      node.textContent = text;
      return;
    }

    const trailingText = text.slice(lineBreakAfter.length).trimStart();

    node.append(document.createTextNode(lineBreakAfter));
    node.append(document.createElement("br"));
    node.append(document.createTextNode(trailingText));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return replacements[character];
    });
  }
}
