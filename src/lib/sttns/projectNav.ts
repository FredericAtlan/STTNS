import { featuresPath } from "@/lib/sttns/paths";
import { featuresHubPath } from "@/lib/sttns/featuresHub";
import { brainstormingHref, isBrainstormingPath, navHrefPath } from "@/lib/sttns/nav";

function isFeaturesHubPathname(pathname: string, slug: string) {
  return (
    pathname === `/projects/${slug}/features` ||
    pathname === `/projects/${slug}/features/arbitrage` ||
    pathname === `/projects/${slug}/roadmap` ||
    (pathname.startsWith(`/projects/${slug}/features/`) &&
      pathname !== `/projects/${slug}/features/new` &&
      pathname !== `/projects/${slug}/features/arbitrage`)
  );
}

export function projectNavLinkActive(pathname: string, href: string, slug: string) {
  const path = navHrefPath(href);

  if (path.endsWith("/features/new")) {
    return pathname === `/projects/${slug}/features/new`;
  }

  if (path.endsWith("/features")) {
    return isFeaturesHubPathname(pathname, slug);
  }

  if (path.endsWith("/agile")) {
    return pathname === `/projects/${slug}/agile`;
  }

  if (isBrainstormingPath(path)) return isBrainstormingPath(pathname);
  if (path.endsWith("/summary")) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function globalNavLinkActive(pathname: string, href: string) {
  const path = navHrefPath(href);
  if (path === "/") return pathname === "/";
  if (isBrainstormingPath(path)) return isBrainstormingPath(pathname);
  return pathname === path || pathname.startsWith(`${path}/`);
}

export { featuresPath, featuresHubPath, brainstormingHref };
