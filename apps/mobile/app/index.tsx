import { Redirect, type Href } from 'expo-router';

import { useAuth } from '@/features/auth/hooks/useAuth';

export default function Index() {
  const { isAuthenticated } = useAuth();
  const href = (isAuthenticated ? '/home' : '/start') as Href;
  return <Redirect href={href} />;
}
