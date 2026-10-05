/**
 * Hai con số mà `JourneyLine` và `LineToVideo` BẮT BUỘC phải khớp nhau.
 *
 * Đường dây chính kết thúc ở đáy khối kể chuyện; đoạn nối xuống video bắt
 * đầu ngay dưới đó. Hai khối là hai component khác nhau, hai thẻ `<svg>`
 * khác nhau, nên không có gì tự ép chúng gặp nhau — chỉ cần lệch vài pixel
 * là mắt thấy ngay thành hai nét rời. Để chung ở đây thì sửa một chỗ là cả
 * hai đi theo.
 *
 * VÌ SAO PHẢI CHIA MÀN RỘNG / MÀN HẸP.
 *
 * Trên màn rộng đường dây lượn zíc-zắc hai bên (x = 72 / 28 / 72 / 28), nên
 * kết ở giữa là chỗ tự nhiên — nó đang ở 28% và đi về 50%.
 *
 * Trên điện thoại thì khác hẳn: cả đường chạy sát mép trái (x = 9 / 13 /
 * 9 / 13) để chừa chỗ cho thẻ ảnh bên phải. Nhưng điểm cuối trước đây vẫn
 * ghim cứng ở 50% — nên từ chặng cuối nó phải quét một đường chéo dài sang
 * giữa trang, cắt ngang khoảng trắng dưới thẻ cuối. Đó chính là chỗ nhìn
 * "không ổn".
 *
 * Giờ màn hẹp kết ở 11%, tức đi thẳng xuống theo đúng hướng nó đang chạy.
 */
export const DUOI_X_RONG = 50;
export const DUOI_X_HEP = 11;

/**
 * Đường chính đi ngang bao nhiêu cho mỗi một pixel đi xuống, ngay tại điểm
 * nó kết thúc. Dùng để đặt điểm điều khiển đầu của đoạn nối, cho nó rời đi
 * đúng hướng mà đường chính đang tới — không có số này thì chỗ gặp nhau
 * thành một góc gãy.
 *
 * Màn rộng: đo trên trang thật, đuôi tới nơi ở 33,1 độ so với phương ngang.
 *
 * Màn hẹp: gần như thẳng đứng. Khối kể chuyện trên điện thoại cao vài nghìn
 * pixel trong khi đoạn cuối chỉ nhích ngang chừng 7px, nên độ dốc coi như
 * bằng không. Để nguyên 1,53 như màn rộng thì điểm điều khiển bị kéo sang
 * phải cả trăm pixel, và đoạn nối phình thành một cái bụng cong vô cớ.
 */
export const DOC_NGANG_KHI_TOI_RONG = 1.53;
export const DOC_NGANG_KHI_TOI_HEP = 0.04;

/** Cùng một ngưỡng với `md:` của Tailwind, và với `ANCHORS_NARROW`. */
export const MAN_HEP = "(max-width: 767px)";
