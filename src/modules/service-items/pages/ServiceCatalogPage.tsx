import { Button } from "antd";
import { useCallback, useState } from "react";
import { PageMeta } from "@/components/common/Meta";
import { PageHeader } from "@/components/common/Navigation";
import { PackagesPage } from "@/modules/packages";
import { adminPage } from "@/styles/admin";
import ServiceItemsPage from "./ServiceItemsPage";

type CatalogTab = "services" | "packages";

export type CatalogCreateAction = {
  label: string;
  onClick: () => void;
};

const TABS: Array<{ key: CatalogTab; label: string }> = [
  { key: "services", label: "Services" },
  { key: "packages", label: "Packages" },
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
        description="Manage services and package templates used in lead offers."
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
    </div>
  );
}
