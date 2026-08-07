import { useLocalSearchParams } from 'expo-router';

import { BookScreen } from '@/features/book/screens/BookScreen';

export default function BookRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BookScreen bookId={id} />;
}
