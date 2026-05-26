"use client";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import HomeIcon from "@mui/icons-material/Home";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Ana Sayfa",        Icon: HomeIcon },
  { href: "/analytics",  label: "Satış Analitiği",  Icon: QueryStatsIcon },
  { href: "/management", label: "Hesap Yönetimi",   Icon: ManageAccountsIcon },
  { href: "/profile",    label: "Profil",            Icon: AccountCircleIcon },
];

export default function KermesAppBar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("tenant_admin");

  useEffect(() => {
    setRole(sessionStorage.getItem("adminRole") || "tenant_admin");
  }, []);

  const displayNavItems = NAV_ITEMS.filter(
    (item) => item.href !== "/management" || role === "super_admin"
  );

  const handleNav = (target: string) => {
    if (pathname !== target) router.push(target);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      PaperProps={{
        className:
          "!bg-white dark:!bg-neutral-900 !w-20 flex flex-col items-center py-4 shadow-lg z-20",
      }}
    >
      <List className="flex flex-col gap-4 items-center">
        {displayNavItems.map(({ href, label, Icon }) => (
          <ListItem key={href} disablePadding>
            <Tooltip title={label} placement="right">
              <IconButton
                aria-label={label}
                size="large"
                onClick={() => handleNav(href)}
                color={pathname === href ? "primary" : "default"}
              >
                <Icon className="text-gray-600 dark:text-gray-300" fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </ListItem>
        ))}

        <ListItem disablePadding>
          <Tooltip title="Çıkış" placement="right">
            <IconButton onClick={onLogout} aria-label="Çıkış" size="large">
              <LogoutIcon className="text-gray-600 dark:text-gray-300" fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </ListItem>
      </List>
    </Drawer>
  );
}
