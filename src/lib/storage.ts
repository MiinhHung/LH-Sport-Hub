import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";

import { AppError } from "@/lib/auth";
import { UPLOAD } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/server";

type AllowedMime = (typeof UPLOAD.allowedMimeTypes)[number];

/** Chữ ký nhị phân — kiểm tra nội dung thật, không tin `file.type`. */
const MAGIC_BYTES: Array<{ mime: AllowedMime; test: (b: Uint8Array) => boolean }> =
  [
    {
      mime: "image/jpeg",
      test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    },
    {
      mime: "image/png",
      test: (b) =>
        b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
    },
    {
      mime: "image/webp",
      test: (b) =>
        b[0] === 0x52 &&
        b[1] === 0x49 &&
        b[2] === 0x46 &&
        b[3] === 0x46 &&
        b[8] === 0x57 &&
        b[9] === 0x45 &&
        b[10] === 0x42 &&
        b[11] === 0x50,
    },
  ];

function humanSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export type UploadedImage = {
  url: string;
  width: number;
  height: number;
  fileSize: number;
};

type Preset = "post" | "avatar" | "proof";

/** Cạnh dài tối đa sau khi nén, theo mục đích dùng. */
const PRESETS: Record<Preset, { maxEdge: number; quality: number }> = {
  post: { maxEdge: 1600, quality: 80 },
  proof: { maxEdge: 1400, quality: 78 },
  avatar: { maxEdge: 512, quality: 85 },
};

/**
 * Nhận ảnh, kiểm tra thật sự là ảnh, nén lại rồi đẩy lên storage.
 *
 * Luôn xuất ra WebP: ảnh điện thoại 4–5MB rút còn ~150–250KB, nên
 * bảng tin không phải tải hàng chục MB mỗi lần mở.
 * Tên file người dùng đặt bị bỏ hoàn toàn — object key do server sinh.
 */
export async function uploadImage(
  file: File,
  folder: string,
  preset: Preset = "post",
): Promise<UploadedImage> {
  if (file.size === 0) throw new AppError("File rỗng.");
  if (file.size > UPLOAD.maxBytes) {
    throw new AppError(
      `Ảnh tối đa ${humanSize(UPLOAD.maxBytes)} (ảnh của bạn ${humanSize(file.size)}).`,
    );
  }

  if (!UPLOAD.allowedMimeTypes.includes(file.type as AllowedMime)) {
    throw new AppError("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
  }

  const original = Buffer.from(await file.arrayBuffer());
  const head = new Uint8Array(original.subarray(0, 16));
  const detected = MAGIC_BYTES.find((m) => m.test(head))?.mime;

  if (!detected) throw new AppError("File không phải ảnh hợp lệ.");
  if (detected !== file.type) {
    throw new AppError("Nội dung file không khớp với định dạng khai báo.");
  }

  const { maxEdge, quality } = PRESETS[preset];

  let output: Buffer;
  let width: number;
  let height: number;

  try {
    const pipeline = sharp(original, { failOn: "error" })
      // Xoay theo EXIF rồi bỏ metadata — ảnh điện thoại hay bị nằm ngang,
      // và EXIF còn chứa toạ độ GPS không nên đẩy lên.
      .rotate()
      .resize({
        width: maxEdge,
        height: maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, effort: 4 });

    const result = await pipeline.toBuffer({ resolveWithObject: true });
    output = result.data;
    width = result.info.width;
    height = result.info.height;
  } catch (error) {
    console.error("[storage] không xử lý được ảnh:", error);
    throw new AppError("Ảnh bị lỗi hoặc không đọc được. Thử ảnh khác nhé.");
  }

  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
  const key = `${safeFolder}/${randomUUID()}.webp`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(UPLOAD.bucket)
    .upload(key, output, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    console.error("[storage] upload thất bại:", error);
    throw new AppError("Không tải được ảnh lên. Vui lòng thử lại.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(UPLOAD.bucket).getPublicUrl(key);

  return { url: publicUrl, width, height, fileSize: output.byteLength };
}

export async function deleteImage(publicUrl: string): Promise<void> {
  const marker = `/object/public/${UPLOAD.bucket}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return;

  const key = publicUrl.slice(index + marker.length);
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(UPLOAD.bucket).remove([key]);
  if (error) console.error("[storage] xoá ảnh thất bại:", error);
}
