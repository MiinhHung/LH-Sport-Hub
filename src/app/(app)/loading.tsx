import { CardSkeleton, PageIntroSkeleton } from "@/components/ui";

/**
 * Khung chờ chung cho những trang chưa có loading.tsx riêng.
 *
 * Trước đây là một khối navy cao 70vh với vòng xoay ở giữa: chuyển giữa hai
 * trang nền sáng thì loé lên một mảng tối rồi tắt, nhìn như trang bị giật.
 * Giờ là bộ khung cùng tông với trang thật, giống các loading.tsx khác.
 */
export default function AppLoading() {
  return (
    <div role="status" aria-label="Đang tải" className="space-y-6">
      <PageIntroSkeleton />
      <div className="grid gap-4 sm:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
