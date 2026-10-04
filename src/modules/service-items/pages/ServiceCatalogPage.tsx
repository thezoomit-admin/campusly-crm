import { Button } from "antd";
import { useCallback, useState } from "react";
import { PageMeta } from "@/components/common/Meta";
import { PageHeader } from "@/components/common/Navigation";
import { PackagesPage } from "@/modules/packages";
import { adminCard, adminPage } from "@/styles/admin";
import ServiceItemsPage from "./ServiceItemsPage";

type CatalogTab = "services" | "packages" | "charges";

export type CatalogCreateAction = {
  label: string;
  onClick: () => void;
};

const TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "services", label: "Services" },
  { key: "packages", label: "Packages" },
  { key: "charges", label: "Charges" },
];

export default function ServiceCatalogPage() {
  const [tab, setTab] = useState<CatalogTab>("services");
  const [createAction, setCreateAction] = useState<CatalogCreateAction | null>(
    null,
  );
  const registerCreate = useCallback((action: CatalogCreateAction | null) => {
    setCreateAction(action);
  }, []);

  return (
    <div className={adminPage}>
      <PageMeta
        title="Service & Package Management"
        description="Manage services, package templates, and the charges used in lead offers."
      />
      <PageHeader
        title="Service & Package Management"
        subtitle="Packages are templates. A lead offer keeps the price copied at the time it was created."
        breadcrumbs={[
          { title: "Dashboard", path: "/dashboard" },
          { title: "Service & Package Management" },
        ]}
        extra={
          createAction ? (
            <Button type="primary" onClick={createAction.onClick}>
              {createAction.label}
            </Button>
          ) : null
        }
      />
      <div
        className="flex gap-2 px-px"
        role="tablist"
        aria-label="Service catalog"
      >
        {TABS.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`rounded-lg cursor-pointer border px-4 py-1.5 text-sm font-medium ${
                active
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text-muted"
              }`}
              onClick={() => {
                setCreateAction(null);
                setTab(item.key);
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {tab === "services" ? (
        <ServiceItemsPage embedded onCreateAction={registerCreate} />
      ) : null}
      {tab === "packages" ? (
        <PackagesPage onCreateAction={registerCreate} />
      ) : null}
      {tab === "charges" ? (
        <div className={`${adminCard} px-4 py-10 text-center`}>
          <p className="m-0 text-base font-semibold">Custom charges</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            One-off charges are added on a lead’s own offer. They are not stored
            as package templates.
          </p>
        </div>
      ) : null}
    </div>
  );
}
