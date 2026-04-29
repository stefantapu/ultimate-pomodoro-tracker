/* eslint-disable react-refresh/only-export-components */
import type { PropsWithChildren, ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { AuthContext, type AuthContextType } from "@app/providers/auth-context";

type ExtendedRenderOptions = Omit<RenderOptions, "wrapper"> & {
  auth?: Partial<AuthContextType>;
};

export function createAuthValue(
  overrides: Partial<AuthContextType> = {},
): AuthContextType {
  return {
    user: null,
    session: null,
    loading: false,
    ...overrides,
  };
}

function Providers({
  children,
  auth,
}: PropsWithChildren<{ auth: AuthContextType }>) {
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function renderWithProviders(
  ui: ReactElement,
  options: ExtendedRenderOptions = {},
) {
  const { auth, ...renderOptions } = options;
  const value = createAuthValue(auth);

  return render(ui, {
    wrapper: ({ children }) => <Providers auth={value}>{children}</Providers>,
    ...renderOptions,
  });
}

export function flushPromises() {
  return new Promise<void>((resolve) => {
    queueMicrotask(() => resolve());
  });
}
