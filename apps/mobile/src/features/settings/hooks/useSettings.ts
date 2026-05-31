import { useSettingsContext } from '@/features/settings/context/SettingsContext';

export function useSettings() {
  return useSettingsContext();
}
