import { useLocation } from 'react-router';
import { NotBuiltYet } from '../../kit';

/** Every route no screen is built for yet: the kit's pattern, naming the route, never a blank page. */
export function NotBuiltPage() {
  const { pathname } = useLocation();
  return <NotBuiltYet kind="region" name={pathname} back={{ href: '#/', label: 'Back to the overview' }} />;
}
