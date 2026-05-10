import { SUPPORT_EMAIL } from "@shared/config/support";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { useSkinStore } from "@shared/stores/skinStore";
import { useMemo } from "react";
import type { LegalPageKind } from "./legalRoutes";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type LegalPageContent = {
  title: string;
  updatedAt: string;
  intro: string[];
  sections: LegalSection[];
};

const privacyContent: LegalPageContent = {
  title: "Privacy Policy",
  updatedAt: "May 10, 2026",
  intro: [
    "ForgeTimer is a productivity timer and progress tracking app operated by an independent developer.",
    "This policy explains what data ForgeTimer collects, how it is used, and what choices you have.",
  ],
  sections: [
    {
      title: "1. Data we collect",
      paragraphs: [
        "If you use ForgeTimer without signing in, your timer state, settings, selected theme, and similar guest data are stored locally in your browser. We do not sync guest timer sessions, notes, settings, or analytics to Supabase unless you are signed in.",
        "If you create an account or sign in, we may store:",
      ],
      bullets: [
        "Account data: your email address, authentication provider, and account identifiers.",
        "Google Sign-In data: if you sign in with Google, we receive basic account information such as your email address and provider identity data through Supabase Auth.",
        "App profile data: XP, level, timer settings, sound settings, selected preferences, and update timestamps.",
        "Timer session data: focus/break mode, planned duration, accumulated time, start time, finish time, and creation time.",
        "Notes: note content, completion status, and note timestamps.",
        "Technical/auth data: session metadata, browser/device metadata, IP address, and authentication tokens handled by Supabase Auth.",
      ],
    },
    {
      title: "2. How we use your data",
      paragraphs: ["We use your data to:"],
      bullets: [
        "create and manage your account;",
        "let you sign in;",
        "save your timer sessions, notes, progress, settings, and preferences;",
        "show your own analytics and progress inside the app;",
        "keep the app secure and working correctly;",
        "debug and improve the app.",
        "We do not sell your personal data.",
        "We do not use your Google user data for advertising.",
        "We do not use your notes or Google user data to train AI models.",
      ],
    },
    {
      title: "3. Notes and user content",
      paragraphs: [
        "Notes are user-generated content. We store your notes so you can view, update, complete, and delete them inside ForgeTimer.",
        "You are responsible for what you write in notes. Please avoid storing passwords, payment details, or highly sensitive information in the app.",
      ],
    },
    {
      title: "4. Google Sign-In",
      paragraphs: [
        "ForgeTimer uses Google Sign-In only for authentication. If you choose Google Sign-In, Google and Supabase Auth process the sign-in flow, and Supabase stores the identity data needed to keep you signed in.",
        "ForgeTimer does not request access to your Gmail, Google Drive, calendar, contacts, or other Google account content.",
      ],
    },
    {
      title: "5. Local browser storage",
      paragraphs: [
        "ForgeTimer uses browser localStorage to save guest timer state, settings, selected theme, and similar local preferences.",
        "If you are signed in, Supabase may also store authentication session data in your browser so you can stay signed in.",
        "You can clear local browser data through your browser settings, but this may reset guest state or sign you out.",
      ],
    },
    {
      title: "6. Service providers",
      paragraphs: ["ForgeTimer uses third-party service providers to run the app:"],
      bullets: [
        "Supabase: authentication, database, and account/session handling.",
        "Vercel: hosting and delivery of the web app.",
        "Google: Google Sign-In, if you choose to use it.",
        "Ko-fi: external donation page, if you choose to open it.",
      ],
    },
    {
      title: "7. Donations",
      paragraphs: [
        "ForgeTimer may link to Ko-fi or similar third-party donation services. Donations are optional. Payment and donation processing happens on the third-party provider's website, not directly inside ForgeTimer.",
      ],
    },
    {
      title: "8. Data retention",
      paragraphs: [
        "We keep account and app data while your account exists or as long as needed to provide the app.",
        "You can request deletion of your account and saved app data by contacting us from the email linked to your account.",
      ],
    },
    {
      title: "9. Your rights",
      paragraphs: [
        "Depending on where you live, you may have rights to access, correct, export, or delete your personal data.",
        `To make a request, contact us at: ${SUPPORT_EMAIL}`,
      ],
    },
    {
      title: "10. Children",
      paragraphs: [
        "ForgeTimer is not designed for children under 13. If you believe a child has provided personal data, contact us and we will review the request.",
      ],
    },
    {
      title: "11. Changes",
      paragraphs: [
        "We may update this Privacy Policy when the app changes. The updated version will be posted on this page.",
      ],
    },
    {
      title: "12. Contact",
      paragraphs: [
        `For privacy questions or deletion requests, contact: ${SUPPORT_EMAIL}`,
      ],
    },
  ],
};

const termsContent: LegalPageContent = {
  title: "Terms of Service",
  updatedAt: "May 10, 2026",
  intro: [
    "These Terms explain the basic rules for using ForgeTimer.",
    "ForgeTimer is a productivity timer and progress tracking app operated by an independent developer.",
    "By using ForgeTimer, you agree to these Terms.",
  ],
  sections: [
    {
      title: "1. What ForgeTimer is",
      paragraphs: [
        "ForgeTimer helps you run focus/break timers, save notes, track progress, and view productivity-related stats.",
        "ForgeTimer is a small independent project. It may change over time, especially if there is user demand.",
      ],
    },
    {
      title: "2. Accounts",
      paragraphs: [
        "You can use ForgeTimer as a guest or sign in to save data to your account.",
        "If you use ForgeTimer as a guest, your data is stored locally in your browser. If you clear browser data or switch devices, guest data may be lost.",
        "If you sign in, you are responsible for keeping access to your account secure.",
      ],
    },
    {
      title: "3. User content",
      paragraphs: [
        "You keep ownership of notes or other content you enter into ForgeTimer.",
        "You give ForgeTimer permission to store and display that content back to you as part of the app.",
        "Do not store passwords, payment card details, illegal content, or highly sensitive information in notes.",
      ],
    },
    {
      title: "4. Acceptable use",
      paragraphs: ["Do not:"],
      bullets: [
        "try to access another user's account or data;",
        "attack, overload, scrape, or disrupt the app;",
        "abuse authentication, database, or hosting systems;",
        "use the app for illegal activity.",
      ],
    },
    {
      title: "5. Donations",
      paragraphs: [
        "ForgeTimer may include links to Ko-fi or other third-party donation services.",
        "Donations are optional and handled by the third-party provider. ForgeTimer does not directly process payment details.",
        "Donations do not guarantee specific features, support, uptime, or future development unless explicitly stated elsewhere.",
      ],
    },
    {
      title: "6. Paid features",
      paragraphs: [
        "ForgeTimer is currently a small project and may remain free. Paid features may be added in the future.",
        "If paid features are introduced, the relevant pricing and terms will be explained before purchase.",
      ],
    },
    {
      title: "7. No professional advice",
      paragraphs: [
        "ForgeTimer is a productivity tool. It is not medical, psychological, financial, or professional advice.",
        "If productivity problems are connected to health, stress, anxiety, depression, or other serious issues, consider speaking with a qualified professional.",
      ],
    },
    {
      title: "8. Availability",
      paragraphs: [
        "ForgeTimer is provided \"as is\" and \"as available.\"",
        "The app may contain bugs, lose availability, change features, or stop operating. Software, tragically, does software things.",
      ],
    },
    {
      title: "9. Limitation of liability",
      paragraphs: [
        "To the maximum extent allowed by law, ForgeTimer and its operator are not liable for indirect, incidental, special, or consequential damages related to your use of the app.",
      ],
    },
    {
      title: "10. Account deletion",
      paragraphs: [
        "You can request deletion of your account and saved app data by contacting us from the email linked to your account.",
      ],
    },
    {
      title: "11. Changes to these Terms",
      paragraphs: [
        "We may update these Terms when the app changes. The updated version will be posted on this page.",
      ],
    },
    {
      title: "12. Contact",
      paragraphs: [`For questions about these Terms, contact: ${SUPPORT_EMAIL}`],
    },
  ],
};

const legalContentByKind: Record<LegalPageKind, LegalPageContent> = {
  privacy: privacyContent,
  terms: termsContent,
};

export function LegalPage({ kind }: { kind: LegalPageKind }) {
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );
  const content = legalContentByKind[kind];

  return (
    <main
      className={`legal-page legal-page--${activeSkin.id}`}
      style={skinCssVariables}
    >
      <article className="legal-page__panel">
        <nav className="legal-page__nav" aria-label="Legal pages">
          <a href="/">ForgeTimer</a>
          <span aria-hidden="true">/</span>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>

        <header className="legal-page__header">
          <h1>{content.title}</h1>
          <p>Last updated: {content.updatedAt}</p>
        </header>

        <div className="legal-page__body">
          {content.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}

          {content.sections.map((section) => (
            <section key={section.title} className="legal-page__section">
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
