'use client';

import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { transferImageToWebP } from '@/utils/utils';
import Image from 'next/image';
import { ChangeEvent, useRef, useState } from 'react';
import { FiImage } from 'react-icons/fi';

type Props = {
  file?: File;
  onChange: (file: File | undefined) => void;
  size?: 'sm' | 'md';
};

const FileUpload = ({ file, onChange, size = 'md' }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLElement>(null);
  const [uploaded, setUploaded] = useState<File>();
  const isDragging = useDragAndDrop({
    onChange: (e: DragEvent) => handleDrag(e),
    dragRef,
  });

  const setFileAndPreview = (file: File) => {
    onChange(file);
    setUploaded(file);
  };

  const handleDrag = async (e: DragEvent) => {
    const files = e.dataTransfer?.files;
    if (!files || !files?.length) return;

    const converted = (await transferImageToWebP(files[0])) || files[0];
    setFileAndPreview(converted);
  };

  const handleChange = async (e: ChangeEvent) => {
    const input = e.target as HTMLInputElement;
    if (!input.files?.[0]) return;

    const converted =
      (await transferImageToWebP(input.files[0])) || input.files[0];
    setFileAndPreview(converted);
  };

  const handleClick = () => {
    if (!inputRef.current) return;
    inputRef.current.click();
  };

  const handleClickClose = () => {
    onChange(undefined);
    setUploaded(undefined);
  };

  const isSmall = size === 'sm';
  const containerPadding = isSmall ? 'p-3' : 'p-5';
  const containerMaxH = isSmall ? 'max-h-[160px]' : 'max-h-[280px]';
  const iconSize = isSmall ? 84 : 180;

  return (
    <section
      className={`flex w-full border-2 border-dashed ${containerPadding} ${containerMaxH} relative overflow-hidden rounded-xl bg-white/70 dark:bg-neutral-900/60 ${
        isDragging ? 'bg-sky-300/15' : ''
      } border-blue-200/70 dark:border-sky-800/50`}
      ref={dragRef}
    >
      <input
        type="file"
        id="fileUpload"
        onChange={handleChange}
        ref={inputRef}
        accept="image/*"
        hidden
      />
      <div
        className="w-full flex flex-col justify-center items-center gap-2 cursor-pointer"
        onClick={handleClick}
      >
        <FiImage
          size={iconSize}
          className="text-sky-500/80"
        />
        <label
          htmlFor="fileUpload"
          className="text-xs sm:text-sm text-gray-400"
        >
          이미지 업로드 (선택 사항)
        </label>
      </div>
      {file && (
        <div className="absolute inset-0 flex justify-center bg-white dark:bg-neutral-950 w-full">
          <div className="relative w-full">
            <button
              className="absolute z-10 top-4 right-4 rounded-md px-2 py-1 text-xs font-medium bg-white/80 dark:bg-neutral-800/70 shadow border border-neutral-200/70 dark:border-neutral-700 hover:scale-105 transition"
              onClick={handleClickClose}
            >
              제거
            </button>
            <Image
              src={URL.createObjectURL(uploaded!)}
              alt="uploaded image"
              fill
              sizes="650px"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default FileUpload;
