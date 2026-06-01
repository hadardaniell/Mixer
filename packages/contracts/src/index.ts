import { z } from 'zod';

/**
 * Shared wire-format schemas. Imported by:
 *   @mixer/api    - response validation / request parsing
 *   @mixer/mobile - parse server responses, type form inputs
 *
 * Dates cross the wire as ISO-8601 strings, ObjectIds as hex strings.
 * Mongo $jsonSchema in the DB is the storage contract; this file is the
 * API contract.
 */

// --- shared ---
const ObjectIdString = z.string().regex(/^[a-f0-9]{24}$/i, 'invalid id');
const IsoDate = z.string().datetime();

export const HelloResponseSchema = z.object({ message: z.string() });
export type HelloResponse = z.infer<typeof HelloResponseSchema>;

export const HealthResponseSchema = z.object({ ok: z.boolean() });
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

// --- users ---
export const LocaleSchema = z.enum(['he', 'en']);
export const UserRoleSchema = z.enum(['user', 'admin']);

// Lenient E.164-ish phone: optional leading +, then 7–20 digits/spaces/dashes/parens.
const PhoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-()]{7,20}$/, 'invalid phone number');

export const PublicUserSchema = z.object({
  id: ObjectIdString,
  email: z.string().email(),
  displayName: z.string(),
  phoneNumber: PhoneNumber.optional(),
  avatarUrl: z.string().url().optional(),
  locale: LocaleSchema,
  role: UserRoleSchema,
  emailVerifiedAt: IsoDate.optional(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const UsersByIdsInputSchema = z.object({
  ids: z.array(ObjectIdString).min(1).max(100),
});
export type UsersByIdsInput = z.infer<typeof UsersByIdsInputSchema>;

export const UpdateOwnUserSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  phoneNumber: PhoneNumber.optional(),
  avatarUrl: z.string().url().optional(),
  locale: LocaleSchema.optional(),
});
export type UpdateOwnUserInput = z.infer<typeof UpdateOwnUserSchema>;

export const UpdateUserAsAdminSchema = UpdateOwnUserSchema.extend({
  role: UserRoleSchema.optional(),
});
export type UpdateUserAsAdminInput = z.infer<typeof UpdateUserAsAdminSchema>;

// --- auth ---
export const RegisterInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  displayName: z.string().min(1).max(80),
  phoneNumber: PhoneNumber, // required — used for contacts-based friend discovery
  locale: LocaleSchema.default('en'),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const GoogleLoginInputSchema = z.object({
  idToken: z.string().min(1),
});
export type GoogleLoginInput = z.infer<typeof GoogleLoginInputSchema>;

export const CreateUserAsAdminInputSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  locale: LocaleSchema.default('en'),
  role: UserRoleSchema.default('user'),
  password: z.string().min(8).max(200).optional(),
});
export type CreateUserAsAdminInput = z.infer<typeof CreateUserAsAdminInputSchema>;

// Login accepts exactly one identifier — email or phone — plus the password.
// The client detects which the user typed and sends the matching field.
export const LoginInputSchema = z
  .object({
    email: z.string().email().optional(),
    phoneNumber: PhoneNumber.optional(),
    password: z.string().min(1),
  })
  .refine((d) => (d.email ? 1 : 0) + (d.phoneNumber ? 1 : 0) === 1, {
    message: 'provide exactly one of email or phoneNumber',
  });
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RefreshInputSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const AuthResponseSchema = z.object({
  user: PublicUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// --- recipes ---
export const IngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
});

export const RecipeStepSchema = z.object({
  order: z.number().int().nonnegative(),
  text: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
});

export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export const RecipeSourceTypeSchema = z.enum(['manual', 'url', 'image', 'video-upload', 'text']);
export const RecipePlatformSchema = z.enum(['tiktok', 'instagram', 'youtube', 'facebook', 'web']);
export const VisibilitySchema = z.enum(['private', 'unlisted', 'public']);

export const RecipeSourceSchema = z.object({
  type: RecipeSourceTypeSchema,
  url: z.string().url().optional(),
  platform: RecipePlatformSchema.optional(),
  importTaskId: ObjectIdString.optional(),
});

export const RecipeSchema = z.object({
  id: ObjectIdString,
  ownerId: ObjectIdString,
  title: z.string(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  ingredients: z.array(IngredientSchema),
  steps: z.array(RecipeStepSchema),
  servings: z.number().int().positive().optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  difficulty: DifficultySchema.optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()),
  language: LocaleSchema,
  source: RecipeSourceSchema,
  visibility: VisibilitySchema,
  forkedFrom: ObjectIdString.optional(),
  forkedAt: IsoDate.optional(),
  createdAt: IsoDate,
  updatedAt: IsoDate,
  isFavorite: z.boolean().optional(),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const CreateRecipeInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  coverImageUrl: z.string().url().optional(),
  ingredients: z.array(IngredientSchema).default([]),
  steps: z.array(RecipeStepSchema).default([]),
  servings: z.number().int().positive().optional(),
  prepTimeMinutes: z.number().int().nonnegative().optional(),
  cookTimeMinutes: z.number().int().nonnegative().optional(),
  difficulty: DifficultySchema.optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()).default([]),
  language: LocaleSchema.default('en'),
  source: RecipeSourceSchema.default({ type: 'manual' }),
  visibility: VisibilitySchema.default('private'),
});
export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;

export const UpdateRecipeInputSchema = CreateRecipeInputSchema.partial();
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeInputSchema>;

export const RecipeListQuerySchema = z.object({
  owner: z.string().optional(), // 'me' or an ObjectId hex
  tag: z.string().optional(),
  q: z.string().optional(),
  visibility: VisibilitySchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});
export type RecipeListQuery = z.infer<typeof RecipeListQuerySchema>;

// --- recipe books ---
export const RecipeBookTypeSchema = z.enum(['personal', 'shared', 'meal']);
export const RecipeBookMemberRoleSchema = z.enum(['owner', 'editor', 'viewer']);

export const RecipeBookMemberSchema = z.object({
  userId: ObjectIdString,
  role: RecipeBookMemberRoleSchema,
  addedAt: IsoDate,
  invitedBy: ObjectIdString.optional(),
});

export const RecipeBookSchema = z.object({
  id: ObjectIdString,
  ownerId: ObjectIdString,
  name: z.string(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  type: RecipeBookTypeSchema,
  members: z.array(RecipeBookMemberSchema),
  recipeIds: z.array(ObjectIdString),
  tags: z.array(z.string()),
  createdAt: IsoDate,
  updatedAt: IsoDate,
  isFavorite: z.boolean().optional(),
});
export type RecipeBook = z.infer<typeof RecipeBookSchema>;

export const FavoriteKindSchema = z.enum(['recipe', 'book']);
export type FavoriteKind = z.infer<typeof FavoriteKindSchema>;

export const CreateRecipeBookInputSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional(),
  type: RecipeBookTypeSchema.default('personal'),
  tags: z.array(z.string()).default([]),
});
export type CreateRecipeBookInput = z.infer<typeof CreateRecipeBookInputSchema>;

export const UpdateRecipeBookInputSchema = CreateRecipeBookInputSchema.partial();
export type UpdateRecipeBookInput = z.infer<typeof UpdateRecipeBookInputSchema>;

export const AddBookMemberInputSchema = z.object({
  userId: ObjectIdString,
  role: z.enum(['editor', 'viewer']).default('viewer'),
});
export type AddBookMemberInput = z.infer<typeof AddBookMemberInputSchema>;

export const UpdateBookMemberInputSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});
export type UpdateBookMemberInput = z.infer<typeof UpdateBookMemberInputSchema>;

// --- AI extraction ---
export const ExtractFromTextInputSchema = z.object({
  text: z.string().min(1).max(10000),
});
export type ExtractFromTextInput = z.infer<typeof ExtractFromTextInputSchema>;

export const ExtractFromTextResultSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.number().optional(),
    unit: z.string().optional(),
  })).optional(),
  steps: z.array(z.object({
    order: z.number(),
    text: z.string(),
    durationMinutes: z.number().optional(),
  })).optional(),
  servings: z.number().optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  cuisine: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type ExtractFromTextResult = z.infer<typeof ExtractFromTextResultSchema>;
