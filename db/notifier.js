"use strict";

// Bildirim katmanı (notifier seam).
//
// Aidat hatırlatması ve duyuru yayını gibi olaylarda sakinlere SMS/e-posta
// göndermek için tek arayüz: `send({ channel, to, subject, message })`.
//
// Sürücüler:
//   - log (varsayılan): Gerçek gönderim yapmaz; konsola yazar ve `simulated`
//     bayrağıyla sonuç döndürür. Sağlayıcı anahtarı olmadan geliştirme için.
//   - webhook: NOTIFY_WEBHOOK_URL adresine JSON POST atar. Twilio/SendGrid
//     benzeri sağlayıcılara köprü kuran herhangi bir uç (Zapier, n8n, kendi
//     mikroservisin) ile çalışır; sıfır bağımlılık korunur.
//
// Devreye alma: NOTIFY_DRIVER=webhook + NOTIFY_WEBHOOK_URL=https://...

class LogNotifier {
  constructor(options = {}) {
    this.quiet = Boolean(options.quiet ?? process.env.NODE_ENV === "test");
  }

  async send({ channel = "email", to = "", subject = "", message = "" }) {
    if (!this.quiet) {
      console.log(`[notify:${channel}] to=${to} subject=${subject} message=${String(message).slice(0, 120)}`);
    }
    return { ok: true, driver: "log", simulated: true, channel, to };
  }
}

class WebhookNotifier {
  constructor(options = {}) {
    this.url = options.url || process.env.NOTIFY_WEBHOOK_URL || "";
    this.timeoutMs = Number(options.timeoutMs || 8000);
  }

  async send({ channel = "email", to = "", subject = "", message = "" }) {
    if (!this.url) {
      return { ok: false, driver: "webhook", simulated: false, channel, to, error: "NOTIFY_WEBHOOK_URL tanımlı değil" };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel, to, subject, message, source: "apartai" }),
        signal: controller.signal,
      });
      return { ok: response.ok, driver: "webhook", simulated: false, channel, to, httpStatus: response.status };
    } catch (error) {
      return { ok: false, driver: "webhook", simulated: false, channel, to, error: error.message };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function createNotifier(driver = process.env.NOTIFY_DRIVER || "log") {
  switch (String(driver).toLowerCase()) {
    case "webhook":
      return new WebhookNotifier();
    case "log":
    default:
      return new LogNotifier();
  }
}

module.exports = { createNotifier, LogNotifier, WebhookNotifier };
