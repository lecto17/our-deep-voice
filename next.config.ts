const nextConfig = {
  /* config options here */
  images: {
    // Next/Image가 가능한 경우 AVIF/WebP로 자동 변환
    formats: ['image/avif', 'image/webp'],

    // 이미지 최적화 장치 너비 설정
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
        port: '',
        pathname: '/images/**',
        search: '',
      },
      {
        protocol: 'https',
        hostname: 'our-diary.s3.ap-northeast-2.amazonaws.com',
        port: '',
        pathname: '/**',
        search: '',
      },
    ],
  },
  env: {
    // 환경별 환경 변수 설정
    NEXT_PUBLIC_APP_URL:
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_APP_URL_PROD ||
          'https://your-production-domain.com'
        : process.env.NEXT_PUBLIC_APP_URL_DEV || 'http://localhost:3000',
  },
  // sharp를 서버 번들에서만 사용하도록 설정
  serverExternalPackages: ['sharp'],
};

export default nextConfig;
