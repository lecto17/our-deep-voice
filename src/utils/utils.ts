import { format } from 'timeago.js';
import imageCompression from 'browser-image-compression';

export const getNameByEmail = (email?: string | null) => {
  if (!email) return '';

  if (!email.includes('@')) return email;
  return email.split('@')[0];
};

export const parseDate = (date: string) => {
  return format(date);
};

/**
 * 이미지를 WebP로 변환하고 최적화
 * @description
 * - 높은 화질 유지 (95% 품질)
 * - SNS 피드에 적합한 해상도로 조정
 * - Next.js Image 최적화와 함께 사용
 */
export const transferImageToWebP = async (file: File) => {
  const options = {
    maxSizeMB: 5, // 5MB - 화질 우선 (Next.js에서 추가 최적화됨)
    maxWidthOrHeight: 2048, // 2K 해상도 지원
    useWebWorker: true, // 웹 워커 사용으로 성능 개선
    initialQuality: 0.95, // 95% 품질 - 원본에 가까운 화질
    fileType: 'image/webp', // WebP 포맷으로 변환 (JPEG보다 30% 작음)
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('이미지 압축 실패:', error);
  }
};

export const getDateYYYYMMDDWithDash = (date?: Date) => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
  }).format(date ?? new Date());
};

export const isValidDate = (dateString: string): boolean => {
  // dateString YYYYMMDD 형식인지 확인
  if (
    dateString.length !== 8 ||
    dateString.split('').some((el) => isNaN(Number(el)))
  ) {
    return false;
  }

  return true;
};

export const getKeyByValue = (map: Map<string, number>, value: number) => {
  for (const [key, val] of map.entries()) {
    if (val === value) return key;
  }
  return null; // 없을 경우
};
