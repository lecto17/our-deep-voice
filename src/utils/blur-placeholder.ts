/**
 * 클라이언트 사이드에서 사용할 blur placeholder
 */

/**
 * 단순한 단색 placeholder SVG 생성
 * @description 네트워크가 느린 환경에서 빈 공간 대신 회색 박스 표시
 */
const placeholder = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="#f3f4f6"/>
</svg>`;

/**
 * 문자열을 base64로 인코딩
 */
const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

/**
 * Next.js Image 컴포넌트의 blurDataURL로 사용할 placeholder
 * @description
 * - 모든 이미지에 재사용 가능 (성능 오버헤드 없음)
 * - 느린 네트워크 환경에서 빈 공간 대신 회색 박스 표시
 * - Tailwind gray-100 색상 사용 (#f3f4f6)
 */
export const BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(
  placeholder(700, 475),
)}`;
