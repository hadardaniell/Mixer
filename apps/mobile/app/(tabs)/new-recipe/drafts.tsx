import { useTranslation } from 'react-i18next';

import { DraftCard } from '@/features/recipe/components/DraftCard';
import { useDrafts } from '@/features/recipe/hooks/useDrafts';
import { ShowAllScreen } from '@/shared/ui/ShowAllScreen';

/** Full list of the current user's draft recipes (the drafts "see all"). */
export default function DraftsRoute() {
  const { t } = useTranslation();
  const { data: drafts = [] } = useDrafts(100);

  return (
    <ShowAllScreen
      title={t('newRecipe.drafts.title')}
      data={drafts}
      keyExtractor={(d) => d.id}
      numColumns={1}
      emptyText={t('newRecipe.drafts.empty')}
      renderItem={({ item }) => <DraftCard draft={item} />}
    />
  );
}
