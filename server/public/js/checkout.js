(() => {
  const form = document.querySelector('[data-checkout-form]');
  if (!form) return;

  const attendeeList = form.querySelector('[data-attendee-list]');
  const attendeeSection = form.querySelector('[data-attendees]');
  const quantitySelect = form.querySelector('[data-kino-quantity]');
  const errorEl = form.querySelector('[data-checkout-error]');
  const summary = form.querySelector('[data-checkout-summary]');
  const summaryBasePrice = summary?.querySelector('[data-summary-base-price]');
  const summaryExtraRow = summary?.querySelector('[data-summary-extra]');
  const summaryExtraLabel = summary?.querySelector('[data-summary-extra-label]');
  const summaryExtraTotal = summary?.querySelector('[data-summary-extra-total]');
  const summaryExtraUnitRow = summary?.querySelector('[data-summary-extra-unit-row]');
  const summaryExtraUnit = summary?.querySelector('[data-summary-extra-unit]');
  const summaryTotal = summary?.querySelector('[data-summary-total]');

  const buildAttendeeFields = (count) => {
    attendeeList.innerHTML = '';
    if (!count || count <= 0) {
      attendeeSection?.setAttribute('hidden', 'hidden');
      return;
    }
    attendeeSection?.removeAttribute('hidden');
    for (let i = 0; i < count; i += 1) {
      const wrapper = document.createElement('div');
      wrapper.className = 'checkout__attendee';
      wrapper.innerHTML = `
        <h3>Kinoticket ${i + 1}</h3>
        <label>Vorname
          <input type="text" name="attendees[${i}][firstName]" required>
        </label>
        <label>Nachname
          <input type="text" name="attendees[${i}][lastName]" required>
        </label>
      `;
      attendeeList.appendChild(wrapper);
    }
  };

  const getQuantity = () => {
    if (!quantitySelect) return 0;
    return Number.parseInt(quantitySelect.value, 10) || 0;
  };
  const formatCurrency = (value) => `${Number(value).toFixed(2)} €`;

  const updateSummary = () => {
    if (!summary) return;
    const ticketType = summary.dataset.ticketType || 'kino';
    const basePrice = Number(summary.dataset.ticketPrice || 0);
    const standardPrice = Number(summary.dataset.standardKinoPrice || 0);
    const quantity = ticketType === 'online' ? 0 : getQuantity();
    const baseCount = ticketType === 'online' ? 1 : 1;
    const extraCount = ticketType === 'online' ? 0 : Math.max(quantity - 1, 0);

    if (summaryBasePrice) {
      summaryBasePrice.textContent = formatCurrency(basePrice * baseCount);
    }

    if (summaryExtraRow && summaryExtraLabel && summaryExtraTotal && summaryExtraUnitRow && summaryExtraUnit) {
      if (extraCount > 0) {
        summaryExtraLabel.textContent = `${extraCount}x weitere Kinotickets zum Gesamtpreis von`;
        summaryExtraTotal.textContent = formatCurrency(standardPrice * extraCount);
        summaryExtraUnit.textContent = formatCurrency(standardPrice);
        summaryExtraRow.hidden = false;
        summaryExtraUnitRow.hidden = false;
      } else {
        summaryExtraRow.hidden = true;
        summaryExtraUnitRow.hidden = true;
      }
    }

    if (summaryTotal) {
      const total = (basePrice * baseCount) + (standardPrice * extraCount);
      summaryTotal.textContent = formatCurrency(total);
    }
  };

  if (quantitySelect) {
    buildAttendeeFields(getQuantity());
    updateSummary();
    quantitySelect.addEventListener('change', () => {
      buildAttendeeFields(getQuantity());
      updateSummary();
    });
  } else {
    attendeeSection?.setAttribute('hidden', 'hidden');
    updateSummary();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }

    const formData = new FormData(form);
    const payload = {
      ticketId: formData.get('ticketId'),
      ticketType: formData.get('ticketType'),
      buyerName: formData.get('buyerName'),
      buyerEmail: formData.get('buyerEmail'),
      kinoQuantity: formData.get('kinoQuantity'),
      attendees: []
    };

    const attendeeCount = getQuantity();
    for (let i = 0; i < attendeeCount; i += 1) {
      payload.attendees.push({
        firstName: formData.get(`attendees[${i}][firstName]`),
        lastName: formData.get(`attendees[${i}][lastName]`)
      });
    }

    try {
      const response = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Beim Erstellen der Zahlung ist ein Fehler aufgetreten.');
      }
      window.location.href = data.url;
    } catch (error) {
      if (errorEl) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
      }
    }
  });
})();