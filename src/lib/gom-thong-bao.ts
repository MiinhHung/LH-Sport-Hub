type ThongBaoGoc = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  isRead: boolean;
  createdAt: Date;
  actor: { id: string; fullName: string; avatarUrl: string | null } | null;
};

export type NhomThongBao = {
  /** Tất cả bản ghi nằm dưới hàng này — bấm "đã đọc" phải đánh dấu hết. */
  ids: string[];
  type: string;
  title: string;
  message: string | null;
  href: string | null;
  /** Chưa đọc nếu CÒN bất kỳ bản ghi nào chưa đọc. */
  chuaDoc: boolean;
  /** Mốc thời gian của bản mới nhất. */
  createdAt: Date;
  /** Những người đã làm việc này, không trùng, mới nhất đứng đầu. */
  nguoi: { id: string; fullName: string; avatarUrl: string | null }[];
};

export type MangThoiGian = { nhan: string; nhom: NhomThongBao[] };

/**
 * Gộp thông báo trùng, rồi chia theo mốc thời gian.
 *
 * VÌ SAO PHẢI GỘP. Đo trên trang thật: ba dòng "Hanna sẽ đi Cầu lông
 * sáng thứ 7" giống hệt nhau, nằm liền nhau. Gốc rễ là `setAttendanceAction`
 * bắn thông báo mỗi lần bấm "Có đi" mà không kiểm trạng thái cũ — chỗ
 * đó đã sửa. Nhưng còn một nguồn trùng nữa mà sửa ở server không hết
 * được: cả đội cùng nhận MỘT buổi tập thì người tạo nhận đúng số dòng
 * bằng số người, nội dung na ná nhau.
 *
 * Gộp theo (loại + đường dẫn): cùng một việc xảy ra với cùng một thứ thì
 * là MỘT dòng, kèm danh sách người đã làm.
 *
 * KHÔNG TỰ VIẾT LẠI CÂU TIÊU ĐỀ. Tiêu đề nằm sẵn trong database dưới
 * dạng câu hoàn chỉnh ("Hanna sẽ đi ..."), muốn đổi thành "Hanna và 2
 * người nữa sẽ đi ..." thì phải cắt chuỗi để lấy vế sau — mà vế đó khác
 * nhau ở từng loại thông báo, cắt sai một chỗ là ra câu vô nghĩa. Ở đây
 * giữ nguyên câu của bản mới nhất rồi nói thêm phần còn lại bằng một
 * dòng phụ và dãy ảnh đại diện. Kém gọn hơn một chút, nhưng không bao
 * giờ tạo ra câu sai.
 */
export function gomThongBao(ds: ThongBaoGoc[]): MangThoiGian[] {
  const theoKhoa = new Map<string, NhomThongBao>();

  for (const n of ds) {
    // Không có đường dẫn thì không biết nó nói về cái gì, nên để riêng
    // từng cái bằng chính id của nó.
    const khoa = n.href ? `${n.type}|${n.href}` : `${n.type}|#${n.id}`;
    const da = theoKhoa.get(khoa);

    if (!da) {
      theoKhoa.set(khoa, {
        ids: [n.id],
        type: n.type,
        title: n.title,
        message: n.message,
        href: n.href,
        chuaDoc: !n.isRead,
        createdAt: n.createdAt,
        nguoi: n.actor ? [n.actor] : [],
      });
      continue;
    }

    da.ids.push(n.id);
    da.chuaDoc = da.chuaDoc || !n.isRead;
    if (n.actor && !da.nguoi.some((p) => p.id === n.actor!.id)) {
      da.nguoi.push(n.actor);
    }
  }

  /*
    Chia theo mốc thời gian.

    KHÔNG dùng lại `weekBucket` của trang buổi tập dù nghe có vẻ giống:
    cái đó chia lịch SẮP TỚI (tuần này, tuần sau), còn ở đây là việc ĐÃ
    xảy ra (hôm nay, hôm qua, cũ hơn). Hai chiều thời gian ngược nhau,
    ép dùng chung sẽ ra nhãn vô nghĩa.
  */
  const mang = new Map<string, NhomThongBao[]>();
  for (const nhom of theoKhoa.values()) {
    const nhan = nhanThoiGian(nhom.createdAt);
    const co = mang.get(nhan);
    if (co) co.push(nhom);
    else mang.set(nhan, [nhom]);
  }

  return [...mang.entries()].map(([nhan, nhom]) => ({ nhan, nhom }));
}

const MOT_NGAY = 24 * 60 * 60 * 1000;

function nhanThoiGian(d: Date): string {
  const bayGio = new Date();
  const homNay = new Date(
    bayGio.getFullYear(),
    bayGio.getMonth(),
    bayGio.getDate(),
  ).getTime();

  const t = d.getTime();
  if (t >= homNay) return "Hôm nay";
  if (t >= homNay - MOT_NGAY) return "Hôm qua";
  if (t >= homNay - 7 * MOT_NGAY) return "Tuần này";
  if (t >= homNay - 30 * MOT_NGAY) return "Tháng này";
  return "Cũ hơn";
}
