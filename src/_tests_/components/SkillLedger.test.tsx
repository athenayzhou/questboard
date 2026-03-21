import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkillLedger } from "../../components/overlay/SkillLedger";
import { useOverlay } from "../../store/overlay";
import { useSkillStore } from "../../store/skill";
import { createTestSkill, resetAllStores } from "../../test/utils";

vi.mock("../../store/xpEvent", () => ({
  useXPEventStore: (selector: (s: { events: unknown[] }) => unknown) =>
    selector({ events: [] }),
}));

describe("SkillLedger", () => {
  beforeEach(() => {
    resetAllStores();
    useOverlay.setState({ activeOverlay: "skills" });
    useSkillStore.setState({ skills: {} });
  });

  it("should render skill ledger header", () => {
    render(<SkillLedger />);
    expect(screen.getByText("skill ledger")).toBeInTheDocument();
  });

  it("should render close button", () => {
    render(<SkillLedger />);
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("should show select message when nothing selected", () => {
    render(<SkillLedger />);
    expect(
      screen.getByText("select a path or skill to see details")
    ).toBeInTheDocument();
  });

  it("should display skills when store has skills", () => {
    const skill = createTestSkill({ id: "s1", name: "Cooking" });
    useSkillStore.setState({ skills: { s1: skill } });
    render(<SkillLedger />);
    expect(screen.getByText("Cooking")).toBeInTheDocument();
  });

  it("should filter skills by search", async () => {
    const user = userEvent.setup();
    const s1 = createTestSkill({ id: "s1", name: "Cooking" });
    const s2 = createTestSkill({ id: "s2", name: "Cleaning" });
    useSkillStore.setState({ skills: { s1, s2 } });
    render(<SkillLedger />);
    const searchInput = screen.getByPlaceholderText("search...");
    await user.type(searchInput, "Cook");
    expect(screen.getByText("Cooking")).toBeInTheDocument();
    expect(screen.queryByText("Cleaning")).not.toBeInTheDocument();
  });
});
