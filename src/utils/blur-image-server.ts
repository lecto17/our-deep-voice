/**
 * 서버 사이드 전용 blur 이미지 생성 유틸리티
 * @description 이 파일은 API 라우트에서만 import되어야 함
 */

/**
 * sharp 라이브러리를 사용하여 극소형 blur 이미지 생성
 * @description 서버 사이드에서만 사용 가능
 * @returns base64로 인코딩된 data URI (약 100-300 바이트)
 */
export async function generateBlurDataURL(file: File): Promise<string> {
  // 서버 사이드 체크
  if (typeof window !== 'undefined') {
    throw new Error('generateBlurDataURL can only be used on the server side');
  }

  const sharp = (await import('sharp')).default;

  const buffer = Buffer.from(await file.arrayBuffer());

  // 극도로 작은 크기로 리사이즈 (4x4 픽셀)
  // blur 효과는 브라우저가 확대하면서 자동으로 적용됨
  const blurBuffer = await sharp(buffer)
    .resize(4, 4, {
      fit: 'cover', // 종횡비 유지하면서 크롭
    })
    .blur(1) // 약간의 blur만 추가
    .webp({
      quality: 10, // 최저 품질 (어차피 4x4라 상관없음)
      effort: 0,   // 빠른 압축
    })
    .toBuffer();

  // base64로 인코딩하여 data URI 생성
  const base64 = blurBuffer.toString('base64');

  // 결과 크기 로깅 (디버깅용)
  console.log(`Blur data URL size: ${base64.length} characters (~${Math.ceil(base64.length * 0.75)} bytes)`);

  return `data:image/webp;base64,${base64}`;
}
