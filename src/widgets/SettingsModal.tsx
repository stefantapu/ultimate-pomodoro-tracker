import { useUIStore } from "@shared/stores/uiStore";
import { createPortal } from "react-dom";

type SettingsModalProps = {
  autoFocus: boolean;
  autoBreak: boolean;
  soundEnabled: boolean;
  onToggleAutoFocus: () => void;
  onToggleAutoBreak: () => void;
  onToggleSound: () => void;
};

export function SettingsModal({
  autoFocus,
  autoBreak,
  soundEnabled,
  onToggleAutoFocus,
  onToggleAutoBreak,
  onToggleSound,
}: SettingsModalProps) {
  const isOpen = useUIStore((state) => state.isSettingsModalOpen);
  const setSettingsModalOpen = useUIStore((state) => state.setSettingsModalOpen);

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    setSettingsModalOpen(false);
  };

  const modal = (
    <div className="settings-modal__overlay" onClick={handleCancel}>
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="settings-modal__header">
          <h2 id="settings-modal-title">Settings</h2>
          <button
            type="button"
            className="settings-modal__close"
            onClick={handleCancel}
            aria-label="Close settings"
          >
            X
          </button>
        </header>

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Timer Preferences</h3>
          <div className="settings-modal__toggles">
            <label className="settings-modal__toggle">
              <input
                type="checkbox"
                checked={autoFocus}
                onChange={onToggleAutoFocus}
              />
              <span>Auto Focus</span>
            </label>
            <label className="settings-modal__toggle">
              <input
                type="checkbox"
                checked={autoBreak}
                onChange={onToggleAutoBreak}
              />
              <span>Auto Break</span>
            </label>
            <label className="settings-modal__toggle">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={onToggleSound}
              />
              <span>Sound</span>
            </label>
          </div>
        </section>

        <footer className="settings-modal__footer">
          <button
            type="button"
            className="settings-modal__button settings-modal__button--primary"
            onClick={handleCancel}
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}
