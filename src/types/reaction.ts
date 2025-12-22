import { REACTION_ITEM_MAP } from '@/constants/reaction';

export type ReactionType = keyof typeof REACTION_ITEM_MAP;
export type ReactionRequest = {
  emoji: string;
  count: number;
};

export const REACTION_BAR_ITEMS: Array<{
  id: number;
  name: ReactionType;
  icon: string;
}> = Object.entries(REACTION_ITEM_MAP).map(([name, icon], index) => ({
  id: index,
  name: name as ReactionType,
  icon,
}));

// 리액션 데이터 타입
export type Reaction = {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: ReactionType;
  createdAt: string;
};

// 리액션 통계 타입
export type ReactionStats = {
  emoji: string;
  count: number;
  reactionUserIdList: string[];
};

export type TransformedReactionStats = Omit<
  ReactionStats,
  'reactionUserIdList'
> & {
  reactedByMe: boolean;
};
