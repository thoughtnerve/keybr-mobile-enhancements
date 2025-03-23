import {
  type AnyUser,
  Avatar,
  type PageInfo,
  Pages,
  usePageData,
} from "@keybr/pages-shared";
import { Icon } from "@keybr/widget";
import { clsx } from "clsx";
import { type ReactNode } from "react";
import { useIntl } from "react-intl";
import { NavLink } from "react-router";
import * as styles from "./NavMenu.module.less";
import { SubMenu } from "./SubMenu.tsx";
import { ThemeSwitcher } from "./themes/ThemeSwitcher.tsx";

export function NavMenu({ currentPath }: { readonly currentPath: string }) {
  const { publicUser } = usePageData();
  return (
    <div className={styles.root}>
      <MenuItem>
        <AccountLink user={publicUser} />
      </MenuItem>

      <MenuItem>
        <ThemeSwitcher />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.practice} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.profile} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.help} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.highScores} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.multiplayer} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.typingTest} />
      </MenuItem>

      <MenuItem>
        <MenuItemLink page={Pages.layouts} />
      </MenuItem>

      {/* Restore Book Editor menu item with a hardcoded PageInfo object */}
      <MenuItem>
        <MenuItemLink page={{
          path: "/book-editor",
          title: {
            id: "page.bookEditor.title",
            defaultMessage: "Book Editor"
          },
          link: {
            label: {
              id: "page.bookEditor.link.name",
              defaultMessage: "Book Editor"
            },
            title: {
              id: "page.bookEditor.link.description",
              defaultMessage: "Edit book content for typing practice."
            },
            icon: "M19,3H5C3.9,3 3,3.9 3,5V19C3,20.1 3.9,21 5,21H19C20.1,21 21,20.1 21,19V5C21,3.9 20.1,3 19,3M9.5,11.5C9.5,12.3 8.8,13 8,13H7V15H5.5V9H8C8.8,9 9.5,9.7 9.5,10.5V11.5M14.5,13.5C14.5,14.3 13.8,15 13,15H10.5V9H13C13.8,9 14.5,9.7 14.5,10.5V13.5M18.5,10.5H17V11.5H18.5V13H17V15H15.5V9H18.5V10.5M7,10.5H8V11.5H7V10.5M12,10.5V13.5H13V10.5H12Z"
          },
          meta: [{ name: "robots", content: "noindex" }]
        }} />
      </MenuItem>

      <MenuItem>
        <SubMenu currentPath={currentPath} />
      </MenuItem>
    </div>
  );
}

function MenuItem({ children }: { readonly children: ReactNode }) {
  return <div className={styles.item}>{children}</div>;
}

function AccountLink({ user }: { readonly user: AnyUser }) {
  const { formatMessage } = useIntl();
  return (
    <NavLink
      className={({ isActive }) =>
        clsx(styles.accountLink, isActive && styles.isActive)
      }
      to={Pages.account.path}
      title={
        user.id != null
          ? formatMessage({
              id: "page.account.link.named.description",
              defaultMessage: "Manage your online account.",
            })
          : formatMessage({
              id: "page.account.link.anonymous.description",
              defaultMessage: "Sign-in for an online account.",
            })
      }
    >
      <Avatar user={user.id != null ? user : null} size="large" />
      <span className={styles.userName}>
        {user.id != null
          ? user.name
          : formatMessage({
              id: "account.widget.signIn.label",
              defaultMessage: "Sign-In",
            })}
      </span>
    </NavLink>
  );
}

function MenuItemLink({
  page: {
    path,
    link: { label, title, icon },
  },
}: {
  readonly page: PageInfo;
}) {
  const { formatMessage } = useIntl();
  return (
    <NavLink
      className={({ isActive }) =>
        clsx(styles.link, isActive && styles.isActive)
      }
      to={path}
      title={title && formatMessage(title)}
    >
      <Icon className={styles.icon} shape={icon ?? ""} />
      <span className={styles.label}>{formatMessage(label)}</span>
    </NavLink>
  );
}
