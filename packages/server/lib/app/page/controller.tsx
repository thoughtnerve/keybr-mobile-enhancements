import { controller, http, pathParam, use } from "@fastr/controller";
import { Context } from "@fastr/core";
import { inject, injectable } from "@fastr/invert";
import { CanonicalHandler } from "@fastr/middleware-canonical";
import { type RouterState } from "@fastr/middleware-router";
import { defaultLocale, loadIntl, PreferredLocaleContext } from "@keybr/intl";
import { Shell, View } from "@keybr/pages-server";
import {
  type PageData,
  PageDataContext,
  PageInfo,
  Pages,
} from "@keybr/pages-shared";
import { SettingsDatabase } from "@keybr/settings-database";
import { staticTheme, ThemeContext, ThemePrefs } from "@keybr/themes";
import { type IntlShape, RawIntlProvider } from "react-intl";
import { type AuthState } from "../auth/index.ts";
import { localePattern, pIntl, preferredLocale } from "./intl.ts";

@injectable()
@controller()
@use(CanonicalHandler)
export class Controller {
  constructor(
    @inject("canonicalUrl") readonly canonicalUrl: string,
    readonly view: View,
    readonly database: SettingsDatabase,
  ) {}

  @http.GET("/")
  async ["index"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.practice);
  }

  @http.GET(`/{locale:${localePattern}}`)
  async ["index-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.practice, intl);
  }

  @http.GET("/index")
  async ["legacy-index"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.practice);
  }

  @http.GET(`/{locale:${localePattern}}/index`)
  async ["legacy-index-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.practice, intl);
  }

  @http.GET(`${Pages.account.path}`)
  async ["account"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.account);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.account.path}`)
  async ["account-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.account, intl);
  }

  @http.GET(`${Pages.profile.path}`)
  async ["profile"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.profile);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.profile.path}`)
  async ["profile-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.profile, intl);
  }

  @http.GET(`${Pages.profile.path}/{id:[a-zA-Z0-9]+}`)
  async ["public-profile"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.profile);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.profile.path}/{id:[a-zA-Z0-9]+}`)
  async ["public-profile-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.profile, intl);
  }

  @http.GET(`${Pages.help.path}`)
  async ["help"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.help);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.help.path}`)
  async ["help-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.help, intl);
  }

  @http.GET(`${Pages.highScores.path}`)
  async ["high-scores"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.highScores);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.highScores.path}`)
  async ["high-scores-18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.highScores, intl);
  }

  @http.GET(`${Pages.layouts.path}`)
  async ["layouts"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.layouts);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.layouts.path}`)
  async ["layouts-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.layouts, intl);
  }

  @http.GET(`${Pages.typingTest.path}`)
  async ["typing-test"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.typingTest);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.typingTest.path}`)
  async ["typing-test-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.typingTest, intl);
  }

  @http.GET(`${Pages.multiplayer.path}`)
  async ["multiplayer"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.multiplayer);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.multiplayer.path}`)
  async ["multiplayer-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.multiplayer, intl);
  }

  @http.GET(`${Pages.termsOfService.path}`)
  async ["terms-of-service"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.termsOfService);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.termsOfService.path}`)
  async ["terms-of-service-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.termsOfService, intl);
  }

  @http.GET(`${Pages.privacyPolicy.path}`)
  async ["privacy-policy"](ctx: Context<RouterState & AuthState>) {
    return this.renderPage(ctx, Pages.privacyPolicy);
  }

  @http.GET(`/{locale:${localePattern}}${Pages.privacyPolicy.path}`)
  async ["privacy-policy-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    return this.renderPage(ctx, Pages.privacyPolicy, intl);
  }

  @http.GET("/book-editor")
  async ["book-editor"](ctx: Context<RouterState & AuthState>) {
    const bookEditorPage = {
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
    };
    return this.renderPage(ctx, bookEditorPage);
  }

  @http.GET(`/{locale:${localePattern}}/book-editor`)
  async ["book-editor-i18n"](
    ctx: Context<RouterState & AuthState>,
    @pathParam("locale", pIntl) intl: IntlShape,
  ) {
    const bookEditorPage = {
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
    };
    return this.renderPage(ctx, bookEditorPage, intl);
  }

  async pageData(
    ctx: Context<RouterState & AuthState>,
    { locale }: IntlShape,
  ): Promise<PageData> {
    const { user, publicUser } = ctx.state;
    const settings = user != null ? await this.database.get(user.id!) : null;
    return {
      base: this.canonicalUrl,
      locale,
      user: user?.toDetails() ?? null,
      publicUser,
      settings: settings?.toJSON() ?? null,
    };
  }

  async renderPage(
    ctx: Context<RouterState & AuthState>,
    page: PageInfo,
    intl: IntlShape | null = null,
  ): Promise<string> {
    if (intl == null) {
      intl = await loadIntl(defaultLocale);
    }

    const pageData = await this.pageData(ctx, intl);

    ctx.response.type = "text/html";

    ctx.response.headers.append("Link", this.view.preloadHeaders);

    return this.view.renderPage(
      <RawIntlProvider value={intl}>
        <PreferredLocaleContext.Provider value={preferredLocale(ctx)}>
          <PageDataContext.Provider value={pageData}>
            <ThemeContext.Provider value={staticTheme(themePrefs(ctx))}>
              <Shell page={page} headers={ctx.request.headers} />
            </ThemeContext.Provider>
          </PageDataContext.Provider>
        </PreferredLocaleContext.Provider>
      </RawIntlProvider>,
    );
  }
}

function themePrefs(ctx: Context<RouterState & AuthState>): ThemePrefs {
  let cookie = ctx.cookies.get(ThemePrefs.cookieKey) || null;
  if (cookie) {
    try {
      cookie = decodeURIComponent(cookie);
    } catch {
      cookie = null;
    }
  }
  return ThemePrefs.deserialize(cookie);
}
