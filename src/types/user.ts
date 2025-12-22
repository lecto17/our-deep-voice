export type SupaUserProfile = {
  avatarUrl: string | null;
  createdAt?: string;
  id?: string;
  userName: string;
};

export type OnboardingUserProfile = {
  id: string;
  userName: string;
  avatarFile: File | null;
};

export type User = {
  id: string;
  username?: string;
  name: string;
  email: string;
  image?: string | null;
};

export type SimpleUser = Pick<User, 'username' | 'image'> & {
  id?: string;
};

// export interface SimpleUser extends Pick<User, "username" | "image"> {
//   username: string;
//   image: string;
// }

export type DetailUser = User & {
  following?: SimpleUser[] | [];
  followers?: SimpleUser[] | [];
  bookmarks?: string[];
};

export type SearchUser = {
  id?: string;
  image: string;
  following: number;
  followers: number;
  name: string;
  username: string;
};

export type UserProfile = SearchUser & {
  posts: number;
};

export type UserProfileTab = {
  posts: { image: string; id: string }[];
};
