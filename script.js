document.querySelectorAll('a[href="#top"]').forEach((link) => {
  link.addEventListener("click", () => {
    window.scrollTo(0, 0);
  });
});

const header = document.querySelector(".header");
const menuButton = document.querySelector(".header__menu-button");
const mobileNav = document.querySelector(".mobile-nav");

if (menuButton && mobileNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

const onScroll = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 20);
};

window.addEventListener("scroll", onScroll);
onScroll();

const revealItems = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  { threshold: 0.15 }
);

revealItems.forEach((item) => revealObserver.observe(item));

document.querySelectorAll(".reveal-step").forEach((item, index) => {
  item.style.transitionDelay = `${index * 0.2}s`;
});

const consultationModal = document.querySelector("#consultation-modal");
const consultationOpenButtons = document.querySelectorAll(".js-open-consultation-modal");
const privacyModal = document.querySelector("#privacy-modal");
const privacyIframe = privacyModal?.querySelector(".privacy-modal__frame");

function syncModalOpenBody() {
  const hasOpen =
    (consultationModal && !consultationModal.hidden) ||
    (privacyModal && !privacyModal.hidden);
  document.body.classList.toggle("modal-open", Boolean(hasOpen));
}

function closeConsultationModal() {
  if (!consultationModal) return;
  consultationModal.hidden = true;
  syncModalOpenBody();
}

function openConsultationModal() {
  if (!consultationModal) return;
  consultationModal.hidden = false;
  syncModalOpenBody();
  consultationModal.querySelector('input[name="name"]')?.focus();
}

function closePrivacyModal() {
  if (!privacyModal) return;
  privacyModal.hidden = true;
  if (privacyIframe) privacyIframe.src = "about:blank";
  syncModalOpenBody();
}

function openPrivacyModal(url) {
  if (!privacyModal || !privacyIframe || !url) return;
  privacyIframe.src = url;
  privacyModal.hidden = false;
  syncModalOpenBody();
}

if (consultationModal && consultationOpenButtons.length) {
  const consultationCloseButtons = consultationModal.querySelectorAll("[data-modal-close]");

  consultationOpenButtons.forEach((button) => {
    button.addEventListener("click", openConsultationModal);
  });

  consultationCloseButtons.forEach((button) => {
    button.addEventListener("click", closeConsultationModal);
  });
}

if (privacyModal) {
  privacyModal.querySelectorAll("[data-privacy-close]").forEach((el) => {
    el.addEventListener("click", closePrivacyModal);
  });
}

document.querySelectorAll(".js-open-privacy-modal").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openPrivacyModal(link.getAttribute("href"));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (privacyModal && !privacyModal.hidden) {
    closePrivacyModal();
    return;
  }
  if (consultationModal && !consultationModal.hidden) {
    closeConsultationModal();
  }
});

/** Нормализация к 11 цифрам с ведущей 7 (РФ: 8→7; без кода страны — добавляем 7). */
function normalizePhoneDigits(raw) {
  let d = String(raw).replace(/\D/g, "");
  if (!d.length) return "";
  if (d[0] === "8") d = "7" + d.slice(1);
  if (d[0] !== "7" && d.length <= 10) d = "7" + d;
  return d.slice(0, 11);
}

/** Отображение: +7 (XXX) XXX-XX-XX */
function formatRuPhoneDisplay(normalizedDigits) {
  const d = normalizePhoneDigits(normalizedDigits);
  if (!d.length) return "";
  const rest = d.slice(1);
  let out = "+7";
  if (rest.length === 0) return `${out} `;
  out += ` (${rest.slice(0, 3)}`;
  if (rest.length <= 3) {
    return rest.length === 3 ? `${out}) ` : out;
  }
  out += `) ${rest.slice(3, 6)}`;
  if (rest.length <= 6) return out;
  out += `-${rest.slice(6, 8)}`;
  if (rest.length <= 8) return out;
  out += `-${rest.slice(8, 10)}`;
  return out;
}

function attachPhoneMask(input) {
  const apply = () => {
    const formatted = formatRuPhoneDisplay(input.value);
    if (input.value !== formatted) {
      input.value = formatted;
    }
  };

  input.addEventListener("input", apply);
  input.addEventListener("blur", apply);

  apply();
}

document.querySelectorAll('input[name="phone"][type="tel"]').forEach(attachPhoneMask);

const BITRIX_WEBHOOK_BASE = "https://b24-zvxg8i.bitrix24.ru/rest/11/lg90h0cxox4duhl0";
const BITRIX_LEAD_ENDPOINT = `${BITRIX_WEBHOOK_BASE}/crm.lead.add.json`;
const BITRIX_ASSIGNED_BY_ID = 217;
const BITRIX_SOURCE_ID = "27"; // "Сайт  emcmpodolsk.ru"
const BITRIX_SITE_ENUM_PRIMARY = 1745; // UF_CRM_1738574737291 => emcmpodolsk.ru
const BITRIX_SITE_ENUM_REPORTS = 1751; // UF_CRM_1718319812 => emcmpodolsk.ru
const BITRIX_CALLTOUCH_SITE_ID = "74136";

function getFormType(form) {
  if (form.closest("#consultation-modal")) return "Модальное окно";
  if (form.closest(".cta")) return "CTA блок";
  if (window.location.pathname.includes("/zapis/")) return "Предварительная запись";
  if (window.location.pathname.includes("/contacts/")) return "Контакты";
  return "Главная форма";
}

function getSelectValueLabel(select) {
  if (!select) return "";
  const selectedOption = select.options[select.selectedIndex];
  return selectedOption?.textContent?.trim() || select.value || "";
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];
  const utm = {};

  keys.forEach((key) => {
    const value = params.get(key);
    if (value) utm[key] = value.trim();
  });

  return utm;
}

function getUtmText(utm) {
  return Object.entries(utm)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}

function buildLeadPayload(form) {
  const nameInput = form.querySelector('[name="name"]');
  const phoneInput = form.querySelector('[name="phone"]');
  const serviceSelect = form.querySelector('[name="service"]');
  const messageInput = form.querySelector('[name="message"]');
  const commentInput = form.querySelector('[name="comment"]');

  const name = nameInput?.value?.trim() || "Без имени";
  const rawPhone = phoneInput?.value || "";
  const normalizedPhone = normalizePhoneDigits(rawPhone);
  const displayPhone = formatRuPhoneDisplay(normalizedPhone);
  const serviceLabel = getSelectValueLabel(serviceSelect);
  const message = messageInput?.value?.trim() || "";
  const comment = commentInput?.value?.trim() || "";
  const formType = getFormType(form);
  const pageUrl = window.location.href;
  const pagePath = window.location.pathname;
  const utm = getUtmParams();
  const utmText = getUtmText(utm);
  const cookiesValue = document.cookie || "";

  const commentsParts = [
    `Форма: ${formType}`,
    `Страница: ${pagePath}`,
    `URL: ${pageUrl}`,
  ];

  if (serviceLabel) commentsParts.push(`Услуга: ${serviceLabel}`);
  if (message) commentsParts.push(`Сообщение: ${message}`);
  if (comment) commentsParts.push(`Комментарий: ${comment}`);
  if (utmText) commentsParts.push(`UTM: ${utmText}`);

  return {
    fields: {
      TITLE: `Заявка с сайта (${formType})`,
      NAME: name,
      PHONE: [{ VALUE: displayPhone || rawPhone, VALUE_TYPE: "WORK" }],
      COMMENTS: commentsParts.join("\n"),
      ASSIGNED_BY_ID: BITRIX_ASSIGNED_BY_ID,
      SOURCE_ID: BITRIX_SOURCE_ID,
      SOURCE_DESCRIPTION: "Сайт  emcmpodolsk.ru",
      UTM_SOURCE: utm.utm_source || "",
      UTM_MEDIUM: utm.utm_medium || "",
      UTM_CAMPAIGN: utm.utm_campaign || "",
      UTM_CONTENT: utm.utm_content || "",
      UTM_TERM: utm.utm_term || "",
      UF_CRM_UTMID: utm.utm_id || "",
      UF_CRM_COOKIES: cookiesValue,
      UF_CRM_CALLTOUCHGZGO: BITRIX_CALLTOUCH_SITE_ID,
      UF_CRM_1738574737291: BITRIX_SITE_ENUM_PRIMARY,
      UF_CRM_1718319812: BITRIX_SITE_ENUM_REPORTS,
      OPENED: "Y",
    },
    params: {
      REGISTER_SONET_EVENT: "Y",
    },
  };
}

async function sendLeadToBitrix(form) {
  const payload = buildLeadPayload(form);
  const response = await fetch(BITRIX_LEAD_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let result = null;
  try {
    result = await response.json();
  } catch (_) {
    throw new Error("Некорректный ответ от Bitrix24");
  }

  if (!response.ok || result?.error) {
    const errorMessage = result?.error_description || result?.error || "Ошибка отправки в Bitrix24";
    throw new Error(errorMessage);
  }

  return result;
}

const YM_COUNTER_ID = 105911139;

function reachUniversalFormGoal(form) {
  if (typeof window.ym !== "function") return;
  const formType = getFormType(form);
  window.ym(YM_COUNTER_ID, "reachGoal", "universal_form_submit", { form: formType });
}

const validators = {
  name(value) {
    if (!value.trim()) return "Введите имя";
    if (value.trim().length < 2) return "Имя слишком короткое";
    return "";
  },
  phone(value) {
    const digits = normalizePhoneDigits(value);
    if (!digits) return "Введите телефон";
    if (digits.length < 11) return "Укажите корректный телефон";
    return "";
  },
  service(value) {
    if (!value) return "Выберите тип услуги";
    return "";
  },
  consent(value, input) {
    if (input?.type === "checkbox" && !input.checked) return "Нужно согласие на обработку данных";
    if (!value) return "Поле обязательно";
    return "";
  },
};

function getErrorElement(input) {
  if (input.type === "checkbox") {
    return input.closest(".checkbox-field")?.querySelector(".field__error") || null;
  }
  return input.closest(".field, label, .cta__form")?.querySelector(".field__error") || null;
}

function setFieldError(input, message) {
  const errorEl = getErrorElement(input);
  if (errorEl) errorEl.textContent = message;

  if (input.type === "checkbox") return;
  input.style.borderColor = message ? "#d63031" : "";
}

document.querySelectorAll('input[name="consent"][type="checkbox"]').forEach((input) => {
  input.addEventListener("change", () => {
    if (input.checked) setFieldError(input, "");
  });
});

function validateField(input) {
  const value = input.type === "checkbox" ? (input.checked ? "1" : "") : input.value;
  const validate = validators[input.name];

  if (validate) {
    return validate(value, input);
  }

  if (input.required && !value.trim()) {
    return "Поле обязательно";
  }

  return "";
}

document.querySelectorAll(".js-lead-form").forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    let hasErrors = false;
    const fields = form.querySelectorAll("input[required], select[required], textarea[required]");
    fields.forEach((field) => {
      const message = validateField(field);
      setFieldError(field, message);
      if (message) hasErrors = true;
    });

    if (hasErrors) return;

    const submitButton = form.querySelector('button[type="submit"]');
    const success = form.querySelector(".lead-form__success");
    const phoneField = form.querySelector('[name="phone"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.style.opacity = "0.7";
      submitButton.style.cursor = "not-allowed";
    }

    setFieldError(phoneField, "");

    try {
      await sendLeadToBitrix(form);
      reachUniversalFormGoal(form);

      try {
        var ct_site_id = 74136;
        var ct_data = {
            fio: form.querySelector('[name="name"]')?.value,
            phoneNumber: phoneField?.value,
            subject: 'Заявка с ' + location.hostname,
            requestUrl: location.href,
            sessionId: window.call_value
        };
        var post_data = Object.keys(ct_data).reduce(function (a, k) { if (!!ct_data[k]) { a.push(k + '=' + encodeURIComponent(ct_data[k])); } return a }, []).join('&');
        var CT_URL = 'https://api.calltouch.ru/calls-service/RestAPI/requests/' + ct_site_id + '/register/';

        console.log('Отправлено в Calltouch', ct_data);
        window.ct_snd_flag = 1; setTimeout(function () { window.ct_snd_flag = 0; }, 15000);
        var request = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
        request.open("POST", CT_URL, true); request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.send(post_data);  
      } catch (error) {}



      if (success) {
        success.textContent = "Спасибо! Мы перезвоним в течение 15 минут.";
        success.style.color = "#27ae60";
        success.hidden = false;
      }

      fields.forEach((field) => {
        if (field.type === "checkbox") {
          field.checked = false;
        } else {
          field.value = "";
          field.style.borderColor = "";
        }
      });
    } catch (error) {
      if (success) {
        success.textContent = "Не удалось отправить заявку. Проверьте интернет и попробуйте снова.";
        success.style.color = "#d63031";
        success.hidden = false;
      }
      setFieldError(phoneField, "Ошибка отправки. Попробуйте еще раз.");
      console.error("Bitrix24 lead send error:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.style.opacity = "";
        submitButton.style.cursor = "";
      }
    }
  });
});
