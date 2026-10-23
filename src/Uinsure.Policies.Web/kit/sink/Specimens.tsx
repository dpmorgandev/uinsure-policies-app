import type { JSX } from 'react';
import {
  ArrowLeft,
  Bot,
  Bug,
  CalendarRange,
  ChartGantt,
  Check,
  ChevronDown,
  CircleAlert,
  Clock,
  Copy,
  ExternalLink,
  FileCode,
  FilePlus,
  FlaskConical,
  Gavel,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  History,
  Info,
  ListTree,
  Moon,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  Sun,
  Terminal,
  ToggleRight,
  TriangleAlert,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './Specimens.module.css';

// The scale in tokens.css: --text-12 to --text-32. The rem values are the tokens' own.
const SIZES: { token: string; rem: string; className: string }[] = [
  { token: '--text-12', rem: '0.75rem', className: styles.s12 ?? '' },
  { token: '--text-14', rem: '0.875rem', className: styles.s14 ?? '' },
  { token: '--text-16', rem: '1rem', className: styles.s16 ?? '' },
  { token: '--text-18', rem: '1.125rem', className: styles.s18 ?? '' },
  { token: '--text-24', rem: '1.5rem', className: styles.s24 ?? '' },
  { token: '--text-32', rem: '2rem', className: styles.s32 ?? '' },
];

// Real values from the rule and wb-cancel mockups: walkthrough commit SHAs; test and term counts; the
// recorded F3 and quote amounts.
const SHAS = ['94a7473', '2f81a40', '8988ed8', '770a29b', '7b6e4d9', '92ede9e', '80d3ee2', '98a574d'];
const COUNTS = ['1', '12', '13', '25', '59', '101', '264', '365'];
const MONEY = ['445.11', '615.40', '329.34', '0.00'];

const SANS_SAMPLE = 'Quote, cancel, agree. 0O 1lI 445.11';
const MONO_SAMPLE = '94a7473 GET-1 CANCEL-1c 0O 1lI 445.11';

function join(...names: (string | undefined | false)[]): string {
  return names.filter(Boolean).join(' ');
}

function Figures({
  title,
  values,
  family,
  proportional = false,
}: {
  title: string;
  values: string[];
  family: 'sans' | 'mono';
  proportional?: boolean;
}): JSX.Element {
  return (
    <div className={styles.column}>
      <p className={styles.columnTitle}>{title}</p>
      <ul
        className={join(styles.figures, styles.right, family === 'mono' ? styles.mono : styles.sans, proportional && styles.proportional)}
        aria-label={title}
      >
        {values.map((value) => (
          <li key={value}>{value}</li>
        ))}
      </ul>
    </div>
  );
}

export function TypeContent(): JSX.Element {
  return (
    <div>
      <div className={styles.block}>
        <h3 className={styles.heading}>Scale, both families</h3>
        {SIZES.map(({ token, rem, className }) => (
          <div key={token} className={styles.sizeRow}>
            <span className={styles.sizeLabel}>
              {token} · {rem}
            </span>
            <p className={join(styles.sample, styles.sans, className)}>{SANS_SAMPLE}</p>
            <p className={join(styles.sample, styles.mono, className)}>{MONO_SAMPLE}</p>
          </div>
        ))}
      </div>
      <div className={styles.block}>
        <h3 className={styles.heading}>Atkinson Hyperlegible Next, 700 and Mono, 700</h3>
        <p className={join(styles.sample, styles.sans, styles.s18, styles.bold)}>{SANS_SAMPLE}</p>
        <p className={join(styles.sample, styles.mono, styles.s18, styles.bold)}>{MONO_SAMPLE}</p>
      </div>
      <div className={styles.block}>
        <h3 className={styles.heading}>Figures, tabular-nums</h3>
        <div className={styles.columns}>
          <Figures title="SHAs (mono)" values={SHAS} family="mono" />
          <Figures title="Counts (sans)" values={COUNTS} family="sans" />
          <Figures title="Counts (mono)" values={COUNTS} family="mono" />
          <Figures title="Money (sans)" values={MONEY} family="sans" />
          <Figures title="Money (mono)" values={MONEY} family="mono" />
          <Figures title="Counts, proportional (contrast)" values={COUNTS} family="sans" proportional />
        </div>
      </div>
    </div>
  );
}

// Every icon named in docs/ui/screens.json. All are exported by lucide-react, so none is listed as missing.
const ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: 'arrow-left', Icon: ArrowLeft },
  { name: 'bot', Icon: Bot },
  { name: 'bug', Icon: Bug },
  { name: 'calendar-range', Icon: CalendarRange },
  { name: 'chart-gantt', Icon: ChartGantt },
  { name: 'check', Icon: Check },
  { name: 'chevron-down', Icon: ChevronDown },
  { name: 'circle-alert', Icon: CircleAlert },
  { name: 'clock', Icon: Clock },
  { name: 'copy', Icon: Copy },
  { name: 'external-link', Icon: ExternalLink },
  { name: 'file-code', Icon: FileCode },
  { name: 'file-plus', Icon: FilePlus },
  { name: 'flask-conical', Icon: FlaskConical },
  { name: 'gavel', Icon: Gavel },
  { name: 'git-branch', Icon: GitBranch },
  { name: 'git-commit-horizontal', Icon: GitCommitHorizontal },
  { name: 'git-merge', Icon: GitMerge },
  { name: 'git-pull-request', Icon: GitPullRequest },
  { name: 'history', Icon: History },
  { name: 'info', Icon: Info },
  { name: 'list-tree', Icon: ListTree },
  { name: 'moon', Icon: Moon },
  { name: 'receipt', Icon: Receipt },
  { name: 'refresh-cw', Icon: RefreshCw },
  { name: 'search', Icon: Search },
  { name: 'shield', Icon: Shield },
  { name: 'sun', Icon: Sun },
  { name: 'terminal', Icon: Terminal },
  { name: 'toggle-right', Icon: ToggleRight },
  { name: 'triangle-alert', Icon: TriangleAlert },
  { name: 'user', Icon: User },
  { name: 'x', Icon: X },
];

export const ICON_NAMES: string[] = ICONS.map((icon) => icon.name);

export function IconContent(): JSX.Element {
  return (
    <ul className={styles.icons} aria-label="Icons">
      {ICONS.map(({ name, Icon }) => (
        <li key={name} data-icon={name} className={styles.icon}>
          <Icon size={24} aria-hidden="true" />
          <span className={styles.iconName}>{name}</span>
        </li>
      ))}
    </ul>
  );
}
