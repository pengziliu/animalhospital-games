import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware({
  ...routing,
  // Do not emit <link rel="alternate"> headers; hreflang is handled per-page.
  alternateLinks: false,
});

export const config = {
  // Match all routes except API, Next internals, and static asset files.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|ads.txt|ads|images|.*\\..*).*)",
  ],
};
