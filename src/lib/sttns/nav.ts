export function brainstormingHref(projectSlug?: string) {
  if (!projectSlug) return "/brainstorming";
  return `/brainstorming?project=${encodeURIComponent(projectSlug)}`;
}

export function isBrainstormingPath(pathname: string) {
  return pathname === "/brainstorming" || pathname.endsWith("/brainstorming");
}

export function navHrefPath(href: string) {
  return href.split("?")[0];
}
