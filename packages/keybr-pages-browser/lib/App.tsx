import { ErrorHandler } from "@keybr/debug";
import {
  getPageData,
  LoadingProgress,
  PageDataContext,
  Pages,
  Root,
} from "@keybr/pages-shared";
import { SettingsLoader } from "@keybr/settings-loader";
import { querySelector } from "@keybr/widget";
import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { useIntl } from "react-intl";
import { BrowserRouter, Route, Routes } from "react-router";
import { IntlLoader } from "./loader/IntlLoader.tsx";
import { Template } from "./Template.tsx";
import { ThemeProvider } from "./themes/ThemeProvider.tsx";
import { Title } from "./Title.tsx";
import { ThemeSwitcher } from "./themes/ThemeSwitcher.tsx";

export function main() {
  createRoot(querySelector(Root.selector)).render(<App />);
}

const AccountPage = lazy(() => import("./pages/account.tsx"));
const HelpPage = lazy(() => import("./pages/help.tsx"));
const HighScorePage = lazy(() => import("./pages/high-scores.tsx"));
const LayoutsPage = lazy(() => import("./pages/layouts.tsx"));
const MultiplayerPage = lazy(() => import("./pages/multiplayer.tsx"));
const PracticePage = lazy(() => import("./pages/practice.tsx"));
const ProfilePage = lazy(() => import("./pages/profile.tsx"));
const TypingTestPage = lazy(() => import("./pages/typing-test.tsx"));
const TermsOfServicePage = lazy(() => import("./pages/terms-of-service.tsx"));
const PrivacyPolicyPage = lazy(() => import("./pages/privacy-policy.tsx"));
const BookEditorPage = lazy(() => import("./pages/book-editor.tsx"));

export function App() {
  return (
    <PageDataContext.Provider value={getPageData()}>
      <ErrorHandler>
        <IntlLoader>
          <SettingsLoader>
            <ThemeProvider>
              <PageRoutes />
            </ThemeProvider>
          </SettingsLoader>
        </IntlLoader>
      </ErrorHandler>
    </PageDataContext.Provider>
  );
}

function PageRoutes() {
  const { locale } = useIntl();
  const basename = Pages.intlBase(locale);
  console.log("Router basename:", basename);
  
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route
          index={true}
          path={Pages.practice.path}
          element={
            <Template path={Pages.practice.path}>
              <Title page={Pages.practice} />
              <Suspense fallback={<LoadingProgress />}>
                <PracticePage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.account.path}
          element={
            <Template path={Pages.account.path}>
              <Title page={Pages.account} />
              <Suspense fallback={<LoadingProgress />}>
                <AccountPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.help.path}
          element={
            <Template path={Pages.help.path}>
              <Title page={Pages.help} />
              <Suspense fallback={<LoadingProgress />}>
                <HelpPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.highScores.path}
          element={
            <Template path={Pages.highScores.path}>
              <Title page={Pages.highScores} />
              <Suspense fallback={<LoadingProgress />}>
                <HighScorePage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.layouts.path}
          element={
            <Template path={Pages.layouts.path}>
              <Title page={Pages.layouts} />
              <Suspense fallback={<LoadingProgress />}>
                <LayoutsPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.multiplayer.path}
          element={
            <Template path={Pages.multiplayer.path}>
              <Title page={Pages.multiplayer} />
              <Suspense fallback={<LoadingProgress />}>
                <MultiplayerPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={`${Pages.profile.path}`}
          element={
            <Template path={Pages.profile.path}>
              <Title page={Pages.profile} />
              <Suspense fallback={<LoadingProgress />}>
                <ProfilePage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={`${Pages.profile.path}/:userId`}
          element={
            <Template path={Pages.profile.path}>
              <Title page={Pages.profile} />
              <Suspense fallback={<LoadingProgress />}>
                <ProfilePage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.typingTest.path}
          element={
            <Template path={Pages.typingTest.path}>
              <Title page={Pages.typingTest} />
              <Suspense fallback={<LoadingProgress />}>
                <TypingTestPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.termsOfService.path}
          element={
            <Template path={Pages.termsOfService.path}>
              <Title page={Pages.termsOfService} />
              <Suspense fallback={<LoadingProgress />}>
                <TermsOfServicePage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path={Pages.privacyPolicy.path}
          element={
            <Template path={Pages.privacyPolicy.path}>
              <Title page={Pages.privacyPolicy} />
              <Suspense fallback={<LoadingProgress />}>
                <PrivacyPolicyPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path="/book-editor"
          element={
            <Template path="/book-editor">
              <Title page={{
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
              <Suspense fallback={<LoadingProgress />}>
                <BookEditorPage />
              </Suspense>
            </Template>
          }
        />
        <Route
          path="*"
          element={
            <Template path={Pages.practice.path}>
              <Title page={Pages.practice} />
              <Suspense fallback={<LoadingProgress />}>
                <PracticePage />
              </Suspense>
            </Template>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
