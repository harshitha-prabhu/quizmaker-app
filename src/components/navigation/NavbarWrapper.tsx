/**
 * Navbar Wrapper Component
 * 
 * Server component that fetches user data and passes it to the client Navbar.
 */

import { getCurrentUser } from '@/app/actions/helpers';
import { Navbar } from './Navbar';

// Mark as dynamic since we use cookies
export const dynamic = 'force-dynamic';

export async function NavbarWrapper() {
  const user = await getCurrentUser();

  return <Navbar user={user} />;
}

