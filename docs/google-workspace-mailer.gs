/**
 * Balga Designs — website mail relay (Google Apps Script)
 * =======================================================
 *
 * Cloudflare Workers can't talk SMTP, so the website hands its mail to this
 * script over HTTPS and the script sends it from the Google Workspace mailbox
 * it's deployed under. Nothing leaves Google, no third-party sending service,
 * no SPF/DKIM changes — the mail is simply sent by the business's own account.
 *
 * Used for the contact-form notification and the Content Manager's
 * "forgot password" link.
 *
 * ---------------------------------------------------------------------------
 * SETUP (about five minutes, done once, in the client's Workspace account)
 * ---------------------------------------------------------------------------
 * 1. Sign in to Google as the mailbox the mail should come from
 *    (e.g. info@balgadesigns.com.au) and open https://script.google.com.
 * 2. New project → delete the sample code → paste this file in.
 * 3. Replace SHARED_TOKEN below with a long random string. Keep a copy.
 * 4. Deploy → New deployment → type "Web app":
 *       Execute as:      Me (the mailbox above)
 *       Who has access:  Anyone
 *    Deploy, approve the permission prompt, and copy the Web app URL.
 *    ("Anyone" only means the URL is reachable — the token below is what
 *     actually authorises a request, so keep it secret.)
 * 5. Give the website the URL and the token:
 *       npx wrangler secret put GAS_MAIL_URL      # the /exec URL from step 4
 *       npx wrangler secret put GAS_MAIL_TOKEN    # the token from step 3
 *
 * That's it — the contact form and password resets start sending immediately.
 * To re-check it later: Apps Script → Executions shows every send.
 *
 * Sending limits: a Workspace account may send 1,500 recipients/day through
 * Apps Script (100/day on a free gmail.com account) — far above what a contact
 * form uses.
 */

const SHARED_TOKEN = 'replace-me-with-a-long-random-string';

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (!SHARED_TOKEN || SHARED_TOKEN === 'replace-me-with-a-long-random-string') {
      return reply({ ok: false, error: 'relay not configured: set SHARED_TOKEN' });
    }
    if (body.token !== SHARED_TOKEN) {
      return reply({ ok: false, error: 'unauthorised' });
    }
    if (!body.to || !body.subject || !body.text) {
      return reply({ ok: false, error: 'missing to/subject/text' });
    }

    const options = {
      to: String(body.to),
      subject: String(body.subject),
      body: String(body.text),
      name: String(body.fromName || 'Balga Designs website'),
    };
    // Replying to the notification goes straight back to the enquirer.
    if (body.replyTo) options.replyTo = String(body.replyTo);

    MailApp.sendEmail(options);
    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err).slice(0, 200) });
  }
}

/** A plain GET is handy for checking the deployment is live. */
function doGet() {
  return reply({ ok: true, service: 'balga-mail-relay' });
}

function reply(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
