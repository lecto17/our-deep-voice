const PostSkeleton = () => {
  return (
    <div className="bg-surface-card border border-surface-subtle shadow-md rounded-3xl p-6 mb-4 w-[90%] min-w-[320px] sm:min-w-[468px] relative overflow-hidden">
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="flex w-fit items-center mb-4">
        <div className="w-11 h-11 bg-surface-subtle rounded-full animate-pulse" />
        <div className="ml-2 flex flex-col gap-1">
          <div className="w-24 h-4 bg-surface-subtle rounded animate-pulse" />
          <div className="w-32 h-3 bg-surface-subtle rounded animate-pulse" />
        </div>
      </div>

      <div className="w-full flex justify-center mb-4">
        <div className="w-full max-w-[468px] aspect-square bg-surface-subtle rounded-2xl animate-pulse" />
      </div>

      <div className="mb-4 space-y-2">
        <div className="w-3/4 h-4 bg-surface-subtle rounded animate-pulse" />
        <div className="w-1/2 h-4 bg-surface-subtle rounded animate-pulse" />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-surface-subtle">
        <div className="w-20 h-8 bg-surface-subtle rounded-full animate-pulse" />
        <div className="w-12 h-6 bg-surface-subtle rounded animate-pulse" />
      </div>
    </div>
  );
};

export default PostSkeleton;
