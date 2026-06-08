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
export const RecipeStatusSchema = z.enum(['draft', 'published']);
export type RecipeStatus = z.infer<typeof RecipeStatusSchema>;

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
  status: RecipeStatusSchema,
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
  status: RecipeStatusSchema.default('published'),
});
export type CreateRecipeInput = z.infer<typeof CreateRecipeInputSchema>;

export const UpdateRecipeInputSchema = CreateRecipeInputSchema.partial();
export type UpdateRecipeInput = z.infer<typeof UpdateRecipeInputSchema>;

export const RecipeListQuerySchema = z.object({
  owner: z.string().optional(), // 'me' or an ObjectId hex
  tag: z.string().optional(),
  q: z.string().optional(),
  visibility: VisibilitySchema.optional(),
  status: RecipeStatusSchema.optional(),
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

const ImageItemSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
});

export const ExtractFromImageInputSchema = z.object({
  images: z.array(ImageItemSchema).min(1).max(10),
});
export type ExtractFromImageInput = z.infer<typeof ExtractFromImageInputSchema>;

// --- embeddings ---
export const EmbedRecipeInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  ingredients: z.array(z.object({ name: z.string() })).optional(),
  tags: z.array(z.string()).optional(),
  cuisine: z.string().optional(),
});
export type EmbedRecipeInput = z.infer<typeof EmbedRecipeInputSchema>;

export const EmbedResponseSchema = z.object({
  embedding: z.array(z.number()),
});
export type EmbedResponse = z.infer<typeof EmbedResponseSchema>;

export const EmbedQueryInputSchema = z.object({
  query: z.string().min(1),
});
export type EmbedQueryInput = z.infer<typeof EmbedQueryInputSchema>;

// --- shares ---
export const ShareResourceTypeSchema = z.enum(['recipe', 'book']);
export type ShareResourceType = z.infer<typeof ShareResourceTypeSchema>;

export const ShareStatusSchema = z.enum(['pending', 'accepted', 'rejected']);
export type ShareStatus = z.infer<typeof ShareStatusSchema>;

export const SharedItemSchema = z.object({
  id: ObjectIdString,
  resourceType: ShareResourceTypeSchema,
  resourceId: ObjectIdString,
  resourceName: z.string(),
  ownerId: ObjectIdString,
  ownerName: z.string(),
  friendId: ObjectIdString,
  status: ShareStatusSchema,
  savedAt: IsoDate.nullable(),
  savedResourceId: ObjectIdString.nullable(),
  createdAt: IsoDate,
});
export type SharedItem = z.infer<typeof SharedItemSchema>;

export const CreateShareInputSchema = z.object({
  resourceType: ShareResourceTypeSchema,
  resourceId: ObjectIdString,
  friendId: ObjectIdString,
});
export type CreateShareInput = z.infer<typeof CreateShareInputSchema>;

export const ShareListQuerySchema = z.object({
  status: ShareStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});
export type ShareListQuery = z.infer<typeof ShareListQuerySchema>;

// --- friendships ---
export const FriendshipStatusSchema = z.enum(['pending', 'accepted']);
export type FriendshipStatus = z.infer<typeof FriendshipStatusSchema>;

export const FriendshipSchema = z.object({
  id: ObjectIdString,
  requesterId: ObjectIdString,
  requesterName: z.string(),
  recipientId: ObjectIdString,
  recipientName: z.string(),
  status: FriendshipStatusSchema,
  createdAt: IsoDate,
  acceptedAt: IsoDate.optional(),
});
export type Friendship = z.infer<typeof FriendshipSchema>;

export const SendFriendRequestInputSchema = z.object({
  recipientId: ObjectIdString,
});
export type SendFriendRequestInput = z.infer<typeof SendFriendRequestInputSchema>;

export const UnfriendResponseSchema = z.object({
  forkedRecipeIds: z.array(ObjectIdString),
  forkedBookIds: z.array(ObjectIdString),
});
export type UnfriendResponse = z.infer<typeof UnfriendResponseSchema>;

// --- notifications ---
export const NotificationTypeSchema = z.enum([
  'SHARE_REQUEST',
  'SHARE_ACCEPTED',
  'SHARE_REJECTED',
  'OWNER_DELETED_RESOURCE',
  'FRIEND_REQUEST',
  'FRIEND_ACCEPTED',
  'FRIEND_UNFRIENDED',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: ObjectIdString,
  type: NotificationTypeSchema,
  payload: z.record(z.unknown()),
  read: z.boolean(),
  createdAt: IsoDate,
  expiresAt: IsoDate.nullable(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListQuerySchema = z.object({
  read: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});
export type NotificationListQuery = z.infer<typeof NotificationListQuerySchema>;
