import { useEffect, useState } from "react";
import { trackProductEvent } from "../shared/lib/productAnalytics";
import styles from "./HomepageContent.module.css";
import {
  getInitialHomepageContentMode,
  persistHomepageContentMode,
  type HomepageContentMode,
} from "./homepageContentMode";

const faqItems = [
  {
    question: "Can I change the focus and break durations?",
    answer:
      "Yes. Open Settings to choose the focus and break lengths that fit your session.",
  },
  {
    question: "Do I need an account to use the timer?",
    answer:
      "No. You can run focus and break sessions as a guest. Sign in when you want account-based notes, analytics, streaks, progress, and cloud sync.",
  },
  {
    question: "Can I use Forge Timer for studying and deep work?",
    answer:
      "Yes. The timer supports repeatable focus and break blocks for studying, writing, coding, and other concentrated work.",
  },
  {
    question: "What happens to my settings?",
    answer:
      "Timer settings are stored in the browser. When you sign in, supported settings and account features can sync through your account.",
  },
] as const;

export function HomepageContent() {
  const [mode, setMode] = useState<HomepageContentMode | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const systemPrefersDark =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      setMode(
        getInitialHomepageContentMode(
          window.localStorage,
          systemPrefersDark,
        ),
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleMode = () => {
    const nextMode = mode === "dark" ? "light" : "dark";
    setMode(nextMode);
    persistHomepageContentMode(window.localStorage, nextMode);
  };

  const handleCtaClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackProductEvent({ name: "seo_cta_click", source: "homepage_cta" });

    const timerAction = document.getElementById("forge-timer-primary-action");
    if (!(timerAction instanceof HTMLButtonElement)) {
      return;
    }

    event.preventDefault();
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    timerAction.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
    timerAction.focus({ preventScroll: true });
  };

  const modeLabel = mode
    ? `Switch content to ${mode === "dark" ? "light" : "dark"} mode`
    : "Toggle content color mode";

  return (
    <section
      className={styles.content}
      data-color-mode={mode ?? undefined}
      aria-labelledby="homepage-content-title"
    >
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.modeRow}>
            <span className={styles.eyebrow}>Focus becomes progress</span>
            <button
              className={styles.modeToggle}
              type="button"
              aria-label={modeLabel}
              aria-pressed={mode === "dark"}
              onClick={toggleMode}
            >
              <span aria-hidden="true">{mode === "dark" ? "☀" : "☾"}</span>
              <span>{mode === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
          <h1 id="homepage-content-title">
            Forge Timer: A Gamified Pomodoro Timer for Visible Progress
          </h1>
          <p className={styles.lead}>
            Turn every focus session into XP, levels, streaks, and progress you
            can see.
          </p>
        </header>

        <main className={styles.main}>
          <section className={styles.intro} aria-labelledby="what-is-forge-timer">
            <h2 id="what-is-forge-timer">What is Forge Timer?</h2>
            <p>
              Forge Timer is a browser-based Pomodoro timer that makes focused
              work feel like progression. Run a focus session, take a deliberate
              break, and build a visible record of the time you complete.
            </p>
            <p>
              The timer works without an account. Sign in when you want
              account-based progress, notes, analytics, streaks, and cloud sync.
            </p>
          </section>

          <section className={styles.method} aria-labelledby="pomodoro-method">
            <div>
              <h2 id="pomodoro-method">How the Pomodoro method works</h2>
              <p>
                The Pomodoro method divides work into focused intervals followed
                by short breaks. A common starting rhythm is 25 minutes of focus
                and 5 minutes of rest, and Forge Timer lets you adjust both
                durations to fit your work.
              </p>
            </div>
            <ol className={styles.steps}>
              <li>Choose one task for the session.</li>
              <li>Set your focus and break durations.</li>
              <li>
                Start the timer and work on that task until the interval ends.
              </li>
              <li>
                Take the break, then begin the next focus session when you are
                ready.
              </li>
            </ol>
          </section>

          <div className={styles.featureGrid}>
            <section>
              <h2>Turn focus into progress</h2>
              <p>
                Completed focus time becomes visible progress. Signed-in users
                can build XP and levels, maintain streaks, and review analytics
                that show how their focus practice changes over time.
              </p>
            </section>
            <section>
              <h2>Make focus feel like your space</h2>
              <p>
                Choose a visual theme, adjust timer settings, and use ambient
                audio to create a focus environment that feels distinct without
                changing the Pomodoro rhythm underneath it.
              </p>
            </section>
            <section>
              <h2>Use it instantly, save progress when ready</h2>
              <p>
                Guests can open Forge Timer and use the focus and break timers
                without creating an account. An account unlocks notes, long-term
                analytics, streak tracking, progress tracking, and cloud sync.
              </p>
            </section>
          </div>

          <section className={styles.faq} aria-labelledby="homepage-faq-title">
            <h2 id="homepage-faq-title">Frequently asked questions</h2>
            <div className={styles.faqList}>
              {faqItems.map((item) => (
                <article key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.cta} aria-labelledby="homepage-cta-title">
            <div>
              <h2 id="homepage-cta-title">Ready for your next focus session?</h2>
              <p>Choose a task, set the timer, and make the work visible.</p>
            </div>
            <a
              className={styles.ctaLink}
              href="#forge-timer-primary-action"
              onClick={handleCtaClick}
            >
              Start focusing
            </a>
          </section>
        </main>

        <footer className={styles.footer}>
          <p>Forge Timer is an independent project built by Stefan Tapu.</p>
          <nav aria-label="Forge Timer footer">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a
              href="https://www.linkedin.com/in/stefan-tapu/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn — Stefan Tapu
            </a>
            <a href="#root">Back to timer</a>
          </nav>
        </footer>
      </div>
    </section>
  );
}
