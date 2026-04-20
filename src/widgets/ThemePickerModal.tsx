import { memo, useMemo } from "react";
import { createPortal } from "react-dom";
import { mapSkinToCssVariables } from "@shared/skins/cssVars";
import { listSkins } from "@shared/skins/catalog";
import { useSkinStore } from "@shared/stores/skinStore";
import { useUIStore } from "@shared/stores/uiStore";

const skins = listSkins();

export const ThemePickerModal = memo(function ThemePickerModal() {
  const isOpen = useUIStore((state) => state.isThemePickerModalOpen);
  const setThemePickerModalOpen = useUIStore(
    (state) => state.setThemePickerModalOpen,
  );
  const activeSkin = useSkinStore((state) => state.activeSkin);
  const setActiveSkinId = useSkinStore((state) => state.setActiveSkinId);
  const skinCssVariables = useMemo(
    () => mapSkinToCssVariables(activeSkin),
    [activeSkin],
  );

  if (!isOpen) {
    return null;
  }

  const closeModal = () => setThemePickerModalOpen(false);

  const modal = (
    <div
      className={`theme-picker-modal__overlay theme-picker-modal__overlay--${activeSkin.id}`}
      style={skinCssVariables}
      onClick={closeModal}
    >
      <div
        className="theme-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="theme-picker-modal__header">
          <div>
            <p className="theme-picker-modal__eyebrow">Appearance</p>
            <h2 id="theme-picker-title">Theme Picker</h2>
          </div>
          <button
            type="button"
            className="theme-picker-modal__close"
            onClick={closeModal}
            aria-label="Close theme picker"
          >
            X
          </button>
        </header>

        <div className="theme-picker-modal__body">
          <p className="theme-picker-modal__intro">
            Switch the visual mood instantly. Layout stays unchanged, only the
            skin updates.
          </p>

          <div
            className="theme-picker-modal__grid"
            role="radiogroup"
            aria-label="Available themes"
          >
            {skins.map((skin) => {
              const isActive = skin.id === activeSkin.id;

              return (
                <button
                  key={skin.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`theme-picker-modal__option${
                    isActive ? " is-active" : ""
                  }`}
                  onClick={() => setActiveSkinId(skin.id)}
                >
                  <span className="theme-picker-modal__option-top">
                    <span className="theme-picker-modal__option-title">
                      {skin.label}
                    </span>
                    <span className="theme-picker-modal__option-state">
                      {isActive ? "Active" : "Apply"}
                    </span>
                  </span>
                  <span className="theme-picker-modal__option-description">
                    {skin.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
});
