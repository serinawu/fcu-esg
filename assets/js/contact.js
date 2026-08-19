document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const captchaCanvas = document.getElementById("contactCaptchaCanvas");
  const captchaRefresh = document.getElementById("contactCaptchaRefresh");
  const message = document.getElementById("contactMessage");
  const messageCounter = document.getElementById("contactMessageCounter");
  const success = document.getElementById("contactSuccess");
  const successReset = document.getElementById("contactSuccessReset");
  const captchaCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let captchaCode = "";

  const fields = {
    name: document.getElementById("contactName"),
    email: document.getElementById("contactEmail"),
    phone: document.getElementById("contactPhone"),
    fax: document.getElementById("contactFax"),
    subject: document.getElementById("contactSubject"),
    message,
    captcha: document.getElementById("contactCaptcha")
  };

  const drawCaptcha = () => {
    captchaCode = Array.from({ length: 5 }, () => {
      const index = Math.floor(Math.random() * captchaCharacters.length);
      return captchaCharacters[index];
    }).join("");

    const ratio = window.devicePixelRatio || 1;
    const width = 148;
    const height = 48;
    captchaCanvas.width = width * ratio;
    captchaCanvas.height = height * ratio;
    const context = captchaCanvas.getContext("2d");
    context.scale(ratio, ratio);
    context.fillStyle = "#eef6ff";
    context.fillRect(0, 0, width, height);

    for (let index = 0; index < 5; index += 1) {
      context.strokeStyle = index % 2 === 0 ? "#9bb8d6" : "#f1b64e";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(Math.random() * width, Math.random() * height);
      context.lineTo(Math.random() * width, Math.random() * height);
      context.stroke();
    }

    context.font = "800 24px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    [...captchaCode].forEach((character, index) => {
      context.save();
      context.translate(22 + index * 26, 24 + (Math.random() * 4 - 2));
      context.rotate((Math.random() * 10 - 5) * Math.PI / 180);
      context.fillStyle = index % 2 === 0 ? "#073d7a" : "#9a4e00";
      context.fillText(character, 0, 0);
      context.restore();
    });
  };

  const setError = (field, errorMessage) => {
    const error = document.getElementById(`${field.id}Error`);
    field.setAttribute("aria-invalid", "true");
    if (error) error.textContent = errorMessage;
  };

  const clearError = (field) => {
    const error = document.getElementById(`${field.id}Error`);
    field.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  };

  const validate = () => {
    Object.values(fields).forEach(clearError);
    const invalid = [];
    const contactPattern = /^[0-9()+#\-\s]{7,24}$/;

    if (fields.name.value.trim().length < 2) {
      setError(fields.name, "請輸入至少 2 個字的姓名。");
      invalid.push(fields.name);
    }
    if (!fields.email.validity.valid || !fields.email.value.trim()) {
      setError(fields.email, "請輸入有效的電子信箱。");
      invalid.push(fields.email);
    }
    if (fields.phone.value.trim() && !contactPattern.test(fields.phone.value.trim())) {
      setError(fields.phone, "請輸入有效的聯絡電話。");
      invalid.push(fields.phone);
    }
    if (fields.fax.value.trim() && !contactPattern.test(fields.fax.value.trim())) {
      setError(fields.fax, "請輸入有效的傳真號碼。");
      invalid.push(fields.fax);
    }
    if (fields.subject.value.trim().length < 2) {
      setError(fields.subject, "請輸入至少 2 個字的主旨。");
      invalid.push(fields.subject);
    }
    if (fields.message.value.trim().length < 10) {
      setError(fields.message, "訊息內容至少需要 10 個字。");
      invalid.push(fields.message);
    }
    if (fields.message.value.trim().length > 1000) {
      setError(fields.message, "訊息內容不可超過 1000 個字。");
      invalid.push(fields.message);
    }
    if (fields.captcha.value.trim().toUpperCase() !== captchaCode) {
      setError(fields.captcha, "圖形驗證碼不正確，請重新輸入。");
      invalid.push(fields.captcha);
    }
    return invalid;
  };

  Object.values(fields).forEach((field) => {
    field.addEventListener("input", () => clearError(field));
  });

  message.addEventListener("input", () => {
    messageCounter.textContent = `${message.value.length} / 1000`;
  });

  captchaRefresh.addEventListener("click", () => {
    drawCaptcha();
    fields.captcha.value = "";
    clearError(fields.captcha);
    fields.captcha.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = validate();
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  successReset.addEventListener("click", () => {
    form.reset();
    Object.values(fields).forEach(clearError);
    messageCounter.textContent = "0 / 1000";
    drawCaptcha();
    success.hidden = true;
    form.hidden = false;
    fields.name.focus();
  });

  drawCaptcha();
});
