import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AgentBadge } from '../../../src/web/kit/primitives/agent-badge/AgentBadge';
import type { AgentName } from '../../../src/web/kit/primitives/agent-badge/AgentBadge';
import { examples } from '../../../src/web/kit/primitives/agent-badge/agent-badge.examples';

afterEach(cleanup);

const AGENTS: AgentName[] = ['main', 'tester', 'builder', 'reviewer', 'security', 'investigator', 'git', 'david'];

describe('agent-badge examples', () => {
  it('has exactly the catalogued states', () => {
    expect(examples.map((e) => e.state)).toEqual(['each agent', '`—` (hook saw none)']);
  });

  for (const example of examples) {
    it(`renders "${example.state}"`, () => {
      const { container } = render(example.element);
      expect(container.firstChild).not.toBeNull();
    });
  }

  it('"each agent" shows every agent once', () => {
    const each = examples.find((e) => e.state === 'each agent');
    const { container } = render(each!.element);
    const seen = [...container.querySelectorAll('[data-agent]')].map((el) => el.getAttribute('data-agent'));
    expect(seen).toEqual(AGENTS);
  });
});

describe('AgentBadge', () => {
  it('shows each agent as a label with a bot glyph', () => {
    for (const agent of AGENTS.filter((a) => a !== 'david')) {
      const { container, unmount } = render(<AgentBadge agent={agent} />);
      expect(screen.getByText(agent)).toBeTruthy();
      expect(container.querySelector('[data-glyph]')?.getAttribute('data-glyph')).toBe('bot');
      expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      unmount();
    }
  });

  it('shows David with a user glyph and his name', () => {
    const { container } = render(<AgentBadge agent="david" />);
    expect(screen.getByText('David Morgan')).toBeTruthy();
    expect(container.querySelector('[data-glyph]')?.getAttribute('data-glyph')).toBe('user');
  });

  it('says in words that no agent was recorded', () => {
    const { container } = render(<AgentBadge agent={null} />);
    expect(screen.getByText('no agent recorded, the hook saw none')).toBeTruthy();
    expect(container.querySelector('[data-agent]')?.getAttribute('data-agent')).toBe('none');
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('is not interactive', () => {
    const { container } = render(<AgentBadge agent="tester" />);
    expect(container.querySelector('a, button')).toBeNull();
  });
});
