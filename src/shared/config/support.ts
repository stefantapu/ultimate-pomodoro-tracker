export const SUPPORT_EMAIL = "stefantapu@gmail.com";

export const SUPPORT_KOFI_URL = "https://ko-fi.com/forgetimerdev";

export const ACCOUNT_DELETION_SUBJECT =
  "ForgeTimer account deletion request";

export const ACCOUNT_DELETION_BODY =
  "Please delete my ForgeTimer account and saved app data. I am sending this request from the email linked to my account.";

export function createSupportMailtoHref({
  subject,
  body,
}: {
  subject?: string;
  body?: string;
} = {}) {
  const params = new URLSearchParams();

  if (subject) {
    params.set("subject", subject);
  }

  if (body) {
    params.set("body", body);
  }

  const query = params.toString();

  return query
    ? `mailto:${SUPPORT_EMAIL}?${query}`
    : `mailto:${SUPPORT_EMAIL}`;
}
