# DESIGN.md: LH Sport Hub

Luật thiết kế chung cho cả app. Mọi trang và component mới phải theo file này.
Logo, nội dung và hình ảnh của team giữ nguyên, chỉ đổi cách trình bày.

## 1. Hướng thiết kế

App nội bộ của team Light Human, dùng hằng ngày, chủ yếu trên điện thoại.
Giọng điệu: gọn, rõ, chỉn chu, giống một câu lạc bộ có tổ chức chứ không giống
một template. Thông tin đi trước, trang trí đi sau.

Thông số (theo taste-skill): `DESIGN_VARIANCE 4`, `MOTION_INTENSITY 3`,
`VISUAL_DENSITY 5` cho phần app. Trang giới thiệu cao hơn: `7 / 5 / 3`.

## 2. Màu

Một bảng màu duy nhất, đã có trong `globals.css`. Không thêm màu mới.

| Vai trò | Token | Ghi chú |
|---|---|---|
| Nền trang | `ink-950` | phẳng, không gradient, không nhiễu |
| Mặt thẻ | `ink-900` (trắng) | viền `ink-800`, không đổ bóng |
| Vùng chìm | `ink-850` | ô nhập, khối phụ trong thẻ |
| Chữ tiêu đề | `ink-100` (navy) | |
| Chữ nội dung | `ink-300` | |
| Chữ phụ | `ink-500` | tối thiểu, không dùng nhạt hơn cho chữ đọc |
| Hành động chính | `navy-900` nền, chữ trắng | nút primary |
| Nhấn (accent) | `gold-500` nền, chữ `navy-900` | DUY NHẤT một accent: nút accent, vạch active, số nổi bật |
| Chữ vàng trên nền sáng | `gold-700` | không dùng `gold-600` làm chữ |

Màu trạng thái, chỉ có 4, dùng đúng nghĩa:
- Đang mở / cần chú ý: vàng (`gold-50` nền, `gold-700` chữ)
- Đã chốt / thành công: xanh lục (`emerald`)
- Đã xong / trung tính: xám navy (`ink-850`, `ink-400`)
- Cần xử lý / lỗi / tranh chấp: đỏ (`rose`)

Cấm: tím, xanh trời (`sky`), hổ phách (`amber`) riêng lẻ, gradient trang trí,
quầng sáng mờ (`blur-3xl`), neon, đen thuần, trắng thuần làm chữ trên nền sáng.

## 3. Chữ

MỘT họ chữ: Plus Jakarta Sans (đã nạp ở `layout.tsx`). Không serif, không mono.

| Cấp | Cỡ | Đậm | Dùng cho |
|---|---|---|---|
| Tiêu đề trang | 28 / 32px (`sm`) | 700 | `PageIntro` |
| Tiêu đề mục | 16px | 600 | `SectionTitle`, tiêu đề thẻ |
| Nội dung | 14 / 15px | 400 / 500 | |
| Chữ phụ | 12.5 / 13px | 500 | `MetaLine`, giờ, nhãn |
| Số liệu | theo ngữ cảnh | 700 | luôn kèm `tabular` |

- Độ đậm chỉ dùng 400, 500, 600, 700. KHÔNG dùng `font-extrabold` / `font-black`.
- KHÔNG dùng chữ HOA giãn cách (`uppercase tracking-*`) làm nhãn. Viết hoa chữ cái đầu bình thường.
- KHÔNG dùng em-dash (`—`) trong chữ hiển thị. Dùng dấu phẩy, hai chấm hoặc gạch nối `-`.
- KHÔNG emoji trong giao diện. Dùng icon từ `@/components/icons`.
- `font-display` chỉ là tên gọi cho "tiêu đề": cùng họ chữ, đậm 700, khít `-0.02em`.

## 4. Hình khối

MỘT thang bo góc:

| Phần tử | Bo góc |
|---|---|
| Nút, ô nhập, badge, thanh lọc, khối chìm | `rounded-lg` (8px) |
| Thẻ, hộp, ảnh, modal, dropdown | `rounded-xl` (12px) |
| Avatar, chấm, chip lọc dạng viên | `rounded-full` |

Cấm `rounded-2xl`, `rounded-3xl`, `rounded-[Npx]` ngoài bảng trên. Nút KHÔNG
bo tròn hết (`rounded-full`) trừ nút chỉ có icon trong avatar/menu.

Bề mặt: thẻ = nền trắng + viền 1px `ink-800`. Không đổ bóng mặc định. Chỉ
popover / dropdown / modal được dùng `--shadow-pop`. Thẻ lồng thẻ bị cấm, dùng
`Well` hoặc đường kẻ.

## 5. Bố cục

- Khung nội dung: `max-w-7xl`, lề `px-4 sm:px-6 lg:px-8` (đã có ở layout).
- Nhịp dọc giữa khối: `space-y-6`; trong khối: `space-y-3` / `gap-3`.
- Không lặp "ba thẻ bằng nhau" cho tính năng. Danh sách dài dùng hàng có
  `divide-y`, không bọc mỗi hàng trong một thẻ.
- Trang nào cũng mở đầu bằng `PageIntro` (tiêu đề + một dòng dẫn + hành động).
  KHÔNG banner gradient, KHÔNG nhãn phụ phía trên tiêu đề trừ khi thật sự cần
  (tối đa 1 trang trong 3 trang có nhãn).
- Mobile trước: mọi lưới nhiều cột phải khai rõ cột dưới 768px. Vùng bấm tối thiểu 40px.

## 6. Chuyển động

Nhẹ và có lý do: vào trang (`animate-rise`), phản hồi bấm (`active:scale-[0.98]`),
chuyển trạng thái (màu, viền 150-200ms). Không `animate-pulse` trang trí, không
vòng lặp vô hạn, không parallax trong app. Chỉ animate `transform` và `opacity`.
Mọi chuyển động tôn trọng `prefers-reduced-motion` (đã có ở `globals.css`).

## 7. Component bắt buộc

Dùng lại, không tự dựng bản riêng: `PageIntro`, `SectionTitle`, `Card`,
`Well`, `MetaLine`, `Badge`, `Button` / `LinkButton`, `Field` + `Input` /
`Textarea` / `Select`, `EmptyState`, `Alert`, `Avatar`, `Stat`, `Skeleton`.

Mỗi component phải có đủ trạng thái: mặc định, hover, focus-visible, active,
disabled, đang tải, lỗi. Trạng thái rỗng và đang tải phải đúng dáng nội dung thật.

## 8. Chữ trong giao diện

Câu ngắn, cụ thể, nói thẳng việc. Không "Khám phá", "Trải nghiệm", "Tuyệt vời".
Nhãn nút là động từ ("Tạo kèo", "Báo đi", "Gửi"). Một ý định = một nhãn trên cả
trang. Không số liệu bịa.

## 9. Trợ năng (WCAG 2.2 AA)

- Chữ đọc được đạt 4.5:1; chữ lớn và viền điều khiển đạt 3:1.
- Vòng focus vàng đã có ở `globals.css`, không gỡ.
- Icon chỉ có nghĩa khi đứng một mình phải có `aria-label`.
- Màu không là kênh thông tin duy nhất: trạng thái luôn kèm chữ.

## 10. Kiểm trước khi xong

- [ ] Không còn `rounded-2xl`, `rounded-3xl`, `font-extrabold`, `uppercase tracking`, `animate-pulse` trang trí, emoji, `—`
- [ ] Màu chỉ trong bảng mục 2; trạng thái chỉ 4 loại
- [ ] Chạy được ở 375px, không cuộn ngang
- [ ] Có trạng thái rỗng, đang tải, lỗi
- [ ] `npm run typecheck` và `npm run lint` sạch

## 11. Trang giới thiệu (`/gioi-thieu`)

Viết theo khuôn của skill `design-system` (Guideline Authoring Workflow 6 bước,
Required Output Structure, Quality Gates). Chỉ dùng khuôn và quy tắc của skill;
token là navy, vàng kim và Plus Jakarta Sans của dự án. Quy ước: quy tắc bắt
buộc dùng "must", khuyến nghị dùng "should", mọi quy tắc trợ năng kèm cách kiểm.

### 11.1 Context and goals

Ý định thiết kế: trang giới thiệu của team Light Human là một câu chuyện ngắn
dẫn đồng nghiệp từ hero navy vào app, bằng một cú đánh cầu và một cuộn trang
mượt, mà không đổi một chữ nội dung nào.

- Khán giả: đồng nghiệp trong công ty, không phải khách lạ. Xem chủ yếu trên điện thoại.
- Thông số: `DESIGN_VARIANCE 7`, `MOTION_INTENSITY 5`, `VISUAL_DENSITY 3`.
- Nội dung của team (tiêu đề, đoạn văn, chú thích, câu đố và đáp án, nhãn nút),
  logo, ảnh và video must giữ nguyên 100%. Khi nội dung xung đột với luật trình
  bày (emoji, nhãn nhỏ, dải chữ), nội dung thắng; trình bày phải tìm cách khác.
- Chỉ có nền sáng, riêng hero là một khối navy duy nhất. Trang must không đảo màu giữa trang.

**Cấu trúc trang**

| # | Section | Họ bố cục | Mục đích |
|---|---|---|---|
| 1 | Hero | Nhiều lớp navy (quầng đèn, sàn sân, quỹ đạo, bụi, quả cầu); chữ lệch trái / quả cầu lệch phải (desktop), quả cầu trên chữ dưới (mobile); `min-h-[100dvh]` | Nhận diện, một nút vào app |
| 2 | Không gian thư giãn | Tấm trắng bo góc trượt đè hero; lưới 12 cột, chữ 5 / ảnh 7 có parallax nhẹ | Nói app này để làm gì |
| 3 | Nơi chia sẻ và kết nối | Khối ghim 520dvh: tiêu đề, bốn ảnh ở giữa, hai người chơi hai mép đánh cầu qua lưới | Kể chuyện: mỗi cú đánh rơi vào một ảnh |
| 4 | Phim | Nét nối ngắn + khối video rộng | Cảm giác sân thật |
| 5 | Trong này có gì | Khối ghim: chồng ảnh xếp lớp + chữ đổi theo cuộn | Dẫn vào bốn mục của app |
| 6 | Luật nhà | Dải nền `navy-50`, một câu chữ lớn lệch trái | Giọng nhà, điểm nghỉ |
| 7 | Đố vui + nút | Khối giữa: tiêu đề, trò phát cầu, một nút | Chơi một chút rồi vào app |

Hai section liên tiếp must không cùng họ bố cục; trang must không dùng ba thẻ bằng nhau.

### 11.2 Design tokens and foundations

**Màu** (token trong `globals.css`, không thêm token mới; component must dùng
class token, không hex thô. Hex chỉ còn ở bốn hằng của `page.tsx` vì component
ghép độ mờ vào cuối, ở thuộc tính SVG và ở cảnh 3D, mỗi chỗ có chú thích).

| Vai trò | Token |
|---|---|
| Nền hero, tiêu đề, nét | `navy-900` |
| Nền video, khối tối | `navy-950` |
| Dải nền nhẹ (Luật nhà), vùng chìm | `navy-50`, `ink-850` |
| Chữ nội dung, chữ phụ trên nền sáng | `ink-300`, `ink-400` |
| Chữ vàng trên nền sáng | `gold-700` (must, không dùng `gold-600` làm chữ) |
| Vàng trên nền navy (nhãn, vật thể 3D) | `gold-300`, `gold-400` |
| Hành động chính trên nền navy hoặc trắng | `gold-accent` nền, chữ `navy-900` |
| Viền, vạch | `ink-800` |

Trang must chỉ có MỘT accent vàng. Nhánh `(marketing)` mang `.theme-sang` và
header landing tự mang `.theme-sang` riêng, nên bật nền tối trong app must không
làm lệch tông; nút trên trang must đặt cứng biến thể `dark:` về cùng màu.

**Chữ**: một họ Plus Jakarta Sans, đậm 400 / 500 / 600 / 700.

| Cấp | 375px / `sm` / `lg` | Đậm |
|---|---|---|
| Tiêu đề hero | 44-64 (`clamp`) / 72 / 96 | 700 |
| Câu Luật nhà | 34 / 56 / 72 | 700 |
| Tiêu đề section | 26-32 / 38-46 | 700 |
| Tên mục, tên ảnh | 13.5-28 / 17-34 | 700 |
| Đoạn văn | 16, dòng 1.8, tối đa 52 ký tự/dòng | 400 |
| Dòng phụ hero | 16 / 17 | 500 |
| Nhãn nhỏ, chú thích | 13-14 | 600 |

**Khoảng cách và bố cục**: khung `max-w-6xl` (hero, giới thiệu, trận cầu, Luật
nhà) hoặc `max-w-5xl` (video, trong này có gì); lề `px-5 sm:px-10`; nhịp dọc
giữa section `py-24 sm:py-32` (Luật nhà `sm:py-36`); khoảng trong khối theo
thang 2 / 3 / 5 / 8 / 10 (`gap-*`). Mọi lưới nhiều cột must khai rõ số cột dưới
768px (`grid-cols-1` hoặc `grid-cols-2`).

**Hình khối**: một thang bo góc: nút `rounded-lg`; ảnh, video, khối sân
`rounded-xl`; nút tròn điều khiển và chấm `rounded-full`. Must không `rounded-2xl|3xl`.
Ảnh chỉ có viền `ring-1 ring-ink-800`; must không đổ bóng.

**MOTION TOKEN: nguồn sự thật duy nhất** (`src/components/landing/motion.ts`).
Component must lấy duration, easing, spring, độ trễ và thông số cuộn từ file
này (hằng TypeScript, hoặc biến CSS `--m-instant|fast|base|slow|ease` được
`(marketing)/layout.tsx` đặt từ `MOTION_CSS_VARS` cho class Tailwind). Must
không viết số thời gian rời trong component.

| Token | Giá trị | Dùng cho |
|---|---|---|
| `motion.duration.instant` | 200ms | hover, đổi màu, viền, nhấn nút |
| `motion.duration.fast` | 300ms | hiện/ẩn nhỏ, đổi trạng thái header, đổi chữ trong khối |
| `motion.duration.base` | 500ms | nét kẻ, dấu nháy, chữ hero vào trang, kết quả trò chơi |
| `motion.duration.slow` | 800ms | hiện khối khi vào tầm nhìn, chữ tiêu đề, chồng ảnh, bay của quả cầu đố vui |
| `motion.duration.draw` | 1600ms | nét vẽ dài một lần (quỹ đạo hero) |
| `motion.duration.snap` | 120ms | vi chuyển động vật lý (lấy đà của vợt đố vui) |
| `motion.easing.out` | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out expo) | mọi hiện dần và trượt |
| `motion.spring.scroll` | stiffness 140, damping 28, mass 0.4 | thanh tiến trình, trận cầu, nét nối |
| `motion.spring.pointer` | 60 / 18 / 0.6 | parallax theo con trỏ ở hero |
| `motion.spring.pop` / `swing` / `recover` / `reset` | 480/20; 190/16/1; 90/18/1; 260/18 | trò đố vui (chữ số rơi, vung vợt, thu vợt, về thế) |
| `motion.stagger.word` | 65ms | giữa hai từ của tiêu đề |
| `motion.stagger.item` | 60ms | giữa hai mục cùng hàng |
| `motion.delay.heading` / `body` / `hero` | 80 / 160 / 90ms | tiêu đề vào trước, nội dung sau, nhịp phần tử hero |
| `motion.reveal.offset` | 20px | khoảng trượt của mọi lần hiện dần |
| `motion.reveal.margin` | vào 12% từ đáy khung nhìn | ngưỡng kích hoạt |
| `motion.parallax` | ảnh ±22px scale 1,08; hero trôi 150px, nhỏ còn 0,8, mờ còn 0,15 | parallax cuộn |
| `motion.lenis` | `duration` 1,15s; easing ease-out expo; `smoothWheel` bật; `syncTouch` tắt; `anchors` bật; `allowNestedScroll` bật; `autoRaf` tắt | cuộn mượt |

Quy tắc chung (must):
- Chỉ animate `transform` và `opacity`. Mọi giá trị nối với cuộn đi qua motion
  value (`useScroll` / `useSpring` / `useTransform`); không `setState` theo
  khung hình, không scroll listener tự viết.
- Mỗi chuyển động trả lời được "nó nói điều gì" (thứ bậc, kể chuyện, phản hồi).
  Cùng một loại hiệu ứng must dùng cùng token: hover luôn 200ms, header luôn 300ms,
  hiện khối luôn 800ms + offset 20px + easing `out`.
- Một vòng lặp khung hình duy nhất: Lenis chạy qua `frame.update` của motion.
- Cuộn mượt phải tắt hoàn toàn khi giảm chuyển động.

### 11.3 Component-level rules

Ký hiệu trạng thái: M mặc định, H hover, F focus-visible, A active, D disabled,
L loading, E error. Vòng focus là `outline` 2px, offset 2px: `gold-700` trên
nền sáng, `gold-300` trên nền navy (hero, header trong suốt, khối video), khai
ở `globals.css` khối "Trang giới thiệu". Bàn phím: Tab đi theo thứ tự DOM,
Enter / Space kích hoạt. Chuột: hover chỉ có trên máy có `pointer: fine`. Cảm ứng:
không có hover, vùng bấm tối thiểu 44px với nút, 24px với chấm chỉ mục.

**Nút CTA (`LinkButton`)**: "Đăng nhập" / "Vào bảng tin"; hero dùng `accent`, cuối trang dùng `primary`.
- Anatomy: một nhãn, không icon. `whitespace-nowrap`, `px-8`, cao 44px, `rounded-lg`.
- M `gold-accent` + chữ `navy-900` (hero) hoặc `navy-900` + chữ trắng (cuối trang). H nhấc `-translate-y-0.5`, đổi sắc 200ms. F vòng focus theo nền. A `scale-[0.98]`. D, L, E: không áp dụng (là liên kết điều hướng, không gửi dữ liệu).
- Responsive: nhãn must một dòng ở mọi cỡ. Nhãn dài: không áp dụng (nhãn cố định, hai giá trị).
- Một ý định một nhãn: header, hero và cuối trang must dùng cùng nhãn cho cùng việc.

**Header trang giới thiệu (`LandingHeaderShell`)**: logo, menu chính, nút CTA, (đã đăng nhập) tin nhắn, thông báo, avatar.
- Hai trạng thái theo vị trí: trên hero (trong suốt, chữ và logo-light trắng) và qua hero (nền trắng đặc, không blur, viền `ink-800`, chữ `navy-900`, logo thường). Chuyển 300ms (`fast`) bằng cross-fade hai logo trong cùng một khung cố định, must không nhảy layout.
- Phát hiện bằng `IntersectionObserver` trên `[data-landing-hero]`. Trượt ẩn khi cuộn xuống (sau 480px), hiện khi cuộn lên, và hiện khi focus vào header.
- Mục menu: M `text-white/80` hoặc `ink-400`; H sáng lên / nền `ink-850` 200ms; mục đang chọn `aria-current="page"` có vạch vàng chân và chữ đậm; F vòng focus; A, D, L, E: không áp dụng (liên kết). Số huy hiệu: `rose`, kèm `aria-label` đọc số.
- Must không có `ThemeToggle`. Menu avatar mở dạng popover `z-[70]`, không bị header che.
- Responsive: dưới 1024px menu chính ẩn (đã nằm trong menu avatar); nút CTA luôn hiện.

**Ảnh + chú thích**: ảnh `rounded-xl` + viền `ink-800`, chú thích bên dưới (không đè lên ảnh).
- M ảnh tỉ lệ cố định (4/3 mobile, 16/10 từ `md`) nên không nhảy layout. Chưa hiện: khung `ink-850`. H, F, A, D, L, E: không áp dụng (ảnh không bấm được). Lỗi tải ảnh: khung `ink-850` giữ nguyên chỗ, chữ chú thích vẫn đọc được.
- Chú thích dài: xuống dòng tự nhiên, không cắt; 13.5px trên 375px, hai cột nên tối đa ba dòng.
- Ảnh trang trí `alt=""`; ảnh có nghĩa độc lập (ảnh section 2) must có `alt` mô tả.

**Video + nút Tạm dừng / Phát (`ShowcaseVideo`)**: video muted, loop, `preload="none"`, tải khi còn cách 1,5 màn hình.
- M đang phát, nút hiện biểu tượng Tạm dừng; nút tròn 44px `navy-900` đặt góc dưới phải. H nền `navy-800` 200ms. F vòng focus `gold-300`. A `scale-[0.98]`. D: không áp dụng. L: ảnh bìa hiển thị đến khi có khung hình. E: lỗi tải video thì giữ ảnh bìa, nút Phát vẫn bấm được.
- Bàn phím: Tab tới nút, Enter / Space đổi Phát / Tạm dừng. Giảm chuyển động: must không tự phát. Người dùng đã Tạm dừng thì must không tự phát lại khi cuộn.
- `aria-label` nút đổi theo trạng thái ("Tạm dừng video" / "Phát video").

**Trận cầu (`JourneyLine`, section 3)**: khối ghim 520dvh; tiến trình = spring(`scrollYProgress`).
- Anatomy: tiêu đề + câu dẫn; lưới bốn ảnh (vùng `p1..p4`) giữa hai người chơi (vùng `tl`, `tr`); lớp bay gồm cầu, vệt đuôi 9 chấm, hai vòng sáng.
- Người chơi chỉ có MỘT tư thế (`danh-cau.webp`): must dựng bằng hai lớp `clip-path` (thân, tay + vợt xoay quanh trục vai) hoà trộn `darken`, người phải lật gương; must không vẽ lại người bằng SVG.
- Một cú đánh chiếm 0,235 tiến độ khối (bốn cú, bắt đầu ở 0,05). Khi `u` là tiến độ nội bộ của cú: 0-0,26 lấy đà (tay -40 độ, thân ngả lùi, nhún); 0,26-0,34 giữ thế; 0,34-0,43 vung tới +24 độ; 0,42 chạm cầu (vòng sáng ở mặt vợt); 0,42-0,82 bay theo Bézier, easing `1-(1-t)^2.4`, xoay theo tiếp tuyến, vệt đuôi mờ dần; 0,82-0,95 đáp (vòng sáng ở ảnh, cầu nhỏ và mờ dần, ảnh hiện scale 0,94-1); 0,43-1 thu vợt.
- Cú 1, 3 từ người trái sang ảnh phải; cú 2, 4 từ người phải sang ảnh trái. Tiến trình là hàm thuần của tiến độ: cuộn ngược must chạy ngược.
- States: M khung ảnh `ink-850` + hai người ở thế nghỉ. H, A, F, D, L, E: không áp dụng (không tương tác). Ảnh chưa hiện là khung rỗng có chỗ, không nhảy layout.
- Giảm chuyển động: must không ghim; hiện đủ bốn ảnh có chữ, hai bóng người ở thế nghỉ, bốn đường bay vẽ mờ.
- Responsive: dưới 768px lưới `grid-cols-2` + hàng người chơi dưới cùng, người cao tối đa 232px; từ `md` lưới 4 cột (người / ảnh / ảnh / người), người cao tối đa 360px.

**Trong này có gì (`VongQuayMuc`, section 5)**: khối ghim, chỉ số mục = `floor(scrollYProgress * n)`.
- Anatomy: tiêu đề, chồng ba ảnh xếp lớp nghiêng, tên mục + mô tả + liên kết "Vào xem", hai nút mũi tên, bốn chấm chỉ mục.
- M mục đang chọn rõ (ảnh giữa, chấm dài vàng). H nút: nền `ink-850` 200ms; liên kết: gạch chân + mờ nhẹ. F vòng focus. A `scale-[0.98]`. D, L, E: không áp dụng (vòng quay không chạm biên, nội dung tĩnh).
- Bàn phím: ← → đổi mục khi focus nằm trong khối; nút và chấm là `button` có `aria-label`; vùng bấm chấm 24px+. Nút cuộn trang chứ không tự đặt chỉ số (một nguồn sự thật là vị trí cuộn). Vùng đọc `aria-live="polite"` báo "Mục i trên n".
- Nội dung dài: mô tả xuống dòng, không cắt; tên mục dài ("Bảng tin & nhắn riêng") must không tràn khung ở 375px.
- Giảm chuyển động: không ghim, mục đổi trực tiếp bằng nút.

**Trò đố vui (`DoVui`, section 7)**: tám ô đáp án (ngày / tháng / năm), mười quả cầu, người que.
- M ô trống viền `ink-800`; ô đang chờ viền vàng + nền vàng nhạt; H quả cầu `scale 1,12`; F vòng focus trên từng quả cầu và quả trên tay; A `scale 0,94` (quả cầu), vợt ngả theo lúc kéo; D quả cầu mờ 40% khi đang bay hoặc đã đủ tám số; L (đang bay): các nút khoá; E (sai ngày): viền ô `rose`, tiêu đề "Cầu ra ngoài rồi" + rung nhẹ (bỏ rung khi giảm chuyển động) + nút "Chơi lại".
- Đường chơi không cần kéo: quả trên tay là nút, bấm hoặc Enter để phát. Kéo yếu thì không mất lượt. Cảm ứng: `touch-none` trên quả cầu trên tay.
- Trạng thái rỗng: dòng gợi ý "Bấm một quả cầu ở dưới sân để cầm lên." Kết quả đúng: "Chuẩn luôn!".
- Khoảng và chữ: ô 44px (48px từ `sm`), `rounded-xl`; số 20-22px đậm 700.

**Thanh tiến trình cuộn (`ScrollProgress`)**: nét vàng cao 3px ở đỉnh trang, `scaleX` = spring(`scrollYProgress`).
- M `gold-500`. H, F, A, D, L, E: không áp dụng (trang trí, `aria-hidden`, `pointer-events-none`). Giảm chuyển động: không hiện.

**Hero**: tối đa 4 phần tử chữ (nhãn, tiêu đề, dòng phụ gồm ba mảnh "Cầu lông & bơi", "Sáng thứ 7", "Nội bộ công ty", nút). Vào trang bằng keyframe `rise`, nhịp `delay.hero`, từng từ của tiêu đề; chữ là HTML thường nên LCP là chữ. Must không có dải chữ trang trí cuối hero, không gợi ý "Scroll".
- Ba mảnh dòng phụ hiển thị ở mọi cỡ (trước đây ẩn dưới `sm`), xuống dòng khi hẹp.
- Quả cầu 3D nạp bằng `next/dynamic` (`ssr: false`) sau `requestIdleCallback`, canvas trong suốt; quả cầu SVG tĩnh luôn dựng sẵn và là phương án thay thế khi chưa nạp xong, không có WebGL, WebGL lỗi (error boundary) hoặc giảm chuyển động.

**Hiện dần và tiêu đề (`Reveal`, `CutReveal`, `Eyebrow`, `Quote`)**: một lần khi vào tầm nhìn bằng `IntersectionObserver` (HTML máy chủ vẫn hiện sẵn nếu JS không chạy). Chữ tiêu đề trồi lên từng từ, có bản `sr-only` đọc nguyên câu. Giảm chuyển động: hiện thẳng.

**Cuộn mượt (`SmoothScroll`)**: chỉ bọc nhánh `(marketing)`; thông số ở `motion.lenis`. Must huỷ đúng khi unmount, không phá liên kết `#co-gi`, phím Tab / focus, vùng cuộn lồng nhau; tắt khi giảm chuyển động.

### 11.4 Accessibility requirements and testable acceptance criteria

| Yêu cầu | Cách kiểm |
|---|---|
| Chữ nội dung đạt 4.5:1 trên nền sáng; chữ lớn và viền điều khiển đạt 3:1; chữ trên navy dùng `navy-50` / `navy-100` / `gold-300` | Đo tương phản bằng công cụ của trình duyệt trên từng cấp chữ; không có chữ dùng độ mờ để nhạt đi |
| Vòng focus thấy rõ trên cả nền navy lẫn nền trắng | Tab qua toàn trang ở trạng thái trên hero, qua hero và trong khối video; vòng phải đạt 3:1 với nền kề |
| Mọi điều khiển dùng được bằng bàn phím | Chỉ dùng Tab / Enter / Space / ← →: vào được nút CTA, menu, nút video, vòng quay, trò đố vui |
| Vùng bấm đủ lớn | Đo bằng DevTools: nút 44px, chấm chỉ mục 24px |
| Video tự phát có cách tạm dừng (WCAG 2.2.2) | Bấm nút Tạm dừng, cuộn đi rồi cuộn lại: video không tự phát |
| Giảm chuyển động tắt mọi chuyển động | Bật `prefers-reduced-motion`: hero tĩnh, không ghim, không parallax, không Lenis, video không tự phát, không rung; không lỗi hydration trong console |
| Không mất nội dung khi tắt WebGL | Tắt WebGL: hero vẫn có chữ, nút và quả cầu SVG |
| Không cuộn ngang ở 375px | `document.documentElement.scrollWidth <= innerWidth` |
| Máy đọc màn hình đọc đúng | Tiêu đề chạy hiệu ứng có bản `sr-only`; bóng người đầu `role="img"` có `aria-label`, bóng thứ hai và lớp bay `aria-hidden`; vùng "Mục i trên n" là `aria-live` |
| Không nhảy layout (CLS < 0,1) | Đổi trạng thái header, hiện ảnh, tải cảnh 3D: không phần tử nào đổi kích thước |
| Hiệu năng | LCP là chữ tiêu đề hero, dưới 2,5 giây; three.js không nằm trong gói đầu; ảnh dưới hero không `priority` |
| Màu không là kênh thông tin duy nhất | Sai ở trò đố vui: có chữ "Cầu ra ngoài rồi", không chỉ viền đỏ |

### 11.5 Content and tone standards with examples

- Nội dung của team must giữ nguyên từng ký tự, kể cả emoji và dấu câu gốc
  (ví dụ tiêu đề "🌿 Không gian thư giãn của Light Human"). Đổi cách trình bày được,
  đổi chữ thì must hỏi chủ dự án.
- Giọng: câu ngắn, cụ thể, nói thẳng việc, tiếng Việt thân mật giữa đồng nghiệp.
  Ví dụ đúng: "Thua thì bao, đừng quỵt." Ví dụ sai: "Khám phá trải nghiệm tuyệt vời".
- Nhãn nút là hành động hoặc đích đến và một ý định một nhãn: "Đăng nhập" /
  "Vào bảng tin". Must không có hai nhãn khác nhau cho cùng một việc.
- Nhãn nhỏ phía trên tiêu đề (hero "Light Human", section 2 "Light Human",
  section 5 "Trong này có gì") là nội dung của team nên giữ; chúng viết thường,
  không HOA giãn cách. Should không thêm nhãn nhỏ mới.
- Must không số liệu bịa, không chữ mới do nhà thiết kế tự thêm vào giao diện
  ngoài nhãn trợ năng (ví dụ "Tạm dừng video", "Phát video").

### 11.6 Anti-patterns and prohibited implementations

Những thứ đã bị loại khỏi trang này, và must không quay lại:
- Con trỏ tuỳ biến (`ConTroCau`): hại trợ năng và hiệu năng.
- Màn mở đầu `IntroCurtain`: chặn nội dung 2,8 giây, khoá cuộn, làm chậm LCP.
- Hero ghim 200vh với vệt quét `clip-path`, nhấc chữ theo con trỏ, mũi tên mời cuộn, dải chữ trang trí cuối hero.
- Quầng neon, hạt nhiễu, `mix-blend-screen` chồng lớp, gradient trang trí (chỉ còn hai quầng đèn rất dịu ở hero).
- Scroll listener tự viết (`window.addEventListener("scroll")`) và `setState` theo từng khung hình cuộn.
- Vòng lặp vô hạn trang trí (quả cầu nhấp nhô, ô chờ "thở"). Chỉ còn mũi tên "Kéo xuống" lặp ba lần như chỉ dẫn, và tắt khi giảm chuyển động.
- Em-dash mới thêm vào chữ hiển thị, emoji do nhà thiết kế tự thêm (emoji gốc của team được giữ).
- Số thời gian, easing, spring rời trong component thay vì lấy từ `motion.ts`.
- `rounded-2xl|3xl`, `font-extrabold`, đổ bóng ảnh, nhãn HOA giãn cách.
- Ba thẻ bằng nhau, zigzag ảnh-chữ quá hai lần liên tiếp.
- Hai nhãn khác nhau cho cùng một hành động; nút CTA xuống dòng.
- Header phụ thuộc `.dark` hoặc có `ThemeToggle`; `useReducedMotion` để đổi cấu trúc trang (gây hydration mismatch, dùng `useCalm`).

Ghi chú di chuyển: các file `con-tro-cau.tsx`, `intro-curtain.tsx`, `scroll-cue.tsx`, `feature-index.tsx`, `hero-alert.tsx` còn trong `components/landing` nhưng không ai dùng; should xoá khi chủ dự án đồng ý.

### 11.7 QA checklist

- [ ] Đối chiếu từng chuỗi chữ hiển thị với bản gốc: không đổi một ký tự
- [ ] Không còn số duration / easing / spring / delay rời: `grep` ra từ `motion.ts` hoặc biến `--m-*`
- [ ] Hover cùng 200ms, header cùng 300ms, hiện khối cùng 800ms + 20px + easing `out`
- [ ] Mỗi nút / liên kết / điều khiển có đủ trạng thái đã khai ở 11.3, vòng focus thấy rõ trên nền navy và nền trắng
- [ ] Hero tối đa 4 phần tử chữ, vừa một màn hình ở 375 và 1440, LCP là chữ
- [ ] Hai section liên tiếp không cùng họ bố cục
- [ ] Giảm chuyển động: tĩnh hoàn toàn, video không tự phát, không lỗi hydration
- [ ] Tắt WebGL: hero vẫn đầy đủ
- [ ] Bật nền tối trong app rồi vào trang: header và nút vẫn đúng tông sáng
- [ ] Cuộn xuôi rồi ngược qua trận cầu: cú đánh chạy xuôi / ngược mượt, không nhảy
- [ ] 375px không cuộn ngang, không phần tử nào đổi kích thước khi đổi trạng thái
- [ ] `npx tsc --noEmit`, `npx eslint` trên file đã sửa và `npm run build` đều sạch


## 12. Bản thử /gioi-thieu-v2 (token design-system)

Bản thử để chủ dự án so sánh, KHÔNG thay /gioi-thieu. Viết theo khuôn của skill
`design-system` (Guideline Authoring Workflow, Required Output Structure, Quality
Gates). Quy ước: bắt buộc dùng "must", khuyến nghị dùng "should", mỗi quy tắc
trợ năng kèm cách kiểm. Mục này không sửa các mục 1-11.

### 12.1 Context and goals

Ý định thiết kế: cùng một trang giới thiệu, cùng từng chữ, nhưng khoác token của
skill (nền đen, xanh lá, xanh dương, góc vuông 2px, nút viên thuốc) và chất thể
thao cầu lông: sân là họa tiết nền, bảng tỉ số, nhãn cắt vát kiểu truyền hình.

- Route `src/app/gioi-thieu-v2/` nằm NGOÀI nhóm `(marketing)` (layout đó bọc `.theme-sang bg-white`). Công khai (thêm `/gioi-thieu-v2` vào `PUBLIC_PATHS` của `src/lib/supabase/middleware.ts`), `noindex` thừa kế từ layout gốc.
- Nội dung, thứ tự mục, ảnh, video, logo (dùng `/logo-light.png` vì nền đen) và logic `signedIn` must giữ nguyên 100% so với /gioi-thieu. Chỉ cách trình bày đổi.
- Số lớn must không mang nghĩa bịa. Chỉ có số thứ tự 01-04 của bảng tỉ số (trang trí, `aria-hidden`) và các ô ngày thành lập của trò đố vui (có thật). Must không có điểm số, tên đội, thống kê.
- Header, hero, màu, nút, bảng tỉ số, Luật nhà là component riêng ở `src/components/landing-v2/`. Trận cầu, video, trò đố vui, cuộn mượt tái dùng component của /gioi-thieu qua prop `skin` / màu; mặc định của các prop giữ nguyên trang cũ.

**Cấu trúc trang** (cùng thứ tự /gioi-thieu)

| # | Section | Họ bố cục |
|---|---|---|
| 1 | Hero | sân phối cảnh trắng / xanh lá, lưới vợt mờ, vệt bay xanh dương, quả cầu 3D trắng đế xanh lá, dải vạch chéo ở chân; chữ lệch trái |
| 2 | Không gian thư giãn | lưới 12 cột: chữ 5 / ảnh 7 có bốn góc sân; sân nhìn từ trên xuống rất mờ ở nền |
| 3 | Nơi chia sẻ và kết nối | trận cầu (khối ghim), bóng người sáng trên nền đen, vệt đuôi xanh dương |
| 4 | Phim | nét nối xanh lá + khối video có bốn góc sân |
| 5 | Trong này có gì | bảng tỉ số: bốn hàng, số thứ tự lớn, chữ, ảnh; mục Kèo có dấu đối đầu |
| 6 | Luật nhà | một câu chữ lớn trên sân nhìn từ trên xuống + lưới vợt mờ |
| 7 | Đố vui + nút | khối giữa, ô đáp án như bảng điểm |

### 12.2 Design tokens and foundations

**Màu** (biến CSS `--v2-*`, đặt ở layout của route từ `landing-v2/tokens.ts`; component must dùng biến, không hex rời, trừ SVG / canvas 3D / ghép độ mờ có chú thích).

| Token (skill) | Biến | Dùng cho |
|---|---|---|
| `color.surface.base` | `--v2-bg` | nền trang (đen thuần, CHỈ route này) |
| `color.text.secondary` | `--v2-text` | chữ chính |
| `color.text.tertiary` (đã sửa) | `--v2-muted` | chữ phụ, đoạn văn, chú thích |
| `color.text.inverse` | `--v2-green` | chữ, nét và nhấn xanh lá trên nền đen |
| `color.surface.muted` | `--v2-green-solid` | mặt nút, nhãn cắt vát (chữ đen trên mặt này) |
| `color.surface.strong` | `--v2-blue` | liên kết, vệt bay của cầu |
| (thêm) | `--v2-line` | đường kẻ, viền khối (trắng 16%) |
| `shadow.1` | `--v2-halo` | quầng chỉ cho lớp nổi (hiện chưa lớp nào cần) |

**Chữ**: một họ Plus Jakarta Sans. Cỡ nền 16px; thang 13 / 15 / 16 / 20 / 32 / 42 như skill, thêm cỡ lớn cho tiêu đề (46, 56, 72, 96). Số thứ tự và số ô đáp án dùng `tabular`, đậm 700. Đậm chỉ 400 / 500 / 600 / 700.

**Hình khối**: khối, ảnh, video, ô trò chơi `rounded-[2px]` (`radius.xs`); nút `rounded-full` (`radius.sm` = 999px); nhãn cắt vát bằng `clip-path` (vát 10px bên phải).

**Chuyển động**: chỉ dùng bảng motion token ở mục 11.2 (`landing/motion.ts`), cùng Lenis như /gioi-thieu. Giảm chuyển động tắt hết.

**Bảng độ lệch so với skill** (mỗi dòng must có lý do)

| Mục | Skill ghi | Bản thử dùng | Lý do |
|---|---|---|---|
| Chữ phụ | `#444444` | `#a3a3a3` | #444 trên đen chỉ đạt 2,2:1, trượt AA; `#a3a3a3` đạt 8,3:1 |
| Font | Ghawar | Plus Jakarta Sans | Ghawar là font riêng, dự án không có; một họ chữ của dự án |
| Cỡ nền | 11px | 16px | 11px quá nhỏ trên mobile, vi phạm AA / vùng đọc; thang 13 / 15 / 16 / 20 / 32 / 42 giữ gần skill |
| Chữ trên nút | (không ghi) | đen trên `#00ad4a` | trắng trên `#00ad4a` chỉ đạt 3,0:1, đen đạt 7,1:1 |
| Nền `#000` | (dùng) | chỉ ở route này | skill dùng đen thuần; phần còn lại của app vẫn cấm `#000` |
| Bo góc | 2px / 999px | giữ đúng | là ngoại lệ có chủ đích so với thang `rounded-lg / xl / full` ở mục 4, chỉ trong route này |
| Vòng focus | (không ghi) | trắng, offset 3px | trắng trên đen > 15:1; vàng gold-500 của app sai tông xanh lá |
| Khoảng cách | `space.1-8` = 3 đến 32px | thang `gap` của Tailwind (4, 8, 12, 16, 20, 32...) | skill ghi số lẻ (13, 17, 18px) không có trong hệ lưới của dự án |
| Số liệu thể thao | (không ghi) | không bịa | nội dung và chú thích của team không có số liệu; số chỉ trang trí hoặc có thật |

### 12.3 Component-level rules

Ký hiệu: M mặc định, H hover, F focus-visible, A active, D disabled, L loading, E error. Vòng focus là `outline` 2px trắng, offset 3px (khối "Bản thử" ở `globals.css`, chỉ trong `[data-v2]`). Bàn phím: Tab theo thứ tự DOM, Enter / Space kích hoạt. Chuột: hover chỉ trên `pointer: fine`. Cảm ứng: vùng bấm tối thiểu 44px (nút), 24px (chấm).

**Nút viên thuốc (`NutV2`)**: "Đăng nhập" / "Vào bảng tin"; hero, header và cuối trang must dùng cùng nhãn cho cùng việc.
- M `--v2-green-solid` + chữ đen 15px đậm 700, cao 44px (header 40px), `px-8`. H nền `--v2-green`, 200ms. F vòng trắng. A `scale-[0.98]`. D mờ 50% (không dùng, vì là liên kết). L, E: không áp dụng (điều hướng, không gửi dữ liệu).
- Responsive: nhãn must một dòng (`whitespace-nowrap`) ở mọi cỡ.

**Header (`HeaderV2`)**: logo-light, menu chính, nút, (đã đăng nhập) tin nhắn, thông báo, avatar.
- Luôn tối: mang lớp `dark`, nền `black` đặc, viền `--v2-line`, không blur, không `ThemeToggle`, không phụ thuộc giao diện của app. Cố định ở đỉnh, không ẩn khi cuộn.
- Mục menu: M `text-white/75`; H `text-white` 200ms; mục đang chọn chữ đậm + vạch chân `--v2-green`; F vòng trắng; A, D, L, E: không áp dụng (liên kết). Dưới 1024px menu chính ẩn (đã có trong menu avatar); nút luôn hiện.

**Nhãn cắt vát (`Tag`)**: nhãn nhỏ phía trên tiêu đề ("Light Human", "Trong này có gì", "Luật nhà"): nền `--v2-green-solid`, chữ đen 13px đậm. Không tương tác nên H, F, A, D, L, E: không áp dụng. Chữ dài: must không tràn (`inline-block`).

**Ảnh / video + bốn góc sân (`Corners`)**: khung `rounded-[2px]` viền `--v2-line`, bốn góc nét `--v2-green` 2px chỉ trang trí (`aria-hidden`). Ảnh có nghĩa độc lập must có `alt`; ảnh trong bảng tỉ số `alt=""` vì tên mục đã nói đủ. Video có nút Tạm dừng / Phát như /gioi-thieu (xem 11.3): giảm chuyển động không tự phát. Trạng thái nút: M, H, F, A đủ; D, L, E: không áp dụng.

**Hero (`HeroV2`)**: tối đa 4 phần tử chữ (nhãn, tiêu đề, dòng phụ ba mảnh "Cầu lông & bơi" / "Sáng thứ 7" / "Nội bộ công ty" mỗi mảnh một vạch xanh lá bên trái, nút); `min-h-[100dvh]`; LCP là chữ. Quả cầu 3D (`hero-scene`, `accent` xanh lá) nạp bằng `next/dynamic` sau lúc rảnh; quả cầu SVG tĩnh luôn dựng sẵn làm phương án thay thế (chưa nạp xong, không có WebGL, WebGL lỗi, giảm chuyển động). Must không có dải chữ trang trí hay chữ "Scroll"; dải vạch chéo ở chân chỉ là họa tiết.

**Trận cầu (`JourneyLine` + `JOURNEY_DARK`)**: cùng cơ chế mục 11.3. Bản đen: bóng người đảo sang sáng bằng `invert` + `mix-blend-lighten`; cầu trắng đế xanh lá; vệt đuôi và đường bay xanh dương; ảnh bo 2px. Trạng thái: không tương tác nên H, F, A, D, L, E không áp dụng. Giảm chuyển động: không ghim, hiện đủ bốn ảnh, hai bóng người, bốn đường bay mờ.

**Bảng tỉ số (`Scoreboard`)**: danh sách `ul`, mỗi hàng: số thứ tự (`aria-hidden`), tên mục, mô tả, liên kết "Vào xem", ảnh. Dưới 768px `grid-cols-1`; từ `md` ba cột (96px / chữ / 340px).
- Liên kết "Vào xem": M `--v2-blue` đậm; H gạch chân + mũi tên trượt 4px; F vòng trắng; A `scale-[0.98]`; D, L, E: không áp dụng.
- Nội dung dài: mô tả xuống dòng, tối đa 52 ký tự/dòng; tên "Bảng tin & nhắn riêng" must không tràn ở 375px. Trạng thái rỗng: không áp dụng (nội dung cố định bốn mục).
- Mục Kèo có dấu đối đầu (hai mũi tên chạm nhau, `aria-hidden`), không mang chữ.

**Trò đố vui (`DoVui`, bản đen)**: tham số `ink` trắng, `gold` xanh lá, `cork` xanh lá, `corkInk` đen, `radius` 2px. Trạng thái và bàn phím như mục 11.3 (E: viền ô `rose` + chữ "Cầu ra ngoài rồi", không chỉ màu).

**Thanh tiến trình**: `ScrollProgress barClass` xanh lá; trang trí, `aria-hidden`, ẩn khi giảm chuyển động.

### 12.4 Accessibility requirements and testable acceptance criteria

| Yêu cầu | Cách kiểm |
|---|---|
| Chữ đạt 4.5:1 trên nền đen | Đo từng cấp: chữ chính 21:1, `--v2-muted` 8,3:1, `--v2-green` 7,5:1, `--v2-blue` 7,3:1, chữ đen trên mặt nút 7,1:1 |
| Mặt nút và nhãn không dùng chữ trắng | Kiểm tay: chữ trên `--v2-green-solid` luôn đen |
| Vòng focus thấy trên nền đen và trên ảnh / video | Tab qua toàn trang: vòng trắng 2px luôn thấy, đạt 3:1 với nền kề |
| Điều khiển dùng được bằng bàn phím | Chỉ Tab / Enter / Space / mũi tên: header, nút, liên kết "Vào xem", nút video, trò đố vui |
| Vùng bấm đủ lớn | DevTools: nút 44px (header 40px, should nâng lên 44px nếu có chỗ) |
| Giảm chuyển động tắt hết | Bật `prefers-reduced-motion`: không ghim, không parallax, không Lenis, hero tĩnh, video không tự phát, không lỗi hydration trong console |
| Không mất nội dung khi tắt WebGL | Tắt WebGL: hero vẫn có chữ, nút, quả cầu SVG |
| Không cuộn ngang ở 375px | `scrollWidth <= innerWidth` |
| Header luôn tối | Bật giao diện sáng trong app rồi mở trang: header và nút vẫn đen / xanh lá |
| Chữ số trang trí không đọc thành dữ liệu | Máy đọc màn hình bỏ qua số thứ tự 01-04 (`aria-hidden`) |
| Hiệu năng | LCP là chữ, three.js không nằm trong gói đầu, ảnh dưới hero không `priority` |

### 12.5 Content and tone standards

- Nội dung của team must giữ từng ký tự, kể cả emoji 🌿 ở tiêu đề section 2 và "Luật nhà". Đổi trình bày được, đổi chữ must hỏi chủ dự án.
- Giọng: câu ngắn, thân mật giữa đồng nghiệp, như /gioi-thieu. Đúng: "Thua thì bao, đừng quỵt." Sai: "Khám phá trải nghiệm tuyệt vời".
- Nhãn nút là hành động hoặc đích đến, một ý định một nhãn. Should không thêm nhãn nhỏ mới ngoài ba nhãn có sẵn trong nội dung.
- Must không số liệu, tên đội, điểm số bịa. Số lớn chỉ là thứ tự trang trí hoặc dữ liệu thật của trò đố vui.

### 12.6 Anti-patterns and prohibited implementations

- Dùng `#444444` làm chữ phụ (2,2:1); dùng chữ trắng trên `#00ad4a` (3,0:1).
- Cỡ chữ nền 11px; font Ghawar hoặc bất kỳ họ chữ thứ hai.
- `#000` ngoài route này; sửa palette toàn cục trong `globals.css` (chỉ được nối khối "Bản thử" có chú thích).
- Con trỏ tuỳ biến, màn mở đầu, scroll listener tự viết, `setState` theo cuộn, vòng lặp vô hạn trang trí, marquee (bản này không dùng marquee nào).
- Số liệu, điểm số, tên đội bịa; số lớn mang nghĩa mà không có trong nội dung.
- Số thời gian, easing, spring rời trong component thay vì `motion.ts`.
- Bóng đổ ngoài `--v2-halo`; neon, gradient trang trí (chỉ có họa tiết vạch chéo và lưới vợt rất mờ).
- Sửa hành vi component dùng chung ở /gioi-thieu: mọi tuỳ biến của v2 must đi qua prop có mặc định giữ nguyên trang cũ.

### 12.7 QA checklist

- [ ] Từng chuỗi chữ khớp /gioi-thieu, thứ tự mục khớp, logic `signedIn` khớp
- [ ] `/gioi-thieu-v2` mở được khi chưa đăng nhập; `/gioi-thieu` không đổi
- [ ] Mọi cặp chữ / nền đạt 4.5:1 theo bảng 12.4; không chữ trắng trên mặt xanh lá
- [ ] Vòng focus trắng thấy rõ ở header, nút, liên kết, video, trò đố vui
- [ ] Không số thời gian rời: mọi duration, easing, spring lấy từ `landing/motion.ts` hoặc biến `--m-*`
- [ ] Hero vừa một màn hình ở 375 và 1440; LCP là chữ; tắt WebGL vẫn đủ
- [ ] Giảm chuyển động: tĩnh hoàn toàn; 375px không cuộn ngang
- [ ] `npx tsc --noEmit`, `npx eslint` file đã sửa, `npm run build` sạch

**Cách chọn bản này làm trang chủ** (nếu chủ dự án chọn): (1) chuyển nội dung `src/app/gioi-thieu-v2/page.tsx` và `layout.tsx` sang `src/app/(marketing)/gioi-thieu/` hoặc đổi `redirect("/gioi-thieu")` ở `src/app/(marketing)/page.tsx` và `href` ở `nav.tsx` / `user-menu.tsx` sang `/gioi-thieu-v2`; (2) vì `(marketing)/layout.tsx` bọc nền trắng, nên giữ layout riêng của v2 (không chuyển vào nhóm `(marketing)`), tức dùng phương án đổi các đường dẫn sang `/gioi-thieu-v2` là ít rủi ro nhất; (3) khi đó xoá `/gioi-thieu` cũ và bản `landing/` không còn dùng.
