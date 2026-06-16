import type { CreateRecipeBookInput } from '@mixer/contracts';

export type BookPrivacy = 'personal' | 'shared';

export interface BookForm {
  name: string;
  description: string;
  tags: string[];
  /** Selected recipe ids (step 2). */
  recipeIds: string[];
  /** Privacy → maps to the book `type`. */
  privacy: BookPrivacy;
  /** Invited friend ids (step 3) — stubbed until a friends API exists. */
  invitedIds: string[];
  coverKey?: string;
}

export const initialBookForm: BookForm = {
  name: '',
  description: '',
  tags: [],
  recipeIds: [],
  privacy: 'personal',
  invitedIds: [],
  coverKey: 'rbc1',
};

export type BookFormAction =
  | { type: 'patch'; value: Partial<BookForm> }
  | { type: 'addTag'; value: string }
  | { type: 'removeTag'; value: string }
  | { type: 'toggleRecipe'; id: string }
  | { type: 'setRecipes'; ids: string[] }
  | { type: 'toggleInvite'; id: string };

export function bookFormReducer(state: BookForm, action: BookFormAction): BookForm {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.value };
    case 'addTag':
      return state.tags.includes(action.value)
        ? state
        : { ...state, tags: [...state.tags, action.value] };
    case 'removeTag':
      return { ...state, tags: state.tags.filter((t) => t !== action.value) };
    case 'toggleRecipe':
      return {
        ...state,
        recipeIds: state.recipeIds.includes(action.id)
          ? state.recipeIds.filter((id) => id !== action.id)
          : [...state.recipeIds, action.id],
      };
    case 'setRecipes':
      return { ...state, recipeIds: action.ids };
    case 'toggleInvite':
      return {
        ...state,
        invitedIds: state.invitedIds.includes(action.id)
          ? state.invitedIds.filter((id) => id !== action.id)
          : [...state.invitedIds, action.id],
      };
    default:
      return state;
  }
}

/** Whether the user can advance from a given step. Step 1 needs a name; step 2
 *  needs at least one selected recipe. */
export function canAdvance(step: number, form: BookForm): boolean {
  if (step === 1) return form.name.trim().length > 0;
  if (step === 2) return form.recipeIds.length > 0;
  return true;
}

/** Build the create payload. Members/invites are stubbed, so only owner is created. */
export function toCreateInput(form: BookForm): CreateRecipeBookInput {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    tags: form.tags,
    type: form.privacy,
    recipeIds: form.recipeIds,
    coverKey: form.coverKey,
  };
}
