import type { CreateRecipeInput, Recipe } from '@mixer/contracts';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface ManualIngredient {
  name: string;
  amount?: number;
  unit?: string;
  note?: string;
}

export interface ManualStep {
  text: string;
  durationMinutes?: number;
}

export interface ManualForm {
  title: string;
  description: string;
  /** Public URL of the uploaded cover image, once the upload completes. */
  coverImageUrl?: string;
  prepTimeMinutes?: number;
  difficulty?: Difficulty;
  servings?: number;
  /** Curated category ids (from the `categories` collection), chosen in step 2.
   *  Multi-select — a recipe can sit in several categories. */
  categoryIds: string[];
  ingredients: ManualIngredient[];
  steps: ManualStep[];
}

export const initialManualForm: ManualForm = {
  title: '',
  description: '',
  categoryIds: [],
  ingredients: [],
  steps: [],
};

export type ManualFormAction =
  | { type: 'reset'; value: ManualForm }
  | { type: 'patch'; value: Partial<ManualForm> }
  | { type: 'addIngredient'; value: ManualIngredient }
  | { type: 'updateIngredient'; index: number; value: ManualIngredient }
  | { type: 'removeIngredient'; index: number }
  | { type: 'addStep'; value: ManualStep }
  | { type: 'updateStep'; index: number; value: ManualStep }
  | { type: 'removeStep'; index: number };

export function manualFormReducer(state: ManualForm, action: ManualFormAction): ManualForm {
  switch (action.type) {
    case 'reset':
      return action.value;
    case 'patch':
      return { ...state, ...action.value };
    case 'addIngredient':
      return { ...state, ingredients: [...state.ingredients, action.value] };
    case 'updateIngredient':
      return {
        ...state,
        ingredients: state.ingredients.map((it, i) => (i === action.index ? action.value : it)),
      };
    case 'removeIngredient':
      return { ...state, ingredients: state.ingredients.filter((_, i) => i !== action.index) };
    case 'addStep':
      return { ...state, steps: [...state.steps, action.value] };
    case 'updateStep':
      return {
        ...state,
        steps: state.steps.map((s, i) => (i === action.index ? action.value : s)),
      };
    case 'removeStep':
      return { ...state, steps: state.steps.filter((_, i) => i !== action.index) };
    default:
      return state;
  }
}

/**
 * The fields each step contributes to the recipe, used to autosave the draft as
 * the user advances. Trimmed/normalized so we never persist empty strings.
 */
export function stepPatch(step: number, form: ManualForm): Partial<CreateRecipeInput> {
  switch (step) {
    case 1:
      return {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        coverImageUrl: form.coverImageUrl,
      };
    case 2:
      return {
        prepTimeMinutes: form.prepTimeMinutes,
        difficulty: form.difficulty,
        servings: form.servings,
        categoryIds: form.categoryIds,
      };
    case 3:
      return {
        ingredients: form.ingredients.map((it) => ({
          name: it.name.trim(),
          amount: it.amount,
          unit: it.unit?.trim() || undefined,
          note: it.note?.trim() || undefined,
        })),
      };
    case 4:
      return {
        steps: form.steps.map((s, i) => ({
          order: i,
          text: s.text.trim(),
          durationMinutes: s.durationMinutes,
        })),
      };
    default:
      return {};
  }
}

/**
 * The full recipe payload built from the form, for the inline recipe editor
 * (which saves every field at once rather than step-by-step). Combines the
 * per-step patches and drops rows the user left blank so we never send an
 * empty-name ingredient or empty step to the API.
 */
export function manualFormToInput(form: ManualForm): Partial<CreateRecipeInput> {
  return {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    coverImageUrl: form.coverImageUrl,
    prepTimeMinutes: form.prepTimeMinutes,
    difficulty: form.difficulty,
    servings: form.servings,
    categoryIds: form.categoryIds,
    ingredients: form.ingredients
      .filter((it) => it.name.trim().length > 0)
      .map((it) => ({
        name: it.name.trim(),
        amount: it.amount,
        unit: it.unit?.trim() || undefined,
        note: it.note?.trim() || undefined,
      })),
    steps: form.steps
      .filter((s) => s.text.trim().length > 0)
      .map((s, i) => ({
        order: i,
        text: s.text.trim(),
        durationMinutes: s.durationMinutes,
      })),
  };
}

/** Seed the wizard form from an existing recipe (edit mode). Inverse of the
 *  per-step patches above: copies the category ids back, and orders steps by
 *  their stored `order`. */
export function recipeToManualForm(r: Recipe): ManualForm {
  return {
    title: r.title,
    description: r.description ?? '',
    coverImageUrl: r.coverImageUrl,
    prepTimeMinutes: r.prepTimeMinutes,
    difficulty: r.difficulty,
    servings: r.servings,
    categoryIds: [...r.categoryIds],
    ingredients: r.ingredients.map((it) => ({
      name: it.name,
      amount: it.amount,
      unit: it.unit,
      note: it.note,
    })),
    steps: [...r.steps]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ text: s.text, durationMinutes: s.durationMinutes })),
  };
}

/** Whether the user can advance from a given step. */
export function canAdvance(step: number, form: ManualForm): boolean {
  switch (step) {
    case 1:
      return form.title.trim().length > 0;
    case 3:
      return form.ingredients.some((it) => it.name.trim().length > 0);
    case 4:
      return form.steps.some((s) => s.text.trim().length > 0);
    default:
      return true; // step 2 (all optional) and step 5 (review)
  }
}
