const ADMIN_INTERFACE_MODE_KEY = "ninou_admin_interface_mode";

let initialized = false;

function getNode(selector) {
  return document.querySelector(selector);
}

function getErrorText(api, error) {
  return api.getErrorMessage?.(error) || error?.message || "Não foi possível concluir esta ação.";
}

function setAdminInterfaceMode(isAdvanced, { persist = true } = {}) {
  const advanced = Boolean(isAdvanced);
  const toggleButton = getNode("#adminModeToggleButton");
  const hint = getNode("#adminModeHint");
  document.body.classList.toggle("ninou-advanced-mode", advanced);
  document.body.classList.toggle("ninou-simple-mode", !advanced);
  if (toggleButton) {
    toggleButton.setAttribute("aria-pressed", advanced ? "true" : "false");
    toggleButton.textContent = advanced ? "Usar modo simples" : "Mostrar modo avançado";
  }
  if (hint) {
    hint.textContent = advanced
      ? "Modo avançado ativo: diagnóstico técnico, histórico completo, backup JSON e manutenção ficam visíveis."
      : "Modo simples ativo: o Ninou mostra só o essencial e mantém diagnóstico técnico recolhido.";
  }
  if (persist) localStorage.setItem(ADMIN_INTERFACE_MODE_KEY, advanced ? "advanced" : "simple");
}

function initAdminInterfaceMode() {
  const savedMode = localStorage.getItem(ADMIN_INTERFACE_MODE_KEY);
  setAdminInterfaceMode(savedMode === "advanced", { persist: false });
  getNode("#adminModeToggleButton")?.addEventListener("click", () => {
    setAdminInterfaceMode(!document.body.classList.contains("ninou-advanced-mode"));
  });
}

function bindAdminButtons(api) {
  const loginHelper = getNode("#loginHelper");
  const inviteResult = getNode("#inviteResult");
  const adminCreateFamilyResult = getNode("#adminCreateFamilyResult");
  const franciscoMigrationResult = getNode("#franciscoMigrationResult");
  const adminMigrationStatus = getNode("#adminMigrationStatus");
  const createInviteButton = getNode("#createInviteButton");
  const refreshAdminStatsButton = getNode("#refreshAdminStatsButton");
  const adminCreateClientFamilyButton = getNode("#adminCreateClientFamilyButton");
  const prepareFranciscoFamilyButton = getNode("#prepareFranciscoFamilyButton");
  const adminOpenFamilyButton = getNode("#adminOpenFamilyButton");
  const adminReturnToPanelButton = getNode("#adminReturnToPanelButton");
  const restoreFamilyDataButton = getNode("#restoreFamilyDataButton");
  const scanLegacyUidButton = getNode("#scanLegacyUidButton");
  const scanLegacyEmailButton = getNode("#scanLegacyEmailButton");

  createInviteButton?.addEventListener("click", () => {
    api.withButtonBusy(createInviteButton, "Gerando...", () => api.createFamilyInvite().catch((error) => {
      console.error("Erro ao gerar convite:", error);
      if (inviteResult) {
        inviteResult.hidden = false;
        inviteResult.textContent = getErrorText(api, error);
      }
    }));
  });

  refreshAdminStatsButton?.addEventListener("click", () => api.refreshAdminStats());

  adminCreateClientFamilyButton?.addEventListener("click", () => {
    api.withButtonBusy(adminCreateClientFamilyButton, "Criando...", () => api.createAdminClientFamily().catch((error) => {
      console.error("Erro ao criar família/cliente:", error);
      if (adminCreateFamilyResult) {
        adminCreateFamilyResult.hidden = false;
        adminCreateFamilyResult.textContent = getErrorText(api, error);
      }
    }));
  });

  prepareFranciscoFamilyButton?.addEventListener("click", () => {
    api.prepareFranciscoFamilyForMigration().catch((error) => {
      console.error("Erro ao preparar família Francisco:", error);
      if (franciscoMigrationResult) {
        franciscoMigrationResult.hidden = false;
        franciscoMigrationResult.textContent = getErrorText(api, error);
      }
    });
  });

  adminOpenFamilyButton?.addEventListener("click", () => {
    api.openAdminFamilyPreview().catch((error) => {
      console.error("Erro ao abrir família como admin:", error);
      if (loginHelper) loginHelper.textContent = getErrorText(api, error);
    });
  });

  adminReturnToPanelButton?.addEventListener("click", () => {
    api.returnToAdminPanel().catch((error) => {
      console.error("Erro ao voltar ao painel admin:", error);
      if (loginHelper) loginHelper.textContent = getErrorText(api, error);
    });
  });

  restoreFamilyDataButton?.addEventListener("click", () => {
    api.restoreFamilyDataFromBestSource().catch((error) => {
      console.error("Erro ao importar dados familiares:", error);
      if (adminMigrationStatus) adminMigrationStatus.textContent = getErrorText(api, error);
    });
  });

  scanLegacyUidButton?.addEventListener("click", () => {
    api.scanLegacySourceByManualUid().catch((error) => {
      console.error("Erro ao buscar UID legado:", error);
      if (adminMigrationStatus) adminMigrationStatus.textContent = getErrorText(api, error);
    });
  });

  scanLegacyEmailButton?.addEventListener("click", () => {
    api.scanLegacySourceByManualEmail().catch((error) => {
      console.error("Erro ao buscar e-mail legado:", error);
      if (adminMigrationStatus) adminMigrationStatus.textContent = getErrorText(api, error);
    });
  });
}

function bindAdminPanel(api) {
  const panel = getNode("#adminInvitePanel");
  if (!panel) return;

  panel.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-invite]");
    if (copyButton) {
      const text = copyButton.dataset.copyInvite || "";
      try {
        await navigator.clipboard.writeText(text);
        copyButton.textContent = text.startsWith("http") ? "Link copiado" : "Código copiado";
      } catch {
        copyButton.textContent = "Copie manualmente";
      }
      return;
    }

    const selectFamilyButton = event.target.closest("[data-select-admin-family]");
    if (selectFamilyButton) {
      await api.selectAdminFamily(selectFamilyButton.dataset.selectAdminFamily || api.appAdminFamilyId);
      return;
    }

    const openFamilyButton = event.target.closest("[data-open-admin-family]");
    if (openFamilyButton) {
      openFamilyButton.disabled = true;
      openFamilyButton.textContent = "Abrindo...";
      await api.openAdminFamilyPreview(openFamilyButton.dataset.openAdminFamily || api.appAdminFamilyId);
      return;
    }

    const scrollButton = event.target.closest("[data-admin-scroll]");
    if (scrollButton) {
      const target = scrollButton.dataset.adminScroll || "";
      const sections = {
        "create-family": "adminCreateFamilySection",
        clients: "adminFamilyMonitorSection",
        commercial: "adminCommercialDashboard",
        beta: "adminCommercialReadinessSection",
        members: "adminMembersSection",
        invite: "adminInviteSection",
        migration: "adminMigrationSection",
      };
      api.scrollAdminSection(sections[target] || target);
      return;
    }

    const newFamilyResponsibleButton = event.target.closest("[data-fill-new-family-responsible]");
    if (newFamilyResponsibleButton) {
      const input = getNode("#adminNewResponsibleEmailInput");
      if (input) input.value = newFamilyResponsibleButton.dataset.fillNewFamilyResponsible || "";
      api.scrollAdminSection("adminCreateFamilySection");
      getNode("#adminNewFamilyNameInput")?.focus();
      return;
    }

    const inviteEmailButton = event.target.closest("[data-fill-invite-email]");
    if (inviteEmailButton) {
      api.fillAdminInviteEmail(inviteEmailButton.dataset.fillInviteEmail || "");
      return;
    }

    const migrationEmailButton = event.target.closest("[data-fill-migration-email]");
    if (migrationEmailButton) {
      api.fillAdminMigrationEmail(migrationEmailButton.dataset.fillMigrationEmail || "");
      return;
    }

    const linkKnownUserButton = event.target.closest("[data-link-known-user]");
    if (linkKnownUserButton) {
      linkKnownUserButton.disabled = true;
      linkKnownUserButton.textContent = "Autorizando...";
      await api.authorizeKnownUserAsCaregiver(
        linkKnownUserButton.dataset.linkKnownUser || "",
        linkKnownUserButton.dataset.linkKnownEmail || "",
      );
      return;
    }

    const cancelButton = event.target.closest("[data-cancel-invite]");
    if (cancelButton) {
      cancelButton.disabled = true;
      cancelButton.textContent = "Cancelando...";
      await api.cancelFamilyInvite(cancelButton.dataset.cancelInvite || "");
      return;
    }

    const roleButton = event.target.closest("[data-update-member-role]");
    if (roleButton) {
      const uid = roleButton.dataset.updateMemberRole || "";
      const select = panel.querySelector(`[data-member-role-select="${CSS.escape(uid)}"]`);
      roleButton.disabled = true;
      roleButton.textContent = "Salvando...";
      await api.updateFamilyMemberRole(uid, select?.value || api.familyRoleViewer);
      return;
    }

    const removeButton = event.target.closest("[data-remove-member]");
    if (removeButton) {
      removeButton.disabled = true;
      removeButton.textContent = "Removendo...";
      await api.removeFamilyMember(
        removeButton.dataset.removeMember || "",
        removeButton.dataset.removeMemberEmail || "",
      );
    }
  });
}

export function initializeNinouAdminRuntime(api = {}) {
  if (initialized || !api.isGlobalAppAdmin?.()) return { initialized };
  initialized = true;
  initAdminInterfaceMode();
  bindAdminButtons(api);
  bindAdminPanel(api);
  document.body.dataset.adminRuntimeState = "ready";
  return { initialized: true };
}
