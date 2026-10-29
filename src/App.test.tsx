import {
  fireEvent,
  render,
  screen,
  within,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
beforeEach(() => {
  localStorage.setItem("orbita-language", "pl");
  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe("accessible 2D atlas", () => {
  it("keeps astronomical data and focus navigation available without WebGL", () => {
    render(<App />);
    const trigger = screen.getByRole("button", { name: "Wybierz Mars" });
    trigger.focus();
    fireEvent.click(trigger);
    const panel = screen.getByRole("region", { name: "Informacje o obiekcie" });
    expect(within(panel).getByRole("heading", { name: "Mars" })).toHaveFocus();
    expect(panel).toHaveTextContent(/6\s?779/);
    fireEvent.click(
      within(panel).getByRole("button", { name: "Zamknij informacje" }),
    );
    expect(trigger).toHaveFocus();
    expect(
      screen.queryByRole("region", { name: "Informacje o obiekcie" }),
    ).toBeNull();
  });
  it("starts with reduced motion paused but permits an explicit resume and resets consistently", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Ogranicz animacje" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Wznów symulację" }));
    expect(
      screen.getByRole("button", { name: "Wstrzymaj symulację" }),
    ).toBeEnabled();
    fireEvent.change(
      screen.getByRole("slider", { name: "Szybkość symulacji" }),
      { target: { value: "31" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Resetuj symulację" }));
    expect(screen.getByRole("slider")).toHaveValue("8");
    expect(
      screen.getByRole("button", { name: "Wznów symulację" }),
    ).toBeEnabled();
  });
  it("can end a tour at an intermediate stop without losing the selected description", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Wybierz Ziemia" }));
    fireEvent.click(screen.getByRole("button", { name: "Rozpocznij podróż" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Następny przystanek" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Zakończ podróż" }));
    expect(screen.getByRole("heading", { name: "Ziemia" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Następny przystanek" }),
    ).toBeNull();
  });
});
