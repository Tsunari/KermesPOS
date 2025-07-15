"use client";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter, usePathname } from "next/navigation";

export default function KermesAppBar({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNav = (target: string) => {
    if (pathname !== target) {
      router.push(target);
    }
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
        <ListItem disablePadding>
          <IconButton
            aria-label="Dashboard"
            size="large"
            onClick={() => handleNav("/dashboard")}
            color={pathname === "/dashboard" ? "primary" : "default"}
          >
            <HomeIcon className="text-gray-600 dark:text-gray-300" fontSize="inherit" />
          </IconButton>
        </ListItem>
        <ListItem disablePadding>
          <IconButton
            aria-label="Profile"
            size="large"
            onClick={() => handleNav("/profile")}
            color={pathname === "/profile" ? "primary" : "default"}
          >
            <AccountCircleIcon className="text-gray-600 dark:text-gray-300" fontSize="inherit" />
          </IconButton>
        </ListItem>
        <ListItem disablePadding>
          <IconButton onClick={onLogout} aria-label="Logout" size="large">
            <LogoutIcon className="text-gray-600 dark:text-gray-300" fontSize="inherit" />
          </IconButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
