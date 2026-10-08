// VRChat API types, generated from the vrchat.community OpenAPI spec (`npm run generate:api-types`).
import type {components} from './vrchat-api.generated';

type Schemas = components['schemas'];

export type CurrentUser = Schemas['CurrentUser'];
export type User = Schemas['User'];
export type LimitedUserFriend = Schemas['LimitedUserFriend'];
export type PublicProfile = Schemas['PublicProfile'];
export type UpdateProfileRequest = Schemas['UpdateProfileRequest'];
export type World = Schemas['World'];
export type Instance = Schemas['Instance'];
export type VRChatFile = Schemas['File'];
export type PlayerModeration = Schemas['PlayerModeration'];
export type PlayerModerationType = Schemas['PlayerModerationType'];
export type Notification = Schemas['Notification'];
export type NotificationType = Schemas['NotificationType'];
export type UserStatus = Schemas['UserStatus'];
export type ApiErrorResponse = Schemas['Error'];
