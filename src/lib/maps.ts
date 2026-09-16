/**
 * Dựng link Google Maps từ địa chỉ người dùng gõ, hoặc từ link họ dán vào.
 *
 * Hàm thuần, không chạm database — dùng được ở cả server lẫn client.
 *
 * Không dùng Google Maps API key: bản nhúng đi qua `maps.google.com/maps?output=embed`,
 * còn nút chỉ đường dùng URL scheme chính thức của Google (không cần key,
 * và trên điện thoại sẽ mở thẳng app Google Maps).
 */

/** Tên miền được phép khi người dùng dán link — chặn link lạ chèn vào iframe. */
const ALLOWED_HOSTS = [
  "google.com",
  "www.google.com",
  "maps.google.com",
  "maps.app.goo.gl",
  "goo.gl",
  "g.co",
];

function hostAllowed(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.some(
    (allowed) => h === allowed || h.endsWith(`.${allowed}`),
  );
}

/** Link hợp lệ và thuộc Google thì trả về URL đã chuẩn hoá, không thì null. */
export function parseMapUrl(raw: string | null | undefined): URL | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!hostAllowed(url.hostname)) return null;

  return url;
}

/**
 * Moi toạ độ ra khỏi link Google Maps.
 * Link rút gọn (maps.app.goo.gl) không chứa toạ độ nên sẽ trả về null —
 * lúc đó ta nhúng bản đồ theo địa chỉ chữ, còn link dán vẫn dùng cho nút chỉ đường.
 */
export function extractLatLng(
  raw: string | null | undefined,
): { lat: number; lng: number } | null {
  const url = parseMapUrl(raw);
  if (!url) return null;

  const href = url.href;

  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, //  .../@10.762622,106.660172,17z
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, //  ...!3d10.76!4d106.66
    /[?&](?:q|ll|center|daddr)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, //  ?q=10.76,106.66
  ];

  for (const re of patterns) {
    const m = href.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      return { lat, lng };
    }
  }

  return null;
}

/** Ghép tên sân + địa chỉ thành một chuỗi để tìm trên bản đồ. */
export function mapQuery(
  venueName: string,
  venueAddress?: string | null,
): string {
  return [venueName, venueAddress].filter(Boolean).join(", ").trim();
}

/**
 * Nguồn cho iframe bản đồ.
 * Ưu tiên toạ độ trong link đã dán; không có thì tìm theo địa chỉ chữ.
 */
export function mapEmbedSrc(
  venueName: string,
  venueAddress?: string | null,
  mapUrl?: string | null,
): string | null {
  const coords = extractLatLng(mapUrl);
  const query = coords
    ? `${coords.lat},${coords.lng}`
    : mapQuery(venueName, venueAddress);

  if (!query) return null;

  const params = new URLSearchParams({
    q: query,
    hl: "vi",
    z: coords ? "17" : "16",
    output: "embed",
  });

  return `https://maps.google.com/maps?${params.toString()}`;
}

/**
 * Link cho nút "Chỉ đường".
 * Có link người dùng dán thì dùng thẳng (chính xác nhất, kể cả link rút gọn);
 * không thì dùng URL scheme chính thức của Google.
 */
export function directionsUrl(
  venueName: string,
  venueAddress?: string | null,
  mapUrl?: string | null,
): string | null {
  const pasted = parseMapUrl(mapUrl);
  if (pasted) return pasted.href;

  const coords = extractLatLng(mapUrl);
  const query = coords
    ? `${coords.lat},${coords.lng}`
    : mapQuery(venueName, venueAddress);

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
