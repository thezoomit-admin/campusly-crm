import { describe, expect, it } from "vitest";
import {
  parseLeadDetailsTab,
  resolveActiveLeadTab,
  resolveLeadDetailsTabRole,
  resolveLeadDetailsTabs,
  type LeadTabAccess,
} from "@/modules/leads/utils/leadDetails";

const fullAccess: LeadTabAccess = {
  canViewServices: true,
  canViewWhatsApp: true,
  canViewEmail: true,
  canViewPayments: true,
  showFileDocuments: false,
};

const counts = { documents: 3, notes: 0, activities: 2 };

describe("resolveLeadDetailsTabs", () => {
  it("keeps daily tabs in front and the rest under More for the default layout", () => {
    const { primary, more } = resolveLeadDetailsTabs("admin", fullAccess, counts);
    expect(primary.map((tab) => tab.key)).toEqual([
      "overview",
      "activities",
      "notes",
      "documents",
      "whatsapp",
    ]);
    expect(more.map((tab) => tab.key)).toEqual([
      "email",
      "services",
      "payments",
      "assignments",
    ]);
    expect(primary.find((tab) => tab.key === "documents")).toMatchObject({
      label: "Documents",
      badgeCount: 3,
    });
    expect(primary.find((tab) => tab.key === "notes")?.badgeCount).toBeUndefined();
    expect(primary.find((tab) => tab.key === "activities")?.badgeCount).toBe(2);
  });

  it("hides Payments for counsellors", () => {
    const { primary, more } = resolveLeadDetailsTabs(
      "counsellor",
      fullAccess,
    );
    expect(primary.map((tab) => tab.key)).toEqual([
      "overview",
      "activities",
      "notes",
      "documents",
      "whatsapp",
    ]);
    expect(more.map((tab) => tab.key)).not.toContain("payments");
    expect(more.map((tab) => tab.label)).toEqual([
      "Email",
      "Service & Package",
      "Assignment History",
    ]);
  });

  it("promotes Payments and moves WhatsApp into More for accountants", () => {
    const { primary, more } = resolveLeadDetailsTabs("accountant", fullAccess);
    expect(primary.map((tab) => tab.key)).toEqual([
      "overview",
      "payments",
      "activities",
      "notes",
      "documents",
    ]);
    expect(more.map((tab) => tab.key)).toEqual([
      "email",
      "services",
      "assignments",
      "whatsapp",
    ]);
  });

  it("drops More items the role cannot access", () => {
    const { more } = resolveLeadDetailsTabs("admin", {
      ...fullAccess,
      canViewEmail: false,
      canViewServices: false,
      canViewPayments: false,
    });
    expect(more.map((tab) => tab.key)).toEqual(["assignments"]);
  });

  it("maps counsellor spelling onto the counselor layout", () => {
    expect(resolveLeadDetailsTabRole("counsellor")).toBe("counselor");
    expect(resolveLeadDetailsTabRole("counselor")).toBe("counselor");
    expect(resolveLeadDetailsTabRole("manager")).toBe("default");
  });
});

describe("lead details tab url and memory", () => {
  it("accepts the documents key and the older attachments key", () => {
    expect(parseLeadDetailsTab("documents")).toBe("documents");
    expect(parseLeadDetailsTab("attachments")).toBe("documents");
    expect(parseLeadDetailsTab("more", "email")).toBe("email");
    expect(parseLeadDetailsTab("more", "payments")).toBe("payments");
  });

  it("uses the shared url tab, then the remembered tab, then overview", () => {
    const visible = [
      "overview",
      "activities",
      "notes",
      "documents",
      "whatsapp",
      "email",
    ] as const;

    expect(
      resolveActiveLeadTab({
        tabParam: "attachments",
        sectionParam: null,
        visibleKeys: visible,
        storedKey: "notes",
      }),
    ).toBe("documents");

    expect(
      resolveActiveLeadTab({
        tabParam: null,
        sectionParam: null,
        visibleKeys: visible,
        storedKey: "whatsapp",
      }),
    ).toBe("whatsapp");

    expect(
      resolveActiveLeadTab({
        tabParam: null,
        sectionParam: null,
        visibleKeys: visible,
        storedKey: "payments",
      }),
    ).toBe("overview");
  });
});
