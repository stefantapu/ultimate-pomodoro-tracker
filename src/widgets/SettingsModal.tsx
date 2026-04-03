import { listSkins } from "@shared/skins/catalog";
import type { SkinId } from "@shared/skins/types";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";
import { useMemo, useState } from "react";

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
  const activeSkinId = useSkinStore((state) => state.activeSkinId);
  const setActiveSkinId = useSkinStore((state) => state.setActiveSkinId);
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId | null>(null);

  const skins = useMemo(() => listSkins(), []);

  if (!isOpen) {
    return null;
  }

  const effectiveSelectedSkinId = selectedSkinId ?? activeSkinId;

  const handleCancel = () => {
    setSelectedSkinId(null);
    setSettingsModalOpen(false);
  };

  const handleApply = () => {
    setActiveSkinId(effectiveSelectedSkinId);
    setSelectedSkinId(null);
    setSettingsModalOpen(false);
  };

  return (
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

        <section className="settings-modal__section">
          <h3 className="settings-modal__section-title">Skin</h3>
        <div className="settings-modal__options">
          {skins.map((skin) => {
            const isSelected = effectiveSelectedSkinId === skin.id;

            return (
              <label
                key={skin.id}
                className={`settings-modal__option${isSelected ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="skin-selection"
                  value={skin.id}
                  checked={isSelected}
                  onChange={() => setSelectedSkinId(skin.id)}
                />
                <div className="settings-modal__option-content">
                  <div className="settings-modal__option-top">
                    <span className="settings-modal__option-label">{skin.label}</span>
                    <span
                      className="settings-modal__swatch"
                      style={{ background: skin.colors.accent }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="settings-modal__option-description">
                    {skin.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        </section>

        <footer className="settings-modal__footer">
          <button
            type="button"
            className="settings-modal__button settings-modal__button--secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="settings-modal__button settings-modal__button--primary"
            onClick={handleApply}
          >
            Apply
          </button>
        </footer>
      </div>
    </div>
  );
}
