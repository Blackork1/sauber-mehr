document.addEventListener('DOMContentLoaded', () => {
  const tabContainers = Array.from(document.querySelectorAll('[data-admin-tabs]'));
  if (tabContainers.length === 0) return;
  const panels = Array.from(document.querySelectorAll('[data-panel]'));
  const params = new URLSearchParams(window.location.search);

  const setActive = (target) => {
    if (!target) return;
    const tabContainer = target.closest('[data-admin-tabs]');
    if (!tabContainer) return;
    const tabs = Array.from(tabContainer.querySelectorAll('.admin-tab'));
    const tabKey = target.dataset.tab;
    const panelGroup = tabContainer.dataset.adminTabs;
    tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.tab === tabKey);
    });
    panels.forEach((panel) => {
      if (panel.dataset.panelGroup !== panelGroup) return;
      panel.classList.toggle('is-hidden', panel.dataset.panel !== tabKey);
    });
  };

  tabContainers.forEach((tabContainer) => {
    const tabs = Array.from(tabContainer.querySelectorAll('.admin-tab'));
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => setActive(tab));
    });
  });

  const requestedTab = params.get('tab');
  const pagesTabContainer = document.querySelector('[data-admin-tabs="pages"]');
  if (pagesTabContainer) {
    const pagesTabs = Array.from(pagesTabContainer.querySelectorAll('.admin-tab'));
    const initialPages = pagesTabs.find((tab) => tab.dataset.tab === requestedTab)
      || pagesTabs.find((tab) => tab.classList.contains('is-active'))
      || pagesTabs[0];
    setActive(initialPages);
  }

  const requestedArticlesTab = params.get('articlesTab');
  const articlesTabContainer = document.querySelector('[data-admin-tabs="articles"]');
  if (articlesTabContainer) {
    const articlesTabs = Array.from(articlesTabContainer.querySelectorAll('.admin-tab'));
    const initialArticles = articlesTabs.find((tab) => tab.dataset.tab === requestedArticlesTab)
      || articlesTabs.find((tab) => tab.classList.contains('is-active'))
      || articlesTabs[0];
    setActive(initialArticles);
  }

  const requestedFilmsTab = params.get('filmsTab');
  const filmsTabContainer = document.querySelector('[data-admin-tabs="films"]');
  if (filmsTabContainer) {
    const filmsTabs = Array.from(filmsTabContainer.querySelectorAll('.admin-tab'));
    const initialFilms = filmsTabs.find((tab) => tab.dataset.tab === requestedFilmsTab)
      || filmsTabs.find((tab) => tab.classList.contains('is-active'))
      || filmsTabs[0];
    setActive(initialFilms);
  }

  const requestedTicketsTab = params.get('ticketsTab');
  const ticketsTabContainer = document.querySelector('[data-admin-tabs="tickets"]');
  if (ticketsTabContainer) {
    const ticketsTabs = Array.from(ticketsTabContainer.querySelectorAll('.admin-tab'));
    const initialTickets = ticketsTabs.find((tab) => tab.dataset.tab === requestedTicketsTab)
      || ticketsTabs.find((tab) => tab.classList.contains('is-active'))
      || ticketsTabs[0];
    setActive(initialTickets);
  }

  const requestedDirectorsTab = params.get('directorsTab');
  const directorsTabContainer = document.querySelector('[data-admin-tabs="directors"]');
  if (directorsTabContainer) {
    const directorTabs = Array.from(directorsTabContainer.querySelectorAll('.admin-tab'));
    const initialDirectors = directorTabs.find((tab) => tab.dataset.tab === requestedDirectorsTab)
      || directorTabs.find((tab) => tab.classList.contains('is-active'))
      || directorTabs[0];
    setActive(initialDirectors);
  }

  const requestedSponsorsTab = params.get('sponsorsTab');
  const sponsorsTabContainer = document.querySelector('[data-admin-tabs="sponsors"]');
  if (sponsorsTabContainer) {
    const sponsorTabs = Array.from(sponsorsTabContainer.querySelectorAll('.admin-tab'));
    const initialSponsors = sponsorTabs.find((tab) => tab.dataset.tab === requestedSponsorsTab)
      || sponsorTabs.find((tab) => tab.classList.contains('is-active'))
      || sponsorTabs[0];
    setActive(initialSponsors);
  }

  const requestedNewsletterTab = params.get('newsletterTab');
  const newsletterTabContainer = document.querySelector('[data-admin-tabs="newsletter"]');
  if (newsletterTabContainer) {
    const newsletterTabs = Array.from(newsletterTabContainer.querySelectorAll('.admin-tab'));
    const initialNewsletter = newsletterTabs.find((tab) => tab.dataset.tab === requestedNewsletterTab)
      || newsletterTabs.find((tab) => tab.classList.contains('is-active'))
      || newsletterTabs[0];
    setActive(initialNewsletter);
  }

  const parseHexColor = (value) => {
    const raw = String(value || '').replace('#', '');
    if (raw.length !== 6) return null;
    const r = Number.parseInt(raw.slice(0, 2), 16);
    const g = Number.parseInt(raw.slice(2, 4), 16);
    const b = Number.parseInt(raw.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) return null;
    return { r, g, b };
  };

  const relativeLuminance = ({ r, g, b }) => {
    const normalize = (channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const [rn, gn, bn] = [normalize(r), normalize(g), normalize(b)];
    return 0.2126 * rn + 0.7152 * gn + 0.0722 * bn;
  };

  const contrastRatio = (colorA, colorB) => {
    const lumA = relativeLuminance(colorA);
    const lumB = relativeLuminance(colorB);
    const lighter = Math.max(lumA, lumB);
    const darker = Math.min(lumA, lumB);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const getAccessibleTextColor = (backgroundHex) => {
    const background = parseHexColor(backgroundHex);
    if (!background) return '#111827';
    const light = parseHexColor('#ffffff');
    const dark = parseHexColor('#111827');
    const lightRatio = contrastRatio(background, light);
    const darkRatio = contrastRatio(background, dark);
    return lightRatio >= darkRatio ? '#ffffff' : '#111827';
  };

  const navItems = Array.from(document.querySelectorAll('[data-nav-group]'));
  const navSections = Array.from(document.querySelectorAll('[data-nav-content]'));
  const setNavActive = (groupKey) => {
    if (!groupKey) return;
    navItems.forEach((item) => {
      const isActive = item.dataset.navGroup === groupKey;
      item.classList.toggle('is-active', isActive);
      const chevron = item.querySelector('.admin-nav__chevron');
      if (chevron) {
        chevron.textContent = isActive ? '‹' : '›';
      }
    });
    navSections.forEach((section) => {
      section.classList.toggle('is-hidden', section.dataset.navContent !== groupKey);
    });
  };

  const requestedNav = params.get('nav');
  const isGalleryRequest = requestedTab === 'gallery';
  const initialGroup = requestedNav || (isGalleryRequest ? 'gallery' : (navItems[0]?.dataset.navGroup || 'pages'));
  setNavActive(initialGroup);

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      setNavActive(item.dataset.navGroup);
    });
  });

  const badgeColorInputs = Array.from(document.querySelectorAll('[data-badge-color-input]'));
  const badgeFields = new Set(
    badgeColorInputs
      .map((input) => input.closest('.admin-field'))
      .filter(Boolean)
  );

  const updateBadgeTextColor = (field) => {
    const hiddenInput = field?.querySelector('[data-badge-text-color]');
    if (!hiddenInput) return;
    const checkedInput = field.querySelector('[data-badge-color-input]:checked');
    const selectedColor = checkedInput?.value || '';
    hiddenInput.value = selectedColor ? getAccessibleTextColor(selectedColor) : '';
  };

  badgeFields.forEach((field) => {
    const inputs = Array.from(field.querySelectorAll('[data-badge-color-input]'));
    inputs.forEach((input) => {
      const preview = input.closest('.admin-badge-option')?.querySelector('.admin-badge-option__preview');
      if (preview) {
        const textColor = getAccessibleTextColor(input.value);
        preview.style.setProperty('--badge-text-color', textColor);
      }
      input.addEventListener('change', () => updateBadgeTextColor(field));
    });
    updateBadgeTextColor(field);
  });

  const articleSelect = document.querySelector('[data-article-select]');
  const articleSelectForm = document.querySelector('[data-article-select-form]');
  if (articleSelect && articleSelectForm) {
    articleSelect.addEventListener('change', () => {
      articleSelectForm.submit();
    });
  }

  const filmSelect = document.querySelector('[data-film-select]');
  const filmSelectForm = document.querySelector('[data-film-select-form]');
  if (filmSelect && filmSelectForm) {
    filmSelect.addEventListener('change', () => {
      filmSelectForm.submit();
    });
  }

  const directorNameInputs = Array.from(document.querySelectorAll('[data-director-name]'));
  directorNameInputs.forEach((input) => {
    const form = input.closest('form');
    const locale = input.dataset.directorLocale;
    const titleInput = form?.querySelector(`[data-director-title][data-director-locale="${locale}"]`);
    const updateTitle = () => {
      if (!titleInput) return;
      const nameValue = input.value.trim();
      titleInput.value = nameValue ? `Regie - ${nameValue}` : '';
    };
    input.addEventListener('input', updateTitle);
    updateTitle();
  });

  const directorDeleteForm = document.querySelector('[data-director-delete-form]');
  const directorDeleteSelect = document.querySelector('[data-director-delete-select]');
  if (directorDeleteForm && directorDeleteSelect) {
    const updateAction = () => {
      const id = directorDeleteSelect.value;
      directorDeleteForm.action = id ? `/adminbackend/directors/${id}/delete` : '/adminbackend/directors/0/delete';
    };
    directorDeleteSelect.addEventListener('change', updateAction);
    directorDeleteForm.addEventListener('submit', (event) => {
      if (!directorDeleteSelect.value) {
        event.preventDefault();
      }
    });
    updateAction();
  }

  const persistKey = 'adminFormDrafts';
  const lastFormKey = 'adminLastFormKey';
  const forms = Array.from(document.querySelectorAll('.admin-content__section form'));

  const getStoredDrafts = () => {
    try {
      return JSON.parse(localStorage.getItem(persistKey) || '{}');
    } catch {
      return {};
    }
  };

  const storeDrafts = (drafts) => {
    localStorage.setItem(persistKey, JSON.stringify(drafts));
  };

  const serializeForm = (form) => {
    const data = {};
    const fields = Array.from(form.querySelectorAll('input, select, textarea'))
      .filter((field) => field.name && !field.disabled && field.type !== 'file');
    const fieldCounts = fields.reduce((acc, field) => {
      acc[field.name] = (acc[field.name] || 0) + 1;
      return acc;
    }, {});

    fields.forEach((field) => {
      if (field.type === 'checkbox') {
        if (fieldCounts[field.name] > 1) {
          if (!data[field.name]) data[field.name] = [];
          if (field.checked) data[field.name].push(field.value || 'on');
        } else {
          data[field.name] = field.checked;
        }
        return;
      }
      if (field.type === 'radio') {
        if (field.checked) data[field.name] = field.value;
        return;
      }
      if (field instanceof HTMLSelectElement && field.multiple) {
        data[field.name] = Array.from(field.selectedOptions).map((option) => option.value);
        return;
      }
      data[field.name] = field.value;
    });

    return data;
  };

  const restoreForm = (form, data) => {
    if (!data) return;
    const fields = Array.from(form.querySelectorAll('input, select, textarea'))
      .filter((field) => field.name && !field.disabled && field.type !== 'file');
    const fieldCounts = fields.reduce((acc, field) => {
      acc[field.name] = (acc[field.name] || 0) + 1;
      return acc;
    }, {});

    fields.forEach((field) => {
      if (!(field.name in data)) {
        if (field.type === 'checkbox' && fieldCounts[field.name] > 1) {
          field.checked = false;
        }
        return;
      }
      const value = data[field.name];
      if (field.type === 'checkbox') {
        if (fieldCounts[field.name] > 1) {
          field.checked = Array.isArray(value) ? value.includes(field.value || 'on') : false;
        } else {
          field.checked = Boolean(value);
        }
        return;
      }
      if (field.type === 'radio') {
        field.checked = field.value === value;
        return;
      }
      if (field instanceof HTMLSelectElement && field.multiple) {
        const selected = Array.isArray(value) ? value : [];
        Array.from(field.options).forEach((option) => {
          option.selected = selected.includes(option.value);
        });
        return;
      }
      field.value = value;
    });
  };

  const getFormKey = (form) => {
    const method = (form.getAttribute('method') || form.method || 'get').toLowerCase();
    const action = form.getAttribute('action') || form.action || window.location.pathname;
    return `${method}:${action}`;
  };

  forms.forEach((form) => {
    form.addEventListener('submit', () => {
      const drafts = getStoredDrafts();
      const key = getFormKey(form);
      drafts[key] = serializeForm(form);
      storeDrafts(drafts);
      localStorage.setItem(lastFormKey, key);
    });
  });

  const hasSuccess = params.get('saved') === '1';
  if (hasSuccess) {
    localStorage.removeItem(persistKey);
    localStorage.removeItem(lastFormKey);
  } else {
    const hasError = params.has('error')
      || params.has('missing')
      || params.has('missingFields')
      || params.has('newsletterError')
      || params.has('newsletterErrors');
    if (hasError) {
      const drafts = getStoredDrafts();
      const key = localStorage.getItem(lastFormKey);
      const targetForm = key
        ? forms.find((form) => getFormKey(form) === key)
        : null;
      if (targetForm) {
        restoreForm(targetForm, drafts[key]);
      }
    }
  }

  const articleModal = document.querySelector('[data-article-modal]');
  if (articleModal) {
    const modalTitle = articleModal.querySelector('[data-article-modal-title]');
    const modalText = articleModal.querySelector('[data-article-modal-text]');
    const modalForm = articleModal.querySelector('[data-article-modal-form]');
    const modalGroupInput = articleModal.querySelector('[data-article-modal-group]');
    const modalActionInput = articleModal.querySelector('[data-article-modal-action]');
    const modalVisibilityInput = articleModal.querySelector('[data-article-modal-visibility]');
    const modalAll = articleModal.querySelector('[data-article-modal-all]');
    const modalAllLabel = articleModal.querySelector('[data-article-modal-all-label]');
    const langCheckboxes = Array.from(articleModal.querySelectorAll('[data-article-modal-lang]'));
    const closeButtons = Array.from(articleModal.querySelectorAll('[data-article-modal-close]'));
    let activeTrigger = null;

    const syncAllToggle = () => {
      const enabled = langCheckboxes.filter((checkbox) => !checkbox.disabled);
      const allChecked = enabled.length > 0 && enabled.every((checkbox) => checkbox.checked);
      if (modalAll) modalAll.checked = allChecked;
    };

    const setLanguageAvailability = (available) => {
      langCheckboxes.forEach((checkbox) => {
        const isAvailable = available.has(checkbox.value);
        checkbox.disabled = !isAvailable;
        checkbox.checked = isAvailable;
      });
      syncAllToggle();
    };

    const openModal = ({ groupId, action, visibility, availableLanguages }) => {
      activeTrigger = { action };
      if (modalGroupInput) modalGroupInput.value = groupId;
      if (modalActionInput) modalActionInput.value = action;
      if (modalVisibilityInput) modalVisibilityInput.value = visibility || '';
      const available = new Set(availableLanguages);
      setLanguageAvailability(available);

      if (action === 'delete') {
        if (modalTitle) modalTitle.textContent = 'Artikel löschen';
        if (modalText) modalText.textContent = 'Welche Artikel sollen gelöscht werden?';
        if (modalAllLabel) modalAllLabel.textContent = 'Alle Artikel löschen';
      } else {
        const isShowing = visibility === 'show';
        if (modalTitle) modalTitle.textContent = isShowing ? 'Artikel anzeigen' : 'Artikel ausblenden';
        if (modalText) {
          modalText.textContent = isShowing
            ? 'Welche Artikel sollen eingeblendet werden?'
            : 'Welche Artikel sollen ausgeblendet werden?';
        }
        if (modalAllLabel) {
          modalAllLabel.textContent = isShowing ? 'Alle Artikel einblenden' : 'Alle Artikel ausblenden';
        }
      }

      articleModal.classList.remove('is-hidden');
    };

    const closeModal = () => {
      articleModal.classList.add('is-hidden');
      activeTrigger = null;
      if (modalForm) modalForm.reset();
    };

    closeButtons.forEach((button) => {
      button.addEventListener('click', closeModal);
    });

    if (modalAll) {
      modalAll.addEventListener('change', () => {
        langCheckboxes.forEach((checkbox) => {
          if (!checkbox.disabled) checkbox.checked = modalAll.checked;
        });
      });
    }

    langCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', syncAllToggle);
    });

    const actionTriggers = Array.from(document.querySelectorAll('[data-article-action]'));
    actionTriggers.forEach((trigger) => {
      if (trigger.tagName === 'INPUT') {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          const action = trigger.dataset.articleAction;
          const groupId = trigger.dataset.articleGroupId;
          const visible = trigger.checked ? 'hide' : 'show';
          const languages = (trigger.dataset.articleLanguages || '').split(',').filter(Boolean);
          openModal({ groupId, action, visibility: visible, availableLanguages: languages });
        });
      } else {
        trigger.addEventListener('click', () => {
          const action = trigger.dataset.articleAction;
          const groupId = trigger.dataset.articleGroupId;
          const languages = (trigger.dataset.articleLanguages || '').split(',').filter(Boolean);
          openModal({ groupId, action, visibility: '', availableLanguages: languages });
        });
      }
    });
  }

  const filmModal = document.querySelector('[data-film-modal]');
  if (filmModal) {
    const modalTitle = filmModal.querySelector('[data-film-modal-title]');
    const modalText = filmModal.querySelector('[data-film-modal-text]');
    const modalForm = filmModal.querySelector('[data-film-modal-form]');
    const modalGroupInput = filmModal.querySelector('[data-film-modal-group]');
    const modalActionInput = filmModal.querySelector('[data-film-modal-action]');
    const modalVisibilityInput = filmModal.querySelector('[data-film-modal-visibility]');
    const modalAll = filmModal.querySelector('[data-film-modal-all]');
    const modalAllLabel = filmModal.querySelector('[data-film-modal-all-label]');
    const langCheckboxes = Array.from(filmModal.querySelectorAll('[data-film-modal-lang]'));
    const closeButtons = Array.from(filmModal.querySelectorAll('[data-film-modal-close]'));

    const syncAllToggle = () => {
      const enabled = langCheckboxes.filter((checkbox) => !checkbox.disabled);
      const allChecked = enabled.length > 0 && enabled.every((checkbox) => checkbox.checked);
      if (modalAll) modalAll.checked = allChecked;
    };

    const setLanguageAvailability = (available) => {
      langCheckboxes.forEach((checkbox) => {
        const isAvailable = available.has(checkbox.value);
        checkbox.disabled = !isAvailable;
        checkbox.checked = isAvailable;
      });
      syncAllToggle();
    };

    const openModal = ({ groupId, action, visibility, availableLanguages }) => {
      if (modalGroupInput) modalGroupInput.value = groupId;
      if (modalActionInput) modalActionInput.value = action;
      if (modalVisibilityInput) modalVisibilityInput.value = visibility || '';
      const available = new Set(availableLanguages);
      setLanguageAvailability(available);

      if (action === 'delete') {
        if (modalTitle) modalTitle.textContent = 'Film löschen';
        if (modalText) modalText.textContent = 'Welche Filme sollen gelöscht werden?';
        if (modalAllLabel) modalAllLabel.textContent = 'Alle Filme löschen';
      } else {
        const isShowing = visibility === 'show';
        if (modalTitle) modalTitle.textContent = isShowing ? 'Film anzeigen' : 'Film ausblenden';
        if (modalText) {
          modalText.textContent = isShowing
            ? 'Welche Filme sollen eingeblendet werden?'
            : 'Welche Filme sollen ausgeblendet werden?';
        }
        if (modalAllLabel) {
          modalAllLabel.textContent = isShowing ? 'Alle Filme einblenden' : 'Alle Filme ausblenden';
        }
      }

      filmModal.classList.remove('is-hidden');
    };

    const closeModal = () => {
      filmModal.classList.add('is-hidden');
      if (modalForm) modalForm.reset();
    };

    closeButtons.forEach((button) => {
      button.addEventListener('click', closeModal);
    });

    if (modalAll) {
      modalAll.addEventListener('change', () => {
        langCheckboxes.forEach((checkbox) => {
          if (!checkbox.disabled) checkbox.checked = modalAll.checked;
        });
      });
    }

    langCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', syncAllToggle);
    });

    const actionTriggers = Array.from(document.querySelectorAll('[data-film-action]'));
    actionTriggers.forEach((trigger) => {
      if (trigger.tagName === 'INPUT') {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          const action = trigger.dataset.filmAction;
          const groupId = trigger.dataset.filmGroupId;
          const visible = trigger.checked ? 'hide' : 'show';
          const languages = (trigger.dataset.filmLanguages || '').split(',').filter(Boolean);
          openModal({ groupId, action, visibility: visible, availableLanguages: languages });
        });
      } else {
        trigger.addEventListener('click', () => {
          const action = trigger.dataset.filmAction;
          const groupId = trigger.dataset.filmGroupId;
          const languages = (trigger.dataset.filmLanguages || '').split(',').filter(Boolean);
          openModal({ groupId, action, visibility: '', availableLanguages: languages });
        });
      }
    });
  }

  const ticketFilter = document.querySelector('[data-ticket-filter]');
  if (ticketFilter) {
    const ticketGrid = ticketFilter.closest('.admin-panel__section')?.querySelector('.admin-ticket-grid');
    const ticketCards = Array.from(ticketGrid?.querySelectorAll('[data-ticket-type]') || []);
    const applyFilter = () => {
      const value = ticketFilter.value;
      ticketCards.forEach((card) => {
        const type = card.dataset.ticketType;
        const show = value === 'all' || value === type;
        card.classList.toggle('is-hidden', !show);
      });
    };
    ticketFilter.addEventListener('change', applyFilter);
    applyFilter();
  }

  const ticketOrderFilters = document.querySelector('[data-ticket-order-filters]');
  if (ticketOrderFilters) {
    const filterButtons = Array.from(ticketOrderFilters.querySelectorAll('[data-ticket-order-filter]'));
    const orderRows = Array.from(document.querySelectorAll('[data-ticket-order-row]'));
    const applyOrderFilter = (value) => {
      orderRows.forEach((row) => {
        const type = row.dataset.ticketOrderType;
        const kinoQuantity = Number.parseInt(row.dataset.ticketOrderKinoQuantity || '0', 10);
        const kinoMatch = value === 'kino' && (type === 'kino' || (type === 'combo' && kinoQuantity > 1));
        const show = value === 'all' || value === type || kinoMatch;
        row.classList.toggle('is-hidden', !show);
      });
    };
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.ticketOrderFilter;
        filterButtons.forEach((item) => item.classList.toggle('is-active', item === button));
        applyOrderFilter(value);
      });
    });
    const activeButton = filterButtons.find((button) => button.classList.contains('is-active')) || filterButtons[0];
    if (activeButton) applyOrderFilter(activeButton.dataset.ticketOrderFilter || 'all');
  }

  const ticketModal = document.querySelector('[data-ticket-modal]');
  if (ticketModal) {
    const modalTitle = ticketModal.querySelector('[data-ticket-modal-title]');
    const modalText = ticketModal.querySelector('[data-ticket-modal-text]');
    const modalForm = ticketModal.querySelector('[data-ticket-modal-form]');
    const modalGroupInput = ticketModal.querySelector('[data-ticket-modal-group]');
    const modalActionInput = ticketModal.querySelector('[data-ticket-modal-action]');
    const modalVisibilityInput = ticketModal.querySelector('[data-ticket-modal-visibility]');
    const modalAll = ticketModal.querySelector('[data-ticket-modal-all]');
    const modalAllLabel = ticketModal.querySelector('[data-ticket-modal-all-label]');
    const langCheckboxes = Array.from(ticketModal.querySelectorAll('[data-ticket-modal-lang]'));
    const closeButtons = Array.from(ticketModal.querySelectorAll('[data-ticket-modal-close]'));

    const syncAllToggle = () => {
      const enabled = langCheckboxes.filter((checkbox) => !checkbox.disabled);
      const allChecked = enabled.length > 0 && enabled.every((checkbox) => checkbox.checked);
      if (modalAll) modalAll.checked = allChecked;
    };

    const setLanguageAvailability = (available) => {
      langCheckboxes.forEach((checkbox) => {
        const isAvailable = available.has(checkbox.value);
        checkbox.disabled = !isAvailable;
        checkbox.checked = isAvailable;
      });
      syncAllToggle();
    };

    const openModal = ({ groupId, action, visibility, availableLanguages }) => {
      if (modalGroupInput) modalGroupInput.value = groupId;
      if (modalActionInput) modalActionInput.value = action;
      if (modalVisibilityInput) modalVisibilityInput.value = visibility || '';
      const available = new Set(availableLanguages);
      setLanguageAvailability(available);

      if (action === 'delete') {
        if (modalTitle) modalTitle.textContent = 'Ticket löschen';
        if (modalText) modalText.textContent = 'Welche Tickets sollen gelöscht werden?';
        if (modalAllLabel) modalAllLabel.textContent = 'Alle Tickets löschen';
      } else {
        const isShowing = visibility === 'show';
        if (modalTitle) modalTitle.textContent = isShowing ? 'Ticket anzeigen' : 'Ticket ausblenden';
        if (modalText) {
          modalText.textContent = isShowing
            ? 'Welche Tickets sollen eingeblendet werden?'
            : 'Welche Tickets sollen ausgeblendet werden?';
        }
        if (modalAllLabel) {
          modalAllLabel.textContent = isShowing ? 'Alle Tickets einblenden' : 'Alle Tickets ausblenden';
        }
      }

      ticketModal.classList.remove('is-hidden');
    };

    const closeModal = () => {
      ticketModal.classList.add('is-hidden');
      if (modalForm) modalForm.reset();
    };

    closeButtons.forEach((button) => {
      button.addEventListener('click', closeModal);
    });

    if (modalAll) {
      modalAll.addEventListener('change', () => {
        langCheckboxes.forEach((checkbox) => {
          if (!checkbox.disabled) checkbox.checked = modalAll.checked;
        });
      });
    }

    langCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', syncAllToggle);
    });

    const actionTriggers = Array.from(document.querySelectorAll('[data-ticket-action]'));
    actionTriggers.forEach((trigger) => {
      if (trigger.tagName === 'INPUT') {
        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          const action = trigger.dataset.ticketAction;
          const groupId = trigger.dataset.ticketGroupId;
          const visible = trigger.checked ? 'hide' : 'show';
          const languages = (trigger.dataset.ticketLanguages || '').split(',').filter(Boolean);
          openModal({ groupId, action, visibility: visible, availableLanguages: languages });
        });
      } else {
        trigger.addEventListener('click', () => {
          const action = trigger.dataset.ticketAction;
          const groupId = trigger.dataset.ticketGroupId;
          const languages = (trigger.dataset.ticketLanguages || '').split(',').filter(Boolean);
          openModal({ groupId, action, visibility: '', availableLanguages: languages });
        });
      }
    });
  }

  const uploadOverlay = document.querySelector('[data-upload-overlay]');
  const uploadPercent = uploadOverlay?.querySelector('[data-upload-percent]');
  const uploadBar = uploadOverlay?.querySelector('[data-upload-bar]');
  const uploadForms = Array.from(document.querySelectorAll('form[enctype="multipart/form-data"]'));
  const formatPercent = (value) => `${Math.min(100, Math.max(0, Math.round(value)))}%`;
  const updateProgress = (value) => {
    if (uploadPercent) uploadPercent.textContent = formatPercent(value);
    if (uploadBar) uploadBar.style.width = `${Math.min(100, Math.max(0, value))}%`;
  };
  const showOverlay = () => {
    if (!uploadOverlay) return;
    updateProgress(0);
    uploadOverlay.classList.remove('is-hidden');
  };
  const hideOverlay = () => {
    if (!uploadOverlay) return;
    uploadOverlay.classList.add('is-hidden');
  };

  uploadForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      if (!uploadOverlay) return;
      const fileInputs = Array.from(form.querySelectorAll('input[type="file"]'));
      const hasFile = fileInputs.some((input) => input.files && input.files.length > 0);
      if (!hasFile) return;
      if (form.dataset.uploadSubmitting === 'true') {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      form.dataset.uploadSubmitting = 'true';
      showOverlay();
      const formData = new FormData(form);
      const xhr = new XMLHttpRequest();
      xhr.open(form.method || 'POST', form.action);
      xhr.upload.addEventListener('progress', (eventProgress) => {
        if (eventProgress.lengthComputable) {
          const percent = (eventProgress.loaded / eventProgress.total) * 90;
          updateProgress(percent);
        }
      });
      const handleFailure = () => {
        form.dataset.uploadSubmitting = 'false';
        hideOverlay();
        window.alert('Der Upload konnte nicht abgeschlossen werden. Bitte erneut versuchen.');
      };
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 400) {
          updateProgress(100);
          const targetUrl = xhr.responseURL || form.action;
          window.location.assign(targetUrl);
        } else {
          handleFailure();
        }
      });
      xhr.addEventListener('error', handleFailure);
      xhr.addEventListener('abort', handleFailure);
      xhr.send(formData);
    });
  });

  // const visibilityInputs = Array.from(document.querySelectorAll('[data-gallery-visibility]'));
  // visibilityInputs.forEach((input) => {
  //   input.addEventListener('change', () => {
  //     input.dataset.galleryVisibilityChanged = 'true';
  //   });
  // });

  const galleryTabs = document.querySelector('[data-gallery-tabs]');
  const galleryPanels = Array.from(document.querySelectorAll('[data-gallery-panel]'));
  if (galleryTabs && galleryPanels.length > 0) {
    const galleryButtons = Array.from(galleryTabs.querySelectorAll('[data-gallery-tab]'));

    const setGalleryActive = (target) => {
      if (!target) return;
      const tabKey = target.dataset.galleryTab;
      galleryButtons.forEach((button) => {
        button.classList.toggle('is-active', button.dataset.galleryTab === tabKey);
      });
      galleryPanels.forEach((panel) => {
        panel.classList.toggle('is-hidden', panel.dataset.galleryPanel !== tabKey);
      });
    };

    galleryButtons.forEach((button) => {
      button.addEventListener('click', () => setGalleryActive(button));
    });

    const initialGallery = galleryButtons.find((button) => button.classList.contains('is-active')) || galleryButtons[0];
    setGalleryActive(initialGallery);
  }

  const gallerySortables = Array.from(document.querySelectorAll('[data-gallery-sortable]'));
  gallerySortables.forEach((grid) => {
    let draggingItem = null;

    const getItems = () => Array.from(grid.querySelectorAll('[data-gallery-sort-item]'));
    const updateOrderInput = () => {
      const items = getItems();
      const visibleItems = items.filter((item) => item.dataset.galleryVisible === 'true');
      const hiddenItems = items.filter((item) => item.dataset.galleryVisible !== 'true');
      const orderedItems = [...visibleItems, ...hiddenItems];
      orderedItems.forEach((item) => {
        grid.appendChild(item);
      });
      const form = grid.closest('[data-gallery-sort-form]') || grid.parentElement?.querySelector('[data-gallery-sort-form]');
      const input = form?.querySelector('[data-gallery-sort-input]');
      if (!input) return;
      input.value = JSON.stringify(orderedItems.map((item) => item.dataset.galleryId));
    };
    grid.updateGalleryOrder = updateOrderInput;

    const handleDragStart = (event) => {
      const item = event.currentTarget;
      if (!item) return;
      draggingItem = item;
      item.classList.add('is-dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    };

    const handleDragEnd = () => {
      if (draggingItem) {
        draggingItem.classList.remove('is-dragging');
      }
      draggingItem = null;
      updateOrderInput();
    };

    const handleDragOver = (event) => {
      event.preventDefault();
      if (!draggingItem) return;
      const target = event.target.closest('[data-gallery-sort-item]');
      if (!target || target === draggingItem) return;
      const rect = target.getBoundingClientRect();
      const shouldInsertBefore = event.clientY < rect.top + rect.height / 2;
      if (shouldInsertBefore) {
        grid.insertBefore(draggingItem, target);
      } else {
        grid.insertBefore(draggingItem, target.nextSibling);
      }
    };

    getItems().forEach((item) => {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragend', handleDragEnd);
    });
    grid.addEventListener('dragover', handleDragOver);
    updateOrderInput();
  });

  const visibilityInputs = Array.from(document.querySelectorAll('[data-gallery-visibility]'));
  visibilityInputs.forEach((input) => {
    input.addEventListener('change', () => {
      input.dataset.galleryVisibilityChanged = 'true';
      const card = input.closest('[data-gallery-sort-item]');
      if (card) {
        card.dataset.galleryVisible = input.checked ? 'true' : 'false';
        const grid = card.closest('[data-gallery-sortable]');
        grid?.updateGalleryOrder?.();
      }
    });
  });

  const linkHelper = document.createElement('div');
  linkHelper.className = 'admin-link-helper is-hidden';
  linkHelper.innerHTML = `
    <div class="admin-link-helper__header">Element hinzufügen</div>
    <div class="admin-link-helper__menu" data-inline-menu>
      <button type="button" class="admin-link-helper__option" data-inline-type="link">Link</button>
      <button type="button" class="admin-link-helper__option" data-inline-type="strong">Strong</button>
      <button type="button" class="admin-link-helper__option" data-inline-type="em">Em</button>
      <button type="button" class="admin-link-helper__option" data-inline-type="h2">H2</button>
      <button type="button" class="admin-link-helper__option" data-inline-type="h3">H3</button>
    </div>
    <div class="admin-link-helper__submenu is-hidden" data-inline-submenu>
      <div class="admin-link-helper__subheader" data-inline-title>Link hinzufügen</div>
      <label class="admin-link-helper__field" data-inline-text-field>
        <span data-inline-text-label>Linktext</span>
        <input type="text" data-inline-text placeholder="z.B. Tickets">
      </label>
      <label class="admin-link-helper__field" data-inline-url-field>
        <span>Link</span>
        <input type="text" data-inline-url placeholder="z.B. /ticket">
      </label>
      <label class="admin-link-helper__field is-hidden" data-inline-class-field>
        <span>CSS-Klasse</span>
        <input type="text" data-inline-class placeholder="z.B. highlight">
      </label>
      <div class="admin-link-helper__actions">
        <button type="button" class="admin-link-helper__back" data-inline-back>Zurück</button>
        <button type="button" class="admin-link-helper__button" data-inline-insert>Einfügen</button>
      </div>
    </div>
  `;
  document.body.appendChild(linkHelper);

  const inlineMenu = linkHelper.querySelector('[data-inline-menu]');
  const inlineSubmenu = linkHelper.querySelector('[data-inline-submenu]');
  const inlineTitle = linkHelper.querySelector('[data-inline-title]');
  const inlineTextLabel = linkHelper.querySelector('[data-inline-text-label]');
  const inlineTextInput = linkHelper.querySelector('[data-inline-text]');
  const inlineUrlField = linkHelper.querySelector('[data-inline-url-field]');
  const inlineUrlInput = linkHelper.querySelector('[data-inline-url]');
  const inlineClassField = linkHelper.querySelector('[data-inline-class-field]');
  const inlineClassInput = linkHelper.querySelector('[data-inline-class]');
  const inlineBackButton = linkHelper.querySelector('[data-inline-back]');
  const inlineInsertButton = linkHelper.querySelector('[data-inline-insert]');
  const inlineTypeButtons = Array.from(linkHelper.querySelectorAll('[data-inline-type]'));
  const inlineTypes = {
    link: { title: 'Link hinzufügen', textLabel: 'Linktext', textPlaceholder: 'z.B. Tickets', requiresUrl: true },
    strong: { title: 'Strong hinzufügen', textLabel: 'Text', textPlaceholder: 'z.B. Wichtig', tag: 'strong' },
    em: { title: 'Em hinzufügen', textLabel: 'Text', textPlaceholder: 'z.B. Hinweis', tag: 'em' },
    h2: { title: 'H2 hinzufügen', textLabel: 'Text', textPlaceholder: 'z.B. Überschrift', tag: 'h2' },
    h3: { title: 'H3 hinzufügen', textLabel: 'Text', textPlaceholder: 'z.B. Untertitel', tag: 'h3' }
  };
  let activeInlineType = null;
  let activeLinkField = null;
  let activeSelection = { start: 0, end: 0 };

  const isLinkableField = (field) => {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return false;
    if (linkHelper.contains(field)) return false;
    if (field.disabled || field.readOnly) return false;
    if (field instanceof HTMLTextAreaElement) return true;
    const type = (field.type || 'text').toLowerCase();
    const allowedTypes = ['text', 'search', 'url', 'email', 'tel', 'password'];
    return allowedTypes.includes(type);
  };

  const updateSelection = () => {
    if (!activeLinkField) return;
    const start = Number.isFinite(activeLinkField.selectionStart)
      ? activeLinkField.selectionStart
      : activeLinkField.value.length;
    const end = Number.isFinite(activeLinkField.selectionEnd)
      ? activeLinkField.selectionEnd
      : start;
    activeSelection = { start, end };
  };

  const updateInsertState = () => {
    if (!inlineInsertButton) return;
    const typeConfig = activeInlineType ? inlineTypes[activeInlineType] : null;
    const hasText = Boolean(inlineTextInput?.value.trim());
    const hasUrl = Boolean(inlineUrlInput?.value.trim());
    const requiresUrl = Boolean(typeConfig?.requiresUrl);
    inlineInsertButton.disabled = !hasText || (requiresUrl && !hasUrl);
  };

  const resetInlineInputs = () => {
    if (inlineTextInput) inlineTextInput.value = '';
    if (inlineUrlInput) inlineUrlInput.value = '';
    if (inlineClassInput) inlineClassInput.value = '';
  };

  const showInlineMenu = () => {
    activeInlineType = null;
    inlineMenu?.classList.remove('is-hidden');
    inlineSubmenu?.classList.add('is-hidden');
    resetInlineInputs();
    updateInsertState();
  };

  const showInlineSubmenu = (type) => {
    const typeConfig = inlineTypes[type];
    if (!typeConfig) return;
    activeInlineType = type;
    inlineMenu?.classList.add('is-hidden');
    inlineSubmenu?.classList.remove('is-hidden');
    if (inlineTitle) inlineTitle.textContent = typeConfig.title;
    if (inlineTextLabel) inlineTextLabel.textContent = typeConfig.textLabel;
    if (inlineTextInput) {
      inlineTextInput.placeholder = typeConfig.textPlaceholder;
      inlineTextInput.value = '';
    }
    if (inlineUrlField) {
      inlineUrlField.classList.toggle('is-hidden', !typeConfig.requiresUrl);
    }
    if (inlineClassField) {
      inlineClassField.classList.toggle('is-hidden', Boolean(typeConfig.requiresUrl));
    }
    if (inlineUrlInput) inlineUrlInput.value = '';
    if (inlineClassInput) inlineClassInput.value = '';
    updateInsertState();
    inlineTextInput?.focus();
  };

  const positionHelper = (field) => {
    if (!field) return;
    const rect = field.getBoundingClientRect();
    linkHelper.classList.remove('is-hidden');
    const helperWidth = linkHelper.offsetWidth;
    const helperHeight = linkHelper.offsetHeight;
    const spaceLeft = rect.left - helperWidth - 12;
    const left = spaceLeft > 8 ? rect.left - helperWidth - 12 : rect.right + 12;
    const top = Math.max(8, rect.top + window.scrollY - (helperHeight - rect.height) / 2);
    linkHelper.style.left = `${left + window.scrollX}px`;
    linkHelper.style.top = `${top}px`;
  };

  const showLinkHelper = (field) => {
    if (!isLinkableField(field)) return;
    activeLinkField = field;
    updateSelection();
    showInlineMenu();
    positionHelper(field);
  };

  const hideLinkHelper = () => {
    linkHelper.classList.add('is-hidden');
  };

  document.addEventListener('focusin', (event) => {
    const target = event.target;
    if (isLinkableField(target)) {
      showLinkHelper(target);
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (isLinkableField(target)) {
      showLinkHelper(target);
      return;
    }
    if (!linkHelper.contains(target)) {
      hideLinkHelper();
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Escape') {
      hideLinkHelper();
    }
    if (event.target === activeLinkField) {
      updateSelection();
    }
  });

  document.addEventListener('mouseup', (event) => {
    if (event.target === activeLinkField) {
      updateSelection();
    }
  });

  inlineTextInput?.addEventListener('input', updateInsertState);
  inlineUrlInput?.addEventListener('input', updateInsertState);
  inlineTypeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const { inlineType } = button.dataset;
      if (!inlineType) return;
      showInlineSubmenu(inlineType);
      updateSelection();
    });
  });
  inlineBackButton?.addEventListener('click', () => {
    showInlineMenu();
  });
  updateInsertState();

  inlineInsertButton?.addEventListener('click', () => {
    if (!activeLinkField) return;
    const typeConfig = activeInlineType ? inlineTypes[activeInlineType] : null;
    if (!typeConfig) return;
    const inlineText = inlineTextInput?.value.trim() || '';
    const inlineUrl = inlineUrlInput?.value.trim() || '';
    const inlineClass = inlineClassInput?.value.trim() || '';
    if (!inlineText || (typeConfig.requiresUrl && !inlineUrl)) return;
    updateSelection();
    const before = activeLinkField.value.slice(0, activeSelection.start);
    const after = activeLinkField.value.slice(activeSelection.end);
    const classAttribute = inlineClass ? ` class="${inlineClass}"` : '';
    const markup = typeConfig.requiresUrl
      ? `<a class="admin-inline-link" href="${inlineUrl}">${inlineText}</a>`
      : `<${typeConfig.tag}${classAttribute}>${inlineText}</${typeConfig.tag}>`;
    activeLinkField.value = `${before}${markup}${after}`;
    const nextCursor = activeSelection.start + markup.length;
    activeLinkField.setSelectionRange(nextCursor, nextCursor);
    activeLinkField.dispatchEvent(new Event('input', { bubbles: true }));
    activeLinkField.focus();
    showInlineMenu();
    updateInsertState();
  });

  window.addEventListener('scroll', () => {
    if (!activeLinkField || linkHelper.classList.contains('is-hidden')) return;
    positionHelper(activeLinkField);
  }, true);

  window.addEventListener('resize', () => {
    if (!activeLinkField || linkHelper.classList.contains('is-hidden')) return;
    positionHelper(activeLinkField);
  });

  const gallerySelector = document.querySelector('[data-gallery-selector]');
  if (!gallerySelector) return;
  const selectorTabs = Array.from(gallerySelector.querySelectorAll('[data-gallery-selector-tab]'));
  const selectorPanels = Array.from(gallerySelector.querySelectorAll('[data-gallery-selector-panel]'));
  const selectorItems = Array.from(gallerySelector.querySelectorAll('[data-gallery-item]'));
  const mediaPickers = Array.from(document.querySelectorAll('[data-gallery-picker]'));
  let activePicker = null;

  const altDatasetKey = (locale) => {
    if (locale === 'en') return 'galleryItemAltEn';
    return 'galleryItemAltDe';
  };

  const getPickerSelections = (picker) => {
    const input = picker.querySelector('[data-gallery-multi-input]');
    if (!input?.value) return [];
    try {
      const parsed = JSON.parse(input.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const setAltInputs = (picker, altDe, altEn, { force = false } = {}) => {
    const altDeInput = picker.querySelector('[data-gallery-alt-input="de"]');
    const altEnInput = picker.querySelector('[data-gallery-alt-input="en"]');
    if (altDeInput && (force || !altDeInput.value)) {
      altDeInput.value = altDe || altDeInput.value || '';
    }
    if (altEnInput && (force || !altEnInput.value)) {
      altEnInput.value = altEn || altEnInput.value || '';
    }
  };

  const updateAltVisibility = (picker) => {
    const altFields = picker.querySelector('[data-alt-fields]');
    if (!altFields) return;
    const uploadInput = picker.querySelector('[data-upload-input]');
    const uploadSelected = Boolean(uploadInput?.files?.length);
    const gallerySelected = Array.from(picker.querySelectorAll('[data-gallery-input]'))
      .some((input) => Boolean(input.value));
    const currentSelected = Boolean(picker.querySelector('[data-gallery-current]')?.value);
    const shouldShow = uploadSelected || gallerySelected || currentSelected;
    altFields.toggleAttribute('hidden', !shouldShow);
  };

  const stripExtension = (value) => {
    if (!value) return '';
    return value.replace(/\.[^/.]+$/, '');
  };
  const truncateText = (value, maxLength = 30) => {
    if (!value) return '';
    const text = String(value);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}…`;
  };

  let mediaPreview = null;
  let mediaPreviewImage = null;
  let mediaPreviewVideo = null;

  const ensureMediaPreview = () => {
    if (mediaPreview) return mediaPreview;
    mediaPreview = document.createElement('div');
    mediaPreview.className = 'admin-media-picker__preview';
    const image = document.createElement('img');
    image.alt = 'Bildvorschau';
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    mediaPreview.appendChild(image);
    mediaPreview.appendChild(video);
    mediaPreviewImage = image;
    mediaPreviewVideo = video;
    document.body.appendChild(mediaPreview);
    return mediaPreview;
  };

  const inferPreviewType = (url) => {
    if (!url) return 'image';
    const lower = String(url).toLowerCase();
    if (lower.includes('/video/upload')) return 'video';
    if (lower.match(/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/)) return 'video';
    return 'image';
  };

  const showMediaPreview = (anchor, url, type) => {
    if (!anchor || !url) return;
    const preview = ensureMediaPreview();
    const resolvedType = type || inferPreviewType(url);
    if (!mediaPreviewImage || !mediaPreviewVideo) return;
    if (resolvedType === 'video') {
      mediaPreviewImage.removeAttribute('src');
      mediaPreviewImage.classList.remove('is-visible');
      mediaPreviewVideo.src = url;
      mediaPreviewVideo.classList.add('is-visible');
      mediaPreviewVideo.play().catch(() => { });
    } else {
      mediaPreviewVideo.pause();
      mediaPreviewVideo.removeAttribute('src');
      mediaPreviewVideo.classList.remove('is-visible');
      mediaPreviewImage.src = url;
      mediaPreviewImage.classList.add('is-visible');
    }
    const rect = anchor.getBoundingClientRect();
    preview.style.left = `${window.scrollX + rect.left}px`;
    preview.style.top = `${window.scrollY + rect.bottom + 8}px`;
    preview.classList.add('is-visible');
  };

  const hideMediaPreview = () => {
    if (!mediaPreview) return;
    mediaPreview.classList.remove('is-visible');
    if (mediaPreviewVideo) {
      mediaPreviewVideo.pause();
    }
  };

  const bindPreviewHandlers = (element) => {
    if (!element || element.dataset.previewBound) return;
    const url = element.dataset.mediaPreviewUrl;
    if (!url) return;
    const type = element.dataset.mediaPreviewType;
    const show = () => showMediaPreview(element, url, type);
    element.addEventListener('mouseenter', show);
    element.addEventListener('focus', show);
    element.addEventListener('mouseleave', hideMediaPreview);
    element.addEventListener('blur', hideMediaPreview);
    element.dataset.previewBound = 'true';
  };

    const bindMediaPicker = (picker) => {
    if (!picker || picker.dataset.pickerBound) return;
    picker.dataset.pickerBound = 'true';
    if (picker.dataset.galleryMode === 'multi') {
      renderSelectionList(picker, getPickerSelections(picker));
    }
    const uploadButton = picker.querySelector('[data-upload-trigger]');
    const uploadInput = picker.querySelector('[data-upload-input]');
    if (uploadButton && uploadInput) {
      uploadButton.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', () => {
        const file = uploadInput.files?.[0];
        const inputs = Array.from(picker.querySelectorAll('[data-gallery-input]'));
        inputs.forEach((input) => {
          input.value = '';
        });
        const preview = picker.querySelector('[data-gallery-preview]');
        if (preview) {
          preview.textContent = file ? `Ausgewählt: ${file.name}` : 'Keine Datei ausgewählt.';
        }
        if (file) {
          const fallbackAlt = stripExtension(file.name);
          setAltInputs(picker, fallbackAlt, fallbackAlt);
        }
        updateAltVisibility(picker);
      });
    }

    const uploadMultiButton = picker.querySelector('[data-upload-trigger-multi]');
    const uploadMultiInput = picker.querySelector('[data-upload-input-multi]');
    if (uploadMultiButton && uploadMultiInput) {
      uploadMultiButton.addEventListener('click', () => uploadMultiInput.click());
      uploadMultiInput.addEventListener('change', () => {
        const files = Array.from(uploadMultiInput.files || []);
        const selections = getPickerSelections(picker).filter((item) => item.source !== 'upload');
        const uploadSelections = files.map((file, index) => ({
          source: 'upload',
          type: file.type.startsWith('video/') ? 'video' : 'image',
          uploadIndex: index,
          label: file.name
        }));
        const nextSelections = [...selections, ...uploadSelections];
        setPickerSelections(picker, nextSelections);
      });
    }

    const previewLinks = Array.from(picker.querySelectorAll('[data-media-preview-url]'));
    previewLinks.forEach((link) => bindPreviewHandlers(link));
    updateAltVisibility(picker);
  };

  const renderSelectionList = (picker, items) => {
    const list = picker.querySelector('[data-gallery-multi-list]');
    if (!list) return;
    list.innerHTML = '';
    items.forEach((item, index) => {
      const chip = document.createElement('div');
      chip.className = 'admin-media-picker__pill';
      const label = item.url ? document.createElement('a') : document.createElement('span');
      const fullLabel = item.label || item.url || `Datei ${index + 1}`;
      label.textContent = truncateText(fullLabel);
      if (fullLabel.length > 30) {
        label.title = fullLabel;
      }
      if (item.url) {
        label.href = item.url;
        label.target = '_blank';
        label.rel = 'noopener noreferrer';
        label.dataset.mediaPreviewUrl = item.url;
        if (item.type) {
          label.dataset.mediaPreviewType = item.type;
        }
      }
      if (item.url) {
        bindPreviewHandlers(label);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Entfernen');
      remove.addEventListener('click', () => {
        const uploadInput = picker.querySelector('[data-upload-input-multi]');
        const isUploadItem = item.source === 'upload';
        const nextItems = items.filter((_, idx) => idx !== index);
        if (isUploadItem && uploadInput) {
          uploadInput.value = '';
          setPickerSelections(picker, nextItems.filter((entry) => entry.source !== 'upload'));
          const preview = picker.querySelector('[data-gallery-preview]');
          if (preview) preview.textContent = 'Upload entfernt. Bitte Dateien erneut auswählen.';
          return;
        }
        setPickerSelections(picker, nextItems);
      });
      chip.appendChild(label);
      chip.appendChild(remove);
      list.appendChild(chip);
    });
    const preview = picker.querySelector('[data-gallery-preview]');
    if (preview) {
      preview.textContent = items.length ? `${items.length} Datei(en) ausgewählt.` : 'Keine Dateien ausgewählt.';
    }
  };

  const setPickerSelections = (picker, items) => {
    const input = picker.querySelector('[data-gallery-multi-input]');
    if (!input) return;
    input.value = JSON.stringify(items);
    renderSelectionList(picker, items);
  };

  mediaPickers.forEach((picker) => {
    bindMediaPicker(picker);
  });

  const previewLinks = Array.from(document.querySelectorAll('[data-media-preview-url]'));
  previewLinks.forEach((link) => bindPreviewHandlers(link));

  const setSelectorTab = (tabKey) => {
    selectorTabs.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.gallerySelectorTab === tabKey);
    });
    selectorPanels.forEach((panel) => {
      panel.classList.toggle('is-hidden', panel.dataset.gallerySelectorPanel !== tabKey);
    });
  };

  const syncAllowedTabs = (allowedTypes) => {
    selectorTabs.forEach((button) => {
      const type = button.dataset.gallerySelectorTab === 'videos' ? 'video' : 'image';
      const isAllowed = allowedTypes.has(type);
      button.classList.toggle('is-hidden', !isAllowed);
    });
    selectorPanels.forEach((panel) => {
      const type = panel.dataset.gallerySelectorPanel === 'videos' ? 'video' : 'image';
      panel.classList.toggle('is-hidden', !allowedTypes.has(type));
    });
    if (allowedTypes.has('image')) {
      setSelectorTab('images');
    } else if (allowedTypes.has('video')) {
      setSelectorTab('videos');
    }
  };

  const openSelector = (picker) => {
    if (!picker) return;
    activePicker = picker;
    const allowValue = picker.dataset.galleryAllow || 'image video';
    const allowedTypes = new Set(allowValue.split(' ').map((value) => value.trim()).filter(Boolean));
    syncAllowedTabs(allowedTypes);
    gallerySelector.classList.remove('is-hidden');
  };

  const closeSelector = () => {
    gallerySelector.classList.add('is-hidden');
    activePicker = null;
  };

  selectorTabs.forEach((button) => {
    button.addEventListener('click', () => setSelectorTab(button.dataset.gallerySelectorTab));
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-open]');
    if (!button) return;
    const picker = button.closest('[data-gallery-picker]');
    openSelector(picker);
  });

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-gallery-close]');
    if (!button) return;
    closeSelector();
  });

  selectorItems.forEach((item) => {
    item.addEventListener('click', () => {
      if (!activePicker) return;
      const type = item.dataset.galleryItemType;
      const allowedTypes = new Set(
        (activePicker.dataset.galleryAllow || 'image video')
          .split(' ')
          .map((value) => value.trim())
          .filter(Boolean)
      );
      if (!allowedTypes.has(type)) return;
      const isMulti = activePicker.dataset.galleryMode === 'multi';
      if (isMulti) {
        const url = item.dataset.galleryItemUrl || '';
        if (!url) return;
        const locale = activePicker.dataset.galleryLocale || 'de';
        const altKey = altDatasetKey(locale);
        const alt = item.dataset[altKey] || '';
        const label = item.dataset.galleryItemLabel || url;
        const selections = getPickerSelections(activePicker);
        if (selections.some((entry) => entry.url === url && entry.type === type)) return;
        const nextSelections = [
          ...selections,
          {
            source: 'gallery',
            type,
            url,
            alt,
            label
          }
        ];
        setPickerSelections(activePicker, nextSelections);
        return;
      }
      const id = item.dataset.galleryItemId || '';
      const inputs = Array.from(activePicker.querySelectorAll('[data-gallery-input]'));
      inputs.forEach((input) => {
        const matchesType = input.dataset.galleryInput === type;
        input.value = matchesType ? id : '';
      });
      const uploadInput = activePicker.querySelector('[data-upload-input]');
      if (uploadInput) uploadInput.value = '';
      const preview = activePicker.querySelector('[data-gallery-preview]');
      if (preview) {
        const label = item.dataset.galleryItemLabel || id;
        preview.textContent = label ? `Ausgewählt: ${label}` : 'Keine Datei ausgewählt.';
      }
      if (type === 'image') {
        const altDe = item.dataset.galleryItemAltDe || '';
        const altEn = item.dataset.galleryItemAltEn || '';
        if (altDe || altEn) {
          setAltInputs(activePicker, altDe, altEn, { force: true });
        }
      }
      updateAltVisibility(activePicker);
      closeSelector();
    });
  });

  const initDynamicList = (container) => {
    const itemsContainer = container.querySelector('[data-dynamic-list-items]');
    if (!itemsContainer) return;
    const max = Number(container.dataset.max || 8);

    const ensureTrailingInput = () => {
      const inputs = Array.from(itemsContainer.querySelectorAll('[data-dynamic-list-input]'));
      const lastInput = inputs[inputs.length - 1];
      if (!lastInput || inputs.length >= max) return;
      if (lastInput.value.trim()) {
        const newInput = document.createElement('input');
        newInput.type = 'text';
        newInput.name = lastInput.name;
        newInput.setAttribute('data-dynamic-list-input', '');
        itemsContainer.appendChild(newInput);
        attachInputListener(newInput);
      }
    };

    const attachInputListener = (input) => {
      input.addEventListener('input', () => {
        ensureTrailingInput();
      });
    };

    Array.from(itemsContainer.querySelectorAll('[data-dynamic-list-input]')).forEach(attachInputListener);
    ensureTrailingInput();
  };

  const initDynamicFaq = (container) => {
    const itemsContainer = container.querySelector('[data-dynamic-faq-items]');
    if (!itemsContainer) return;
    const max = Number(container.dataset.max || 8);

    const ensureTrailingRow = () => {
      const rows = Array.from(itemsContainer.querySelectorAll('[data-dynamic-faq-row]'));
      const lastRow = rows[rows.length - 1];
      if (!lastRow || rows.length >= max) return;
      const lastQuestion = lastRow.querySelector('[data-dynamic-faq-question]');
      const lastAnswer = lastRow.querySelector('[data-dynamic-faq-answer]');
      const hasValue = Boolean(lastQuestion?.value.trim() || lastAnswer?.value.trim());
      if (!hasValue) return;

      const newRow = document.createElement('div');
      newRow.className = 'admin-dynamic-faq__row';
      newRow.setAttribute('data-dynamic-faq-row', '');
      const questionInput = document.createElement('input');
      questionInput.type = 'text';
      questionInput.name = lastQuestion?.name || 'leistungen_faq_q';
      questionInput.placeholder = 'Frage';
      questionInput.setAttribute('data-dynamic-faq-question', '');
      const answerInput = document.createElement('textarea');
      answerInput.name = lastAnswer?.name || 'leistungen_faq_a';
      answerInput.placeholder = 'Antwort';
      answerInput.rows = 2;
      answerInput.setAttribute('data-dynamic-faq-answer', '');
      newRow.appendChild(questionInput);
      newRow.appendChild(answerInput);
      itemsContainer.appendChild(newRow);
      attachRowListener(newRow);
    };

    const attachRowListener = (row) => {
      const question = row.querySelector('[data-dynamic-faq-question]');
      const answer = row.querySelector('[data-dynamic-faq-answer]');
      const onInput = () => {
        ensureTrailingRow();
      };
      if (question) question.addEventListener('input', onInput);
      if (answer) answer.addEventListener('input', onInput);
    };

    Array.from(itemsContainer.querySelectorAll('[data-dynamic-faq-row]')).forEach(attachRowListener);
    ensureTrailingRow();
  };

  document.querySelectorAll('[data-dynamic-list]').forEach(initDynamicList);
  document.querySelectorAll('[data-dynamic-faq]').forEach(initDynamicFaq);

  const initContentEditor = (editor) => {
    const form = editor.closest('form');
    const blocksContainer = editor.querySelector('[data-content-blocks]');
    const sortList = editor.querySelector('[data-content-sort-list]');
    const orderInput = editor.querySelector('[data-content-order]');
    const addSelect = editor.querySelector('[data-content-add-select]');
    const addButton = editor.querySelector('[data-content-add]');
    const saveOrderButton = editor.querySelector('[data-content-save-order]');
    if (!blocksContainer || !sortList || !orderInput) return;

    const templates = new Map(
      Array.from(editor.querySelectorAll('template[data-content-template]'))
        .map((template) => [template.dataset.contentTemplate, template])
    );

    const updateOrderInput = () => {
      const ids = Array.from(sortList.querySelectorAll('[data-block-id]'))
        .map((item) => item.dataset.blockId)
        .filter(Boolean);
      orderInput.value = JSON.stringify(ids);
      return ids;
    };

    const syncBlockOrder = () => {
      const ids = updateOrderInput();
      ids.forEach((id) => {
        const block = blocksContainer.querySelector(`[data-block-id="${id}"]`);
        if (block) {
          blocksContainer.appendChild(block);
        }
      });
    };

    const createSortItem = (blockId, label) => {
      const item = document.createElement('li');
      item.className = 'admin-content-sort__item';
      item.draggable = true;
      item.dataset.blockId = blockId;
      item.innerHTML = `<span class="admin-content-sort__handle" aria-hidden="true">↕</span><span>${label}</span>`;
      return item;
    };

    blocksContainer.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-content-remove]');
      if (!removeButton) return;
      const block = removeButton.closest('[data-content-block]');
      if (!block) return;
      const blockId = block.dataset.blockId;
      block.remove();
      if (blockId) {
        const sortItem = sortList.querySelector(`[data-block-id="${blockId}"]`);
        if (sortItem) sortItem.remove();
      }
      updateOrderInput();
    });

    if (addButton && addSelect) {
      addButton.addEventListener('click', () => {
        const type = addSelect.value;
        const template = templates.get(type);
        if (!template) return;
        const blockId = `block-${Date.now()}`;
        const html = template.innerHTML.replaceAll('__BLOCK_ID__', blockId);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html.trim();
        const newBlock = wrapper.firstElementChild;
        if (!newBlock) return;
        blocksContainer.appendChild(newBlock);
        const label = addSelect.selectedOptions[0]?.textContent?.trim() || type;
        sortList.appendChild(createSortItem(blockId, label));
        updateOrderInput();
        Array.from(newBlock.querySelectorAll('[data-gallery-picker]')).forEach((picker) => {
          bindMediaPicker(picker);
        });
      });
    }

    if (saveOrderButton && form) {
      saveOrderButton.addEventListener('click', () => {
        updateOrderInput();
        form.submit();
      });
    }

    let draggedItem = null;
    sortList.addEventListener('dragstart', (event) => {
      const item = event.target.closest('[data-block-id]');
      if (!item) return;
      draggedItem = item;
      item.classList.add('is-dragging');
      event.dataTransfer?.setData('text/plain', item.dataset.blockId || '');
      event.dataTransfer?.setDragImage(item, 0, 0);
    });

    sortList.addEventListener('dragend', () => {
      if (draggedItem) {
        draggedItem.classList.remove('is-dragging');
      }
      draggedItem = null;
      syncBlockOrder();
    });

    sortList.addEventListener('dragover', (event) => {
      event.preventDefault();
      const afterElement = Array.from(sortList.querySelectorAll('.admin-content-sort__item:not(.is-dragging)'))
        .find((item) => {
          const box = item.getBoundingClientRect();
          return event.clientY < box.top + box.height / 2;
        });
      if (!draggedItem) return;
      if (afterElement) {
        sortList.insertBefore(draggedItem, afterElement);
      } else {
        sortList.appendChild(draggedItem);
      }
    });

    if (form) {
      form.addEventListener('submit', () => {
        updateOrderInput();
      });
    }
  };

  document.querySelectorAll('[data-content-editor]').forEach(initContentEditor);

  const downloadGroups = Array.from(document.querySelectorAll('[data-rahmenplan-downloads]'));
  downloadGroups.forEach((group) => {
    const locale = group.dataset.locale || 'de';
    const isRowFilled = (row) => {
      const labelInput = row.querySelector('input[type="text"]');
      const fileInput = row.querySelector('input[type="file"]');
      return Boolean(labelInput?.value?.trim() || fileInput?.files?.length);
    };
    const createRow = (index) => {
      const row = document.createElement('div');
      row.className = 'admin-downloads__row';
      row.dataset.downloadRow = 'true';
      row.innerHTML = `
        <input type="text" name="rahmenplan_${locale}_download_label_${index}" value="" placeholder="Buttontext eingeben...">
        <input type="hidden" name="rahmenplan_${locale}_download_url_${index}" value="">
        <input type="file" name="rahmenplan_${locale}_download_file_${index}" data-download-file>
      `;
      return row;
    };
    const ensureTrailingRow = () => {
      const rows = Array.from(group.querySelectorAll('[data-download-row]'));
      const lastRow = rows[rows.length - 1];
      if (lastRow && isRowFilled(lastRow)) {
        group.appendChild(createRow(rows.length + 1));
      }
    };
    group.addEventListener('input', ensureTrailingRow);
    group.addEventListener('change', ensureTrailingRow);
    ensureTrailingRow();
  });
});