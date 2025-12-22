import { ReactionStats, TransformedReactionStats } from '@/types/reaction';
import { SimpleUser, SupaUserProfile, User } from '@/types/user';

export type SupaPost = {
  channelId: string;
  id: string;
  authorId: string;
  caption: string;
  imageKey: string;
  blurImageKey?: string;
  createdAt: string;
  updatedAt: string | null;
  commentCount: number;
  author: Pick<SupaUserProfile, 'avatarUrl' | 'userName' | 'userId'>;
  reactions: TransformedReactionStats[];
};

export type RawSupaPost = Omit<SupaPost, 'reactions'> & {
  reactions: ReactionStats[];
};

export type SupaComment = {
  channelId: string;
  body: string;
  avatarUrl: string | null;
  userName: string;
  id?: string;
  reactions: TransformedReactionStats[];
  createdAt?: string;
};

export type Post = {
  postId: string;
  title: string;
  author: User;
  image?: string;
  content: string;
};

export type Comment = {
  comment: string;
  user: SimpleUser;
  id?: string;
};

export type SimplePost = Omit<FullPost, 'comments'> & {
  comments: number;
};

export type FullPost = {
  id: string;
  username: string;
  userImage: string;
  image: string;
  text: string;
  likes: string[];
  createdAt: string;
  comments: Comment[];
};
