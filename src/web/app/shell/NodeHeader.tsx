import { Breadcrumbs, CompletenessBanner, PageHeader, Tabs } from '../../kit';

/** Canned for the stub: the loader replaces these values with the node's own. */
export function NodeHeader({ planId, nodeId }: { planId: string; nodeId: string }) {
  const node = `#/plans/${planId}/${nodeId}`;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Plans', href: `#/plans/${planId}` },
          { label: planId, href: `#/plans/${planId}` },
          { label: nodeId, href: node, mono: true },
        ]}
      />
      <PageHeader
        eyebrow={`Node · ${planId}/${nodeId}`}
        title="F3 Cancel (+ quote, + claims)"
        status={{ value: 'pass', label: 'Done' }}
        ids={[
          { label: 'Attempt', value: '2' },
          { label: 'PR', value: '#20', href: 'https://github.com/dpmorgandev/uinsure-policies-api/pull/20' },
          { label: 'Depends on', value: 'F2' },
        ]}
      />
      <CompletenessBanner value="OK" />
      <Tabs
        current="activity"
        items={[
          { key: 'node', label: 'Node', href: node },
          { key: 'walkthrough', label: 'Walkthrough', href: `${node}/commits` },
          { key: 'loop', label: 'Loop', href: `${node}/loop` },
          { key: 'activity', label: 'Activity', href: `${node}/activity` },
        ]}
      />
    </>
  );
}
