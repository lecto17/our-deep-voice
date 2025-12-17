/**
 * 토스트 메시지 중앙 관리
 * - 모든 토스트 메시지를 한 곳에서 관리
 * - 다국어 지원 시 이 파일만 수정
 * - 타입 안정성 보장
 */

export const TOAST_MESSAGES = {
  // 포스트 관련
  POST_CREATE_SUCCESS: '포스트가 작성되었습니다',
  POST_CREATE_ERROR: '포스트 작성에 실패했습니다',
  POST_REACTION_ERROR: '리액션 처리에 실패했습니다',

  // 댓글 관련
  COMMENT_CREATE_SUCCESS: '댓글이 작성되었습니다',
  COMMENT_CREATE_ERROR: '댓글 작성에 실패했습니다',
  COMMENT_EMPTY_ERROR: '댓글 내용을 입력해주세요',
  COMMENT_REACTION_ERROR: '리액션 처리에 실패했습니다',

  // 이미지 업로드 관련
  IMAGE_UPLOAD_SUCCESS: '이미지가 업로드되었습니다',
  IMAGE_UPLOAD_ERROR: '이미지 업로드에 실패했습니다',
  IMAGE_LOAD_ERROR: '이미지 로드에 실패했습니다',

  // 프로필 관련
  PROFILE_IMAGE_SELECT_SUCCESS: '프로필 이미지가 선택되었습니다',
  PROFILE_UPDATE_SUCCESS: '프로필이 설정되었습니다',
  PROFILE_UPDATE_ERROR: '프로필 설정에 실패했습니다',
  PROFILE_NICKNAME_EMPTY_ERROR: '닉네임을 입력해주세요',

  // 기분 관련
  MOOD_SAVE_SUCCESS: '기분이 저장되었습니다',
  MOOD_SAVE_ERROR: '기분 저장에 실패했습니다',
  MOOD_SELECT_ERROR: '기분을 선택해주세요',
} as const;

export type ToastMessageKey = keyof typeof TOAST_MESSAGES;
