import { useId } from 'react';
import { Button } from '../../primitives/button/Button';
import { Select } from '../../primitives/select/Select';
import type { SelectOption } from '../../primitives/select/Select';
import { EmptyState } from '../empty-state/EmptyState';
import styles from './FilterBar.module.css';

export interface FilterDefinition {
  /** Stays the same for the life of the filter; handed back to `onChange`. */
  id: string;
  /** The visible label: "Status", "Feature", "Agent", "Attempt". */
  label: string;
  /** The choices, not counting "Any". */
  options: SelectOption[];
  /** The chosen option's value. An empty string means the filter is not set. */
  value: string;
}

export interface FilterBarProps {
  filters: FilterDefinition[];
  onChange?: (id: string, value: string) => void;
  onClear?: () => void;
  /** How many rows pass the filters, as the caller counted them. */
  matchCount: number;
  /** How many rows there are before filtering. */
  totalCount: number;
  /** What the rows are called, in the plural: "rungs", "commits". */
  noun?: string;
  legend?: string;
}

const ANY = { value: '', label: 'Any' } as const;

function Field({ filter, onChange }: { filter: FilterDefinition; onChange?: (id: string, value: string) => void }) {
  const id = useId();
  return (
    <div className={styles.field} data-set={filter.value !== '' ? 'true' : 'false'}>
      <label className={styles.label} htmlFor={id}>
        {filter.label}
      </label>
      <Select
        id={id}
        options={[ANY, ...filter.options]}
        value={filter.value}
        onChange={(event) => onChange?.(filter.id, event.target.value)}
      />
    </div>
  );
}

export function FilterBar({
  filters,
  onChange,
  onClear,
  matchCount,
  totalCount,
  noun = 'rows',
  legend = 'Filters',
}: FilterBarProps) {
  const setCount = filters.filter((filter) => filter.value !== '').length;
  const anySet = setCount > 0;
  const none = matchCount === 0;
  const state = none ? 'no matches' : anySet ? 'set' : 'none set';

  return (
    <fieldset className={styles.root} data-state={state}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.fields}>
        {filters.map((filter) => (
          <Field key={filter.id} filter={filter} onChange={onChange} />
        ))}
        {anySet ? (
          <div className={styles.clear}>
            <Button variant="secondary" onClick={onClear}>
              Clear filters
            </Button>
          </div>
        ) : null}
      </div>
      <p className={styles.summary} role="status">
        Showing <span className={styles.figure}>{matchCount}</span> of <span className={styles.figure}>{totalCount}</span>{' '}
        {noun}
        {anySet ? `, ${setCount} ${setCount === 1 ? 'filter' : 'filters'} set` : ', no filters set'}.
      </p>
      {none ? (
        <EmptyState
          context="no-matches"
          compact
          title={`No ${noun} match these filters.`}
          why="Clear a filter to see them again."
        />
      ) : null}
    </fieldset>
  );
}
