import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("firebase/auth", () => ({
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
}));

vi.mock("@/data/adapters/firebase/auth-client", () => ({
  getFirebaseAuth: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("LoginForm", () => {
  it("keeps the password hidden by default and toggles it accessibly", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        firebaseAvailable
        serviceUnavailable={false}
        clearSession={false}
        sessionExpired={false}
        localFallbackAvailable={false}
      />,
    );

    const password = screen.getByLabelText("Contraseña");
    expect(password).toHaveAttribute("type", "password");
    password.focus();

    const showPassword = screen.getByRole("button", {
      name: "Mostrar contraseña",
    });
    expect(showPassword).toHaveAttribute("type", "button");
    await user.click(showPassword);

    expect(password).toHaveAttribute("type", "text");
    expect(password).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Tab}");
    await user.keyboard("{Enter}");
    expect(password).toHaveAttribute("type", "password");
  });

  it("refreshes claims once when the server provisions initial access", async () => {
    const user = userEvent.setup();
    const getIdToken = vi
      .fn()
      .mockResolvedValueOnce("initial-token")
      .mockResolvedValueOnce("refreshed-token");
    mocks.signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { getIdToken },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 409,
        ok: false,
        json: async () => ({ refreshRequired: true }),
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ role: "presentation_viewer" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <LoginForm
        firebaseAvailable
        serviceUnavailable={false}
        clearSession={false}
        sessionExpired={false}
        localFallbackAvailable={false}
      />,
    );
    await user.type(
      screen.getByLabelText("Correo electrónico"),
      "cliente@example.com",
    );
    await user.type(screen.getByLabelText("Contraseña"), "Clave-Segura-1!");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    await vi.waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/admin");
    });
    expect(getIdToken).toHaveBeenNthCalledWith(1);
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(secondRequest.body as string)).toEqual({
      idToken: "refreshed-token",
    });
  });
});
