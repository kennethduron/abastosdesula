import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/data/adapters/firebase/auth-client", () => ({
  getFirebaseAuth: vi.fn(),
}));

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
});
