// import { validateSession } from "@/actions/action";
import { getAuthenticatedUser } from '@/actions/action';
// import { addPost } from '@/service/post';
import { addPost } from '@/service/supa-post';
import { uploadFileToS3 } from '@/service/s3-upload';
import { generateBlurDataURL } from '@/utils/blur-image-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return new Response('Authenticated Error');
  }

  let publicUrl = '';
  let blurDataURL = '';
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const text = formData.get('text') as string;
  const fileName = (formData.get('fileName') as string) || 'no file name';
  const channelId = formData.get('channelId') as string;

  if (file != null) {
    // 원본 이미지 업로드
    const { url } = await uploadFileToS3({
      file,
      fileName,
    });
    publicUrl = url;

    // blur data URI 생성 (DB에 직접 저장)
    try {
      blurDataURL = await generateBlurDataURL(file);
    } catch (error) {
      console.error('Failed to generate blur data URL:', error);
      // blur 이미지 생성 실패해도 게시글은 생성되도록 함
    }
  }

  const param = {
    authorId: user.id,
    caption: text,
    imageKey: publicUrl,
    blurImageKey: blurDataURL,
    channelId: channelId,
  };

  return addPost(param)
    .then(NextResponse.json)
    .catch((err) => {
      return new Response(JSON.stringify(err), { status: 500 });
    });
}

// export async function POST(req: NextRequest) {
//   const user = await validateSession();

//   if (!user) {
//     return new Response('Authenticated Error');
//   }

//   const formData = await req.formData();
//   const file = formData.get('file') as File;
//   const text = formData.get('text') as string;

//   if (!text) {
//     return new Response('Bad Request', { status: 400 });
//   }

//   //   const request = comment?.id ? updateComment : addComment;
//   const request = addPost;

//   return request(text, file, user.id)
//     .then(NextResponse.json)
//     .catch((err) => {
//       return new Response(JSON.stringify(err), { status: 500 });
//     });
// }
