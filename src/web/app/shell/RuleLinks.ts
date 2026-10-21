import { useEffect } from 'react';

const KIT_RULE_LINK = 'a[href^="/rules/"]';

/**
 * The kit's rule chips inside an error summary, a problem banner and send anyway link to `/rules/<id>`, and give
 * the screen no way to change it. This app routes by hash, so each such link is pointed at `#/rules/<id>` as it
 * appears. A kit change (a link prefix) would make this unnecessary.
 */
export function useHashRuleLinks(): void {
  useEffect(() => {
    const point = (): void => {
      document.querySelectorAll<HTMLAnchorElement>(KIT_RULE_LINK).forEach((link) => {
        link.setAttribute('href', `#${link.getAttribute('href') ?? ''}`);
      });
    };
    point();
    const watch = new MutationObserver(point);
    watch.observe(document.body, { childList: true, subtree: true });
    return () => watch.disconnect();
  }, []);
}
