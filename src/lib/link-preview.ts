import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { AppError } from "@/lib/auth";

/**
 * Lấy tiêu đề / mô tả / ảnh của một đường dẫn, để dựng thẻ xem trước.
 *
 * ====================================================================
 * TOÀN BỘ VIỆC NÀY CHẠY Ở SERVER, VÀ ĐÓ LÀ CHỖ NGUY HIỂM.
 * ====================================================================
 *
 * Một hàm nhận URL do người dùng nhập rồi tự đi tải chính là định nghĩa
 * của lỗ hổng SSRF. Kẻ xấu không cần tải được gì về cho họ xem — chỉ cần
 * máy chủ CHỊU gửi yêu cầu là đã đủ, vì máy chủ nằm trong mạng nội bộ và
 * nói chuyện được với những địa chỉ mà máy họ không với tới:
 *
 *   http://169.254.169.254/...   — máy chủ đám mây hay để thông tin
 *                                  đăng nhập tạm ở đây
 *   http://127.0.0.1:5432        — database nghe ở localhost
 *   http://10.0.0.5/admin        — dịch vụ nội bộ tưởng là kín
 *
 * Nên ở đây chặn bốn lớp:
 *
 *   1. CHỈ http/https. Thiếu lớp này thì `file:///etc/passwd` đọc được
 *      tệp trên chính máy chủ.
 *   2. PHÂN GIẢI TÊN MIỀN RỒI MỚI XÉT ĐỊA CHỈ. Chặn theo tên miền là vô
 *      dụng: ai cũng trỏ được một tên miền công khai về 127.0.0.1.
 *   3. XÉT LẠI Ở TỪNG LẦN CHUYỂN HƯỚNG. Một trang công khai hoàn toàn
 *      hợp lệ vẫn có thể trả 302 về 169.254.169.254. Vì vậy phải tự đi
 *      từng bước với `redirect: "manual"` chứ không để `fetch` tự lo.
 *   4. GIỚI HẠN thời gian chờ, dung lượng đọc, và số lần chuyển hướng.
 *      Không có thì một địa chỉ trả dữ liệu vô tận sẽ treo máy chủ.
 *
 * Vẫn còn một khe hở đã biết: giữa lúc phân giải tên miền và lúc kết nối
 * thật, bản ghi DNS có thể đổi (DNS rebinding). Bịt hẳn phải tự mở kết
 * nối tới đúng địa chỉ IP đã kiểm, kèm header Host thủ công. Với một app
 * nội bộ hai mươi người, nơi mọi người đều đăng nhập bằng email công ty,
 * mức đánh đổi đó chưa đáng — nhưng ghi ra đây để ai đọc sau còn biết là
 * nó tồn tại, chứ không tưởng đã kín.
 */

/** Dải địa chỉ không được phép đụng tới. */
function laDiaChiNoiBo(ip: string): boolean {
  const v = isIP(ip);

  if (v === 4) {
    const p = ip.split(".").map(Number);
    if (p[0] === 0) return true; // 0.0.0.0/8
    if (p[0] === 10) return true; // mạng riêng
    if (p[0] === 127) return true; // chính máy này
    if (p[0] === 169 && p[1] === 254) return true; // link-local, metadata đám mây
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // mạng riêng
    if (p[0] === 192 && p[1] === 168) return true; // mạng riêng
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // CGNAT
    if (p[0] >= 224) return true; // multicast và dải dành riêng
    return false;
  }

  if (v === 6) {
    const s = ip.toLowerCase();
    if (s === "::" || s === "::1") return true;
    if (s.startsWith("fe80")) return true; // link-local
    if (/^f[cd]/.test(s)) return true; // unique local
    // ::ffff:a.b.c.d — IPv4 khoác áo IPv6, xét lại theo luật IPv4.
    const v4 = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (v4) return laDiaChiNoiBo(v4[1]);
    return false;
  }

  // Không nhận ra thì coi như không an toàn.
  return true;
}

async function kiemTraAnToan(u: URL): Promise<void> {
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new AppError("Chỉ nhận đường dẫn http hoặc https.");
  }

  const host = u.hostname.replace(/^\[|\]$/g, "");

  if (isIP(host)) {
    if (laDiaChiNoiBo(host)) throw new AppError("Đường dẫn không hợp lệ.");
    return;
  }

  let diaChi: Array<{ address: string }>;
  try {
    diaChi = await lookup(host, { all: true });
  } catch {
    throw new AppError("Không tìm thấy trang này.");
  }

  // TẤT CẢ địa chỉ phải sạch, không phải chỉ địa chỉ đầu tiên: một tên
  // miền trả về nhiều bản ghi thì `fetch` có thể chọn bất kỳ cái nào.
  if (diaChi.some((d) => laDiaChiNoiBo(d.address))) {
    throw new AppError("Đường dẫn không hợp lệ.");
  }
}

const CHO_TOI_DA_MS = 8000;
const CHUYEN_HUONG_TOI_DA = 3;

/** Tải một địa chỉ, kiểm tra lại độ an toàn ở từng lần chuyển hướng. */
async function taiAnToan(dauVao: URL): Promise<{ res: Response; url: URL }> {
  let u = dauVao;

  for (let buoc = 0; buoc <= CHUYEN_HUONG_TOI_DA; buoc++) {
    await kiemTraAnToan(u);

    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(CHO_TOI_DA_MS),
      headers: {
        // Nhiều trang trả về bản rút gọn hoặc chặn thẳng nếu không có
        // User-Agent giống trình duyệt.
        "User-Agent":
          "Mozilla/5.0 (compatible; LHSportHub/1.0; +link-preview)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "vi,en;q=0.8",
      },
      cache: "no-store",
    });

    if (res.status >= 300 && res.status < 400) {
      const tiep = res.headers.get("location");
      if (!tiep) break;
      u = new URL(tiep, u);
      continue;
    }

    return { res, url: u };
  }

  throw new AppError("Đường dẫn chuyển hướng quá nhiều lần.");
}

/** Đọc body nhưng cắt ngang khi quá hạn mức, thay vì nuốt hết. */
async function docCoHanMuc(res: Response, toiDa: number): Promise<Buffer> {
  const body = res.body;
  if (!body) return Buffer.alloc(0);

  const doc = body.getReader();
  const manh: Uint8Array[] = [];
  let tong = 0;

  while (true) {
    const { done, value } = await doc.read();
    if (done) break;
    tong += value.byteLength;
    if (tong > toiDa) {
      await doc.cancel();
      break;
    }
    manh.push(value);
  }

  return Buffer.concat(manh);
}

/** Đổi các thực thể HTML thường gặp về ký tự thật. */
function boThucThe(s: string): string {
  return s
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (ca, ten: string) => {
      if (ten.startsWith("#x") || ten.startsWith("#X")) {
        return String.fromCodePoint(parseInt(ten.slice(2), 16));
      }
      if (ten.startsWith("#")) {
        return String.fromCodePoint(parseInt(ten.slice(1), 10));
      }
      const bang: Record<string, string> = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
        nbsp: " ",
      };
      return bang[ten.toLowerCase()] ?? ca;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Rút một thẻ meta.
 *
 * Dùng biểu thức chính quy chứ không cài trình phân tích HTML: ở đây chỉ
 * cần vài thẻ trong phần `<head>`, mà thêm một gói phụ thuộc cho việc đó
 * thì đắt hơn cái được. Kết quả KHÔNG bao giờ được render thành HTML —
 * nó chỉ đi vào React dưới dạng chuỗi, nên React tự thoát ký tự.
 */
function layMeta(html: string, ten: string[]): string | null {
  for (const t of ten) {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)\\s*=\\s*["']${t}["'][^>]*>`,
      "i",
    );
    const the = html.match(re)?.[0];
    if (!the) continue;
    const giaTri = the.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
    if (giaTri) {
      const sach = boThucThe(giaTri);
      if (sach) return sach;
    }
  }
  return null;
}

export type XemTruocLink = {
  url: string;
  tieuDe: string;
  moTa: string | null;
  /** Địa chỉ ảnh Ở NGUỒN. Chỉ dùng để xem trước lúc soạn bài. */
  anhNguon: string | null;
  ten: string;
};

const HTML_TOI_DA = 512 * 1024;

/** Đọc thông tin xem trước của một đường dẫn. */
export async function docXemTruoc(dauVao: string): Promise<XemTruocLink> {
  let u: URL;
  try {
    u = new URL(dauVao.trim());
  } catch {
    throw new AppError("Đường dẫn không đúng định dạng.");
  }

  const { res, url } = await taiAnToan(u);

  if (!res.ok) {
    throw new AppError(`Không mở được trang này (lỗi ${res.status}).`);
  }

  const loai = res.headers.get("content-type") ?? "";
  if (!/text\/html|application\/xhtml/i.test(loai)) {
    // Không phải trang web thì vẫn cho đăng, chỉ là không có gì để xem
    // trước ngoài tên miền.
    return {
      url: url.toString(),
      tieuDe: url.hostname.replace(/^www\./, ""),
      moTa: null,
      anhNguon: null,
      ten: url.hostname.replace(/^www\./, ""),
    };
  }

  const html = (await docCoHanMuc(res, HTML_TOI_DA)).toString("utf8");

  const tieuDe =
    layMeta(html, ["og:title", "twitter:title"]) ??
    boThucThe(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "") ??
    "";

  const moTa = layMeta(html, [
    "og:description",
    "twitter:description",
    "description",
  ]);

  const anhTho = layMeta(html, ["og:image", "og:image:url", "twitter:image"]);
  let anhNguon: string | null = null;
  if (anhTho) {
    try {
      // Nhiều trang để đường dẫn tương đối; gắn lại vào địa chỉ CUỐI
      // CÙNG sau chuyển hướng chứ không phải địa chỉ người dùng dán.
      anhNguon = new URL(anhTho, url).toString();
    } catch {
      anhNguon = null;
    }
  }

  const ten =
    layMeta(html, ["og:site_name"]) ?? url.hostname.replace(/^www\./, "");

  return {
    url: url.toString(),
    tieuDe: (tieuDe || url.hostname.replace(/^www\./, "")).slice(0, 200),
    moTa: moTa ? moTa.slice(0, 400) : null,
    anhNguon,
    ten: ten.slice(0, 80),
  };
}

const ANH_TOI_DA = 4 * 1024 * 1024;

/**
 * Tải ảnh xem trước về dưới dạng `File`, để đẩy qua `uploadImage`.
 *
 * Trả `null` thay vì ném lỗi khi hỏng: ảnh xem trước là thứ có thì tốt.
 * Một bài đăng không nên thất bại chỉ vì máy chủ của người ta đang chậm.
 */
export async function taiAnhXemTruoc(diaChi: string): Promise<File | null> {
  try {
    const u = new URL(diaChi);
    const { res } = await taiAnToan(u);
    if (!res.ok) return null;

    const buf = await docCoHanMuc(res, ANH_TOI_DA);
    if (buf.byteLength < 100) return null;

    /*
      Loại ảnh xác định bằng CHỮ KÝ NHỊ PHÂN, không theo `Content-Type`
      mà máy chủ kia khai. Header là thứ bên kia muốn viết gì cũng được.

      `uploadImage` cũng tự kiểm magic bytes một lần nữa, rồi nén lại
      bằng sharp — nên kể cả lọt qua đây thì thứ đi vào kho vẫn là một
      tấm WebP do mình sinh ra, không phải tệp gốc của người ta.
    */
    const b = new Uint8Array(buf.subarray(0, 16));
    let loai: string | null = null;
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) loai = "image/jpeg";
    else if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
      loai = "image/png";
    else if (
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50
    )
      loai = "image/webp";

    if (!loai) return null;

    // `new Uint8Array(buf)` chứ không đưa thẳng `Buffer`: kiểu `Buffer`
    // của Node mang `ArrayBufferLike`, có thể là `SharedArrayBuffer`, mà
    // `BlobPart` chỉ nhận `ArrayBuffer`.
    return new File([new Uint8Array(buf)], "anh-xem-truoc", { type: loai });
  } catch {
    return null;
  }
}
