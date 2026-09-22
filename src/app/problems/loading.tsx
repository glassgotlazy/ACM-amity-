import { PageHeaderSkeleton, IndexSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <IndexSkeleton cards rows={6} />
    </>
  );
}
