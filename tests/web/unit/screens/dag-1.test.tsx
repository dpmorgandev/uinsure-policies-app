// DAG-1 · Plan DAG view, U7's carry from U5's review (A1.2 reviewer note): the plan page's route, plans/:planId, is
// registered once. u2Routes and u3Routes both registered it, so whichever came first shadowed the other. Read from the
// route table the app itself renders (App's element tree), not from source text.
import { isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, test } from 'vitest';
import { App } from '../../../../src/web/app/shell/App';

/** Every Route path in the tree, in the order the app registers them, descending through fragments and arrays. */
function routePaths(node: ReactNode): string[] {
  if (Array.isArray(node)) return node.flatMap(routePaths);
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ path?: string; children?: ReactNode }>;
  // A route is an element with a `path`. The router and <Routes> pass their children through; a route's screen sits
  // in its `element` prop, not in its children.
  const own = typeof element.props.path === 'string' ? [element.props.path] : [];
  return [...own, ...routePaths(element.props.children)];
}

/** App's route table: App renders a router element whose children are the Routes. */
function appPaths(): string[] {
  return routePaths(App() as ReactNode);
}

describe('the route table', () => {
  test('DAG-1 · plans/:planId is registered once', () => {
    expect(appPaths().filter((p) => p === 'plans/:planId')).toEqual(['plans/:planId']);
  });

  test('DAG-1 · no route path is registered twice, so none shadows another', () => {
    const paths = appPaths();
    const twice = [...new Set(paths.filter((p, i) => paths.indexOf(p) !== i))];
    expect(twice).toEqual([]);
  });
});
