import { UserDropdown } from "@/components/common/Dropdowns";
import { PageLoader } from "@/components/common/Loading";
import { GlobalSearch } from "@/components/common/Search";
import { NavIcon, ThemeToggle } from "@/components/ui";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  Logout03Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { APP_NAV_GROUPS, type NavItem } from "../config/navigation";
import { useAuth } from "../hooks/useAuth";
import { hasPermission } from "../lib/access";
import type { AuthSession } from "../types";

import NotificationBell from "../modules/notifications/components/NotificationBell";

const ICON_BTN =
  "relative grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-icon hover:bg-hover-bg";

function displayName(auth: AuthSession | null | undefined) {
  if (auth?.user?.fullName) {
    return auth.user.fullName;
  }
  const raw = auth?.user?.username || auth?.user?.email || "User";
  const first = String(raw).split(/[.@]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function ChevronsIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {direction === "right" ? (
        <>
          <path d="m6 17 5-5-5-5" />
          <path d="m13 17 5-5-5-5" />
        </>
      ) : (
        <>
          <path d="m11 17-5-5 5-5" />
          <path d="m18 17-5-5 5-5" />
        </>
      )}
    </svg>
  );
}

function navLinkClass({
  isActive = false,
  sub = false,
  collapsed = false,
}: {
  isActive?: boolean;
  sub?: boolean;
  collapsed?: boolean;
}) {
  return [
    "flex items-center gap-2.5 rounded-xl px-3 py-[7px] text-[0.92rem] text-nav no-underline",
    "transition-[background-color,color] duration-200 ease-in-out [&_svg]:shrink-0 [&_svg]:text-icon [&_svg]:transition-colors [&_svg]:duration-200 [&_svg]:ease-in-out",
    sub ? "pl-10 text-[0.86rem]" : "",
    isActive
      ? "bg-nav-active-bg font-semibold text-nav-active [&_svg]:text-nav-active hover:bg-nav-active-bg hover:text-nav-active"
      : "hover:bg-nav-hover-bg hover:text-nav-active hover:[&_svg]:text-nav-active",
    collapsed
      ? "max-[960px]:justify-start max-[960px]:px-3 max-[960px]:py-[9px] justify-center px-0 py-2.5"
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

const NESTED_LEAD_PAGES = ["/leads/pool", "/leads/mine"];

function matchesPath(pathname: string, to: string): boolean {
  if (pathname !== to && !pathname.startsWith(`${to}/`)) {
    return false;
  }
  if (to === "/leads") {
    return !NESTED_LEAD_PAGES.some((path) => matchesPath(pathname, path));
  }
  return true;
}

function menuContainsPath(item: NavItem, pathname: string) {
  return (
    item.children?.some((child) => matchesPath(pathname, child.to)) ?? false
  );
}

export default function AppLayout() {
  const auth = useOutletContext<AuthSession>();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(APP_NAV_GROUPS.map((group) => [group.id, true])),
  );
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      APP_NAV_GROUPS.flatMap((group) => group.items)
        .filter((item) => item.children?.length)
        .map((item) => [item.to, menuContainsPath(item, location.pathname)]),
    ),
  );
  const name = useMemo(() => displayName(auth), [auth]);
  const user = auth?.user;
  const navGroups = useMemo(
    () =>
      APP_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.permission || hasPermission(auth, item.permission),
        ),
      })).filter((group) => group.items.length > 0),
    [auth],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 960px)");

    function syncLayout() {
      if (media.matches) {
        setCollapsed(false);
      } else {
        setMobileNavOpen(false);
      }
    }

    media.addEventListener("change", syncLayout);
    return () => media.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    setOpenMenus((current) => {
      const next = { ...current };
      for (const group of APP_NAV_GROUPS) {
        for (const item of group.items) {
          if (menuContainsPath(item, location.pathname)) {
            next[item.to] = true;
          }
        }
      }
      return next;
    });
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function toggleGroup(id: string) {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleMenu(path: string) {
    setOpenMenus((current) => ({ ...current, [path]: !current[path] }));
  }

  const shellCols = collapsed
    ? "grid-cols-[var(--spacing-sidebar-collapsed)_1fr]"
    : "grid-cols-[var(--spacing-sidebar)_1fr]";

  const labelHidden = collapsed ? "hidden max-[960px]:inline" : "";
  const groupTitleHidden = collapsed ? "hidden max-[960px]:flex" : "flex";

  function renderNavItem(item: NavItem) {
    const children = item.children?.filter(
      (child) => !child.permission || hasPermission(auth, child.permission),
    );
    if (!children?.length) {
      return (
        <NavLink
          key={item.to}
          to={item.to}
          className={() =>
            navLinkClass({
              isActive: matchesPath(location.pathname, item.to),
              collapsed,
            })
          }
          title={item.label}
        >
          <NavIcon name={item.icon} />
          <span className={labelHidden}>{item.label}</span>
        </NavLink>
      );
    }

    const childActive = children.some((child) =>
      matchesPath(location.pathname, child.to),
    );
    const isOpen = collapsed || openMenus[item.to];

    if (collapsed) {
      return (
        <NavLink
          key={item.to}
          to={children[0].to}
          className={() => navLinkClass({ isActive: childActive, collapsed })}
          title={item.label}
        >
          <NavIcon name={item.icon} />
          <span className={labelHidden}>{item.label}</span>
        </NavLink>
      );
    }

    return (
      <div key={item.to} className="grid gap-1.5">
        <button
          type="button"
          className={[
            navLinkClass({ isActive: false }),
            "w-full cursor-pointer border-0 bg-transparent text-left font-normal font-[inherit] leading-[inherit]",
            childActive ? "text-nav-active [&_svg]:text-nav-active" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-expanded={isOpen}
          onClick={() => toggleMenu(item.to)}
        >
          <NavIcon name={item.icon} />
          <span>{item.label}</span>
          <HugeiconsIcon
            className={`ml-auto shrink-0 transition-transform duration-[280ms] ease-in-out${isOpen ? " rotate-90" : ""}`}
            icon={ArrowRight01Icon}
            size={12}
            color="currentColor"
            strokeWidth={1.5}
          />
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-[280ms] ease-in-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="min-h-0 overflow-hidden">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                className={() =>
                  navLinkClass({
                    isActive: matchesPath(location.pathname, child.to),
                    sub: true,
                  })
                }
                title={child.label}
              >
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <PageLoader />;
  }

  return (
    <div
      className={[
        "h-screen min-h-screen overflow-hidden transition-[grid-template-columns] duration-200 ease-in-out",
        "grid grid-rows-[auto_minmax(0,1fr)]",
        shellCols,
        "max-[960px]:flex max-[960px]:flex-col max-[960px]:h-auto max-[960px]:min-h-screen max-[960px]:overflow-visible max-[960px]:grid-cols-none",
      ].join(" ")}
    >
      <header
        className={[
          "relative z-30 col-span-full grid min-h-16 overflow-visible border-b border-header-border bg-surface",
          shellCols,
          "max-[960px]:sticky max-[960px]:top-0 max-[960px]:z-50 max-[960px]:flex max-[960px]:w-full max-[960px]:flex-wrap max-[960px]:items-center max-[960px]:grid-cols-none",
        ].join(" ")}
      >
        <div
          className={[
            "flex w-full items-center justify-center overflow-hidden border-r border-header-border bg-sidebar-bg px-2 py-2.5",
            collapsed ? "px-1 max-[960px]:justify-start max-[960px]:px-4" : "",
            "max-[960px]:min-w-0 max-[960px]:flex-[1_1_auto] max-[960px]:justify-start max-[960px]:border-r-0 max-[960px]:bg-surface",
            "max-[640px]:px-3 max-[640px]:py-2",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            type="button"
            className="mr-1 hidden size-9 shrink-0 cursor-pointer place-items-center rounded-[10px] border-0 bg-transparent text-text-strong hover:bg-hover-bg max-[960px]:grid"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <HugeiconsIcon
              icon={mobileNavOpen ? Cancel01Icon : Menu01Icon}
              size={20}
              color="currentColor"
              strokeWidth={1.5}
            />
          </button>
          <span className="flex h-14 w-full min-w-0 items-center justify-center overflow-hidden">
            <span className="flex max-w-full items-center justify-center">
              <img
                src="/campusly_logo_icon.png"
                alt={collapsed ? "Campusly" : ""}
                aria-hidden={collapsed ? undefined : true}
                className="h-14 w-auto shrink-0 object-contain"
              />
              <span
                className={[
                  "grid overflow-hidden transition-[grid-template-columns,opacity] duration-200 ease-in-out",
                  collapsed
                    ? "grid-cols-[0fr] opacity-0"
                    : "grid-cols-[1fr] opacity-100",
                ].join(" ")}
                aria-hidden={collapsed}
              >
                <span className="min-w-0 overflow-hidden pl-2.5">
                  <img
                    src="/logo_icon2.png"
                    alt="Campusly"
                    className="h-11 w-auto max-w-none object-contain"
                  />
                </span>
              </span>
            </span>
          </span>
        </div>

        <div className="relative flex items-center justify-between gap-4 py-2.5 pr-6 pl-7 max-[1100px]:pr-4 max-[960px]:contents">
          <button
            type="button"
            className="absolute top-1/2 left-0 z-[4] grid size-[26px] -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-header-border bg-collapse-bg text-icon shadow-[0_2px_8px_rgb(47_59_70_/_0.08)] max-[960px]:hidden"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            <ChevronsIcon direction={collapsed ? "right" : "left"} />
          </button>

          <GlobalSearch auth={auth} />

          <div className="flex items-center gap-2.5 max-[960px]:order-2 max-[960px]:pr-3 max-[640px]:gap-1 max-[640px]:pr-2">
            <ThemeToggle className={ICON_BTN} />
            <NotificationBell auth={auth} />
            <UserDropdown auth={auth} displayName={name} />
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 hidden cursor-pointer border-0 p-0 max-[960px]:block"
          style={{ background: "var(--modal-backdrop)" }}
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "flex min-h-0 flex-col overflow-hidden border-r border-header-border bg-sidebar-bg p-3 text-nav",
          "max-[960px]:fixed max-[960px]:top-0 max-[960px]:bottom-0 max-[960px]:left-0 max-[960px]:z-40 max-[960px]:w-[min(280px,86vw)] max-[960px]:px-3.5 max-[960px]:pt-5 max-[960px]:pb-7 max-[960px]:shadow-[12px_0_32px_rgb(22_50_79_/_0.12)] max-[960px]:transition-transform max-[960px]:duration-[220ms] max-[960px]:ease-in-out",
          mobileNavOpen
            ? "max-[960px]:translate-x-0"
            : "max-[960px]:-translate-x-full",
        ].join(" ")}
      >
        <nav
          className="grid flex-1 content-start gap-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Application"
        >
          {navGroups.map((group) => {
            const isOpen = collapsed || openGroups[group.id];

            return (
              <section key={group.id} className="grid gap-1.5">
                <button
                  type="button"
                  className={`${groupTitleHidden} w-full cursor-pointer items-center justify-between border-0 bg-transparent px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.08em] text-nav-group uppercase`}
                  aria-expanded={isOpen}
                  onClick={() => !collapsed && toggleGroup(group.id)}
                >
                  <span>{group.label}</span>
                  <HugeiconsIcon
                    className={`shrink-0 transition-transform duration-[280ms] ease-in-out${isOpen ? " rotate-90" : ""}`}
                    icon={ArrowRight01Icon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.5}
                  />
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-[280ms] ease-in-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="grid min-h-0 gap-1.5 overflow-hidden">
                    {group.items.map((item) => renderNavItem(item))}
                  </div>
                </div>
              </section>
            );
          })}
        </nav>
        <div className="shrink-0 pt-3">
          <button
            type="button"
            className={[
              "flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-primary px-3 py-2.5 font-[inherit] text-[0.92rem] font-semibold text-on-primary hover:enabled:bg-primary-hover disabled:cursor-wait disabled:opacity-70",
              collapsed
                ? "justify-center px-0 py-2.5 max-[960px]:justify-start max-[960px]:px-3 max-[960px]:py-[9px]"
                : "justify-center",
            ].join(" ")}
            onClick={handleLogout}
            title="Logout"
          >
            <HugeiconsIcon
              icon={Logout03Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span className={labelHidden}>Logout</span>
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-4 max-[960px]:w-full max-[640px]:p-3">
        <Outlet context={auth} />
      </main>
    </div>
  );
}
