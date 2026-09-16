/**
 * Nội dung Cẩm nang.
 *
 * Cố ý để ở file tĩnh thay vì database: đây là kiến thức nền, vài tháng
 * mới sửa một lần, nên không đáng dựng cả trang quản trị để biên tập.
 * Muốn thêm bài thì viết thêm một phần tử vào mảng bên dưới.
 */

import type { CoverMotif } from "@/components/handbook/cover-art";

export type Block =
  | { type: "para"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: { title: string; body: string; meta?: string }[] }
  | { type: "note"; tone: "tip" | "warn"; text: string }
  | { type: "facts"; items: { label: string; value: string }[] }
  | {
      type: "court";
      highlight: "singles" | "doubles" | "service-singles" | "service-doubles";
      caption: string;
    }
  | { type: "formation"; mode: "attack" | "defend"; caption: string }
  | { type: "photo"; src: string; alt: string; caption?: string };

export type Article = {
  slug: string;
  title: string;
  /** Câu dẫn ngắn hiện ở trang danh sách. */
  summary: string;
  category: "Chuẩn bị" | "Luật" | "Kỹ thuật" | "Trang bị" | "Sức khoẻ";
  /** Số phút đọc, ước lượng. */
  minutes: number;
  /** Ảnh chụp làm bìa. Ưu tiên cao nhất. */
  cover?: string;
  /** Bìa vẽ, dùng khi không có ảnh chụp phù hợp. Xem `CoverArt`. */
  art?: CoverMotif;
  accent: "navy" | "gold" | "sky" | "rose" | "emerald";
  blocks: Block[];
};

export const ARTICLES: Article[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "khoi-dong",
    title: "Khởi động 10 phút trước khi vào sân",
    summary:
      "Bỏ khởi động là cách nhanh nhất để nghỉ đánh vài tuần. Đây là bài 10 phút đủ dùng cho buổi sáng thứ 7.",
    category: "Chuẩn bị",
    minutes: 4,
    cover: "/images/feed-2.jpg",
    accent: "emerald",
    blocks: [
      {
        type: "para",
        text: "Cầu lông là môn đổi hướng liên tục: lao lên lưới, lùi sau, bật nhảy, tiếp đất một chân. Cơ nguội mà vào đánh ngay thì cổ chân và gân gót lãnh đủ. Mười phút khởi động không làm bạn đánh hay hơn, nhưng giữ cho bạn còn đi đánh được vào tuần sau.",
      },
      {
        type: "note",
        tone: "warn",
        text: "Đừng giãn cơ tĩnh (ngồi gập người giữ 30 giây) khi cơ còn nguội. Giãn tĩnh để dành cho lúc đánh xong. Trước khi đánh chỉ làm động tác động.",
      },
      { type: "heading", text: "Trình tự 3 bước" },
      {
        type: "steps",
        items: [
          {
            title: "Làm nóng chung",
            meta: "3 phút",
            body: "Chạy bước nhỏ quanh sân, nâng cao đùi, gót chạm mông, chạy ngang mặt sân. Mục tiêu đơn giản: thấy ấm người và thở hơi nhanh lên.",
          },
          {
            title: "Xoay khớp và động tác động",
            meta: "4 phút",
            body: "Xoay cổ tay, khuỷu, vai, hông, gối, cổ chân — mỗi khớp 10 vòng mỗi chiều. Sau đó đá chân trước sau, đá chân ngang, lunge bước tới, xoay thân. Cổ tay và vai phải kỹ vì cú đập dồn hết lực vào đó.",
          },
          {
            title: "Làm quen với cầu",
            meta: "3 phút",
            body: "Đứng gần lưới đẩy cầu qua lại nhẹ nhàng, rồi lùi dần ra cuối sân đánh cầu cao. Vài cú đập nhẹ 50% sức trước khi vào trận. Đừng vào sân là đập hết lực ngay.",
          },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Ngủ nướng, vào sân trễ? Cắt bước 1 xuống còn 1 phút, nhưng đừng bao giờ bỏ bước 2.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "gian-co",
    title: "Giãn cơ sau khi đánh",
    summary:
      "Năm phút cuối buổi quyết định hôm sau bạn đi lại bình thường hay lết từng bước.",
    category: "Sức khoẻ",
    minutes: 3,
    art: "pulse",
    cover: "/images/cam-nang/gian-co.webp",
    accent: "sky",
    blocks: [
      {
        type: "para",
        text: "Đánh xong ai cũng muốn cất vợt đi ăn ngay. Nhưng năm phút giãn cơ là thứ rẻ nhất bạn có thể làm để hôm sau không bị đau bắp chân với vai.",
      },
      { type: "heading", text: "Giữ mỗi động tác 20–30 giây, không nảy" },
      {
        type: "steps",
        items: [
          {
            title: "Bắp chân và gân gót",
            body: "Chống tay vào tường, một chân duỗi thẳng ra sau, gót ấn sát đất. Đổi bên. Đây là nhóm cơ làm việc nhiều nhất trong cầu lông.",
          },
          {
            title: "Đùi trước",
            body: "Đứng một chân, tay kéo cổ chân còn lại về phía mông, gối hướng xuống đất. Vịn tường nếu mất thăng bằng.",
          },
          {
            title: "Đùi sau",
            body: "Ngồi duỗi một chân, chân kia gập vào trong, từ từ vươn tay về phía mũi chân duỗi. Lưng giữ thẳng, đừng gù để với cho tới.",
          },
          {
            title: "Vai và cánh tay sau",
            body: "Kéo ngang một tay qua trước ngực, tay kia giữ khuỷu. Sau đó đưa tay lên gập ra sau gáy, tay kia ấn nhẹ khuỷu xuống.",
          },
          {
            title: "Lưng dưới và hông",
            body: "Nằm ngửa, kéo hai gối về ngực. Rồi thả hai gối ngã sang một bên trong khi vai giữ nguyên trên sàn.",
          },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Chỗ nào đau nhói thì dừng. Giãn cơ phải thấy căng dễ chịu, không phải đau.",
      },
      {
        type: "para",
        text: "Uống nước ngay sau buổi đánh, và ăn gì đó có đạm trong vòng một tiếng. Bữa ăn khuya sau trận vừa vui vừa đúng khoa học.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "luat-co-ban",
    title: "Luật cầu lông cơ bản, đủ để không cãi nhau",
    summary:
      "Tính điểm, giao cầu bên nào, khi nào là lỗi. Đủ để chốt kèo mà không phải tra Google giữa trận.",
    category: "Luật",
    minutes: 6,
    art: "net",
    cover: "/images/cam-nang/luat-co-ban.webp",
    accent: "navy",
    blocks: [
      {
        type: "para",
        text: "Phần lớn tranh cãi trên sân đến từ ba chỗ: ai giao cầu, đứng ô nào, và cầu đó trong hay ngoài. Nắm ba chỗ này là hết cãi.",
      },
      { type: "heading", text: "Tính điểm" },
      {
        type: "facts",
        items: [
          { label: "Mỗi ván", value: "21 điểm" },
          { label: "Một trận", value: "Thắng 2 trong 3 ván" },
          { label: "Hoà 20–20", value: "Phải hơn 2 điểm" },
          { label: "Kịch trần", value: "29–29 thì ai tới 30 trước thắng" },
        ],
      },
      {
        type: "para",
        text: "Mỗi pha cầu đều có điểm, bất kể ai giao — luật này gọi là tính điểm trực tiếp, áp dụng từ 2006. Bên nào thắng pha cầu thì được điểm và giành quyền giao cầu pha kế tiếp.",
      },
      { type: "heading", text: "Giao cầu ở ô nào" },
      {
        type: "para",
        text: "Quy tắc chỉ có một câu: nhìn điểm của người giao cầu. Điểm chẵn (0, 2, 4…) thì giao từ ô bên phải. Điểm lẻ thì giao từ ô bên trái. Cầu luôn bay chéo sang ô đối diện.",
      },
      {
        type: "court",
        highlight: "service-doubles",
        caption:
          "Đánh đôi: ô giao cầu rộng nhưng ngắn — vạch cuối là vạch nét đứt, không phải biên cuối sân.",
      },
      {
        type: "court",
        highlight: "service-singles",
        caption:
          "Đánh đơn: ô giao cầu hẹp nhưng dài — chạm tới tận biên cuối sân.",
      },
      {
        type: "note",
        tone: "tip",
        text: "Mẹo nhớ: sân đôi thì ô giao cầu BÉO và LÙN, sân đơn thì GẦY và CAO.",
      },
      { type: "heading", text: "Giao cầu thế nào là hợp lệ" },
      {
        type: "list",
        items: [
          "Toàn bộ quả cầu phải ở dưới 1,15 m tính từ mặt sân tại thời điểm vợt chạm cầu.",
          "Đầu vợt phải chúc xuống, hướng xuống dưới rõ ràng.",
          "Hai chân chạm sàn, không nhấc, không lê chân.",
          "Đánh vào phần đế cầu trước, không phải vào lông.",
          "Chỉ được một lần giao — hỏng là mất điểm luôn, không có lượt thứ hai.",
        ],
      },
      { type: "heading", text: "Những lỗi hay gặp" },
      {
        type: "list",
        items: [
          "Cầu rơi ngoài biên. Cầu chạm vạch là TRONG.",
          "Chạm lưới bằng người, quần áo hay vợt khi cầu còn trong cuộc.",
          "Đánh cầu hai lần liên tiếp, hoặc cả hai người cùng đội cùng chạm.",
          "Với vợt qua lưới để đánh cầu khi cầu chưa sang sân mình.",
          "Cầu chạm trần hoặc chạm người. Chạm người là mất điểm ngay.",
        ],
      },
      {
        type: "note",
        tone: "warn",
        text: "Sân trong nhà ở Việt Nam trần thường thấp. Nhiều nơi có luật riêng: chạm trần thì đánh lại. Thống nhất trước khi vào trận cho đỡ cãi.",
      },
      { type: "heading", text: "Kích thước sân" },
      {
        type: "facts",
        items: [
          { label: "Chiều dài", value: "13,40 m" },
          { label: "Rộng (đôi)", value: "6,10 m" },
          { label: "Rộng (đơn)", value: "5,18 m" },
          { label: "Lưới giữa", value: "1,524 m" },
        ],
      },
      {
        type: "court",
        highlight: "singles",
        caption: "Vùng tô sáng là sân đánh đơn — hẹp hơn mỗi bên 46 cm.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "cam-vot-va-cu-danh",
    title: "Cầm vợt đúng và 5 cú đánh nền tảng",
    summary:
      "Đa số người mới cầm vợt như cầm chảo. Sửa được cái này là lên trình ngay lập tức.",
    category: "Kỹ thuật",
    minutes: 5,
    cover: "/images/cam-nang/cam-vot-va-cu-danh.webp",
    accent: "gold",
    blocks: [
      {
        type: "para",
        text: "Nếu chỉ sửa được một thứ cho người mới, hãy sửa cách cầm vợt. Cầm sai thì cổ tay không bẻ được, mất hết lực và dễ đau khuỷu.",
      },
      { type: "heading", text: "Hai kiểu cầm phải biết" },
      {
        type: "steps",
        items: [
          {
            title: "Cầm thuận tay",
            body: "Dựng vợt thẳng đứng rồi bắt tay với cán vợt. Kẽ giữa ngón cái và ngón trỏ tạo thành chữ V nằm trên cạnh hẹp của cán. Nắm lỏng như cầm con chim — chỉ siết chặt đúng khoảnh khắc chạm cầu.",
          },
          {
            title: "Cầm trái tay",
            body: "Từ kiểu thuận tay, xoay vợt một chút và đặt ngón cái tì phẳng lên mặt rộng của cán. Ngón cái chính là chỗ đẩy lực cho cú trái tay.",
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        text: "Kiểu cầm như cầm chảo — mặt vợt song song mặt sàn — chỉ dùng để vê cầu sát lưới. Dùng nó để đánh cầu cao là hỏng cổ tay và mất lực.",
      },
      { type: "heading", text: "Năm cú đánh nền tảng" },
      {
        type: "steps",
        items: [
          {
            title: "Cầu cao sâu",
            body: "Đánh cầu bay cao và rơi sát biên cuối sân đối phương. Đây là cú cứu nguy: bị ép quá thì đánh cao sâu để lấy lại thời gian về vị trí.",
          },
          {
            title: "Bỏ nhỏ",
            body: "Cùng tư thế như đánh cầu cao nhưng giảm lực lúc chạm, cầu rơi ngay sau lưới. Ăn nhau ở chỗ giấu ý đồ — động tác phải giống hệt cú cao sâu.",
          },
          {
            title: "Đập cầu",
            body: "Cú ghi điểm. Đánh cầu ở điểm cao nhất, mặt vợt chúc xuống, dùng cả xoay thân chứ không chỉ tay. Đập từ cuối sân tốn sức mà ít hiệu quả — đập khi đã ở giữa sân trở lên.",
          },
          {
            title: "Cầu ngang",
            body: "Cầu đi nhanh, phẳng, ngang tầm vai, sát trên lưới. Vũ khí chính của đánh đôi vì nó không cho đối phương kịp chuẩn bị.",
          },
          {
            title: "Vê cầu và đẩy cầu",
            body: "Vê là thả cầu sát lưới rơi sát mép. Đẩy là hất cầu lên cao ra sau. Hai cú này quyết định ai chiếm được thế trên lưới.",
          },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Sau mỗi cú đánh phải quay về giữa sân, hơi khuỵu gối, vợt cầm trước mặt. Đứng thẳng đơ sau khi đánh là mất nửa số cầu đáng lẽ đỡ được.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "danh-doi",
    title: "Đánh đôi: đứng đâu và ai đỡ cầu nào",
    summary:
      "Team mình đánh đôi là chính. Nắm được nguyên tắc xoay vị trí là đỡ giẫm chân nhau hẳn.",
    category: "Kỹ thuật",
    minutes: 5,
    cover: "/images/cam-nang/danh-doi.webp",
    accent: "navy",
    blocks: [
      {
        type: "para",
        text: "Lỗi phổ biến nhất khi đánh đôi ở mức phong trào: hai người cùng đứng ngang nhau suốt trận, rồi cùng lao vào một quả, hoặc cùng đứng nhìn nhau.",
      },
      {
        type: "para",
        text: "Chỉ cần nhớ một câu: công thì đứng dọc, thủ thì đứng ngang.",
      },
      {
        type: "formation",
        mode: "attack",
        caption:
          "Khi đội bạn đang tấn công: một người trên lưới (1), một người cuối sân (2). Người sau đập, người trước chặn.",
      },
      {
        type: "formation",
        mode: "defend",
        caption:
          "Khi đội bạn đang đỡ: dàn ngang, mỗi người giữ một nửa sân. Cầu đập vào đâu cũng có người.",
      },
      { type: "heading", text: "Vì sao lại thế" },
      {
        type: "list",
        items: [
          "Đứng dọc để tấn công: đối phương đỡ lên thì người trên lưới chặn ngay, không cho họ kịp thở.",
          "Đứng ngang để phòng thủ: cầu đập xuống có thể vào bất cứ đâu, chia đôi sân là cách phủ kín nhanh nhất.",
          "Chuyển đổi liên tục: đội bạn đánh cầu đi lên thì chuyển sang dàn ngang, đánh cầu đi xuống thì chuyển sang dọc.",
        ],
      },
      { type: "heading", text: "Cầu ở giữa thì ai đỡ" },
      {
        type: "list",
        items: [
          "Quy ước chung: người thuận tay hơn đỡ quả giữa, vì đánh thuận tay mạnh hơn trái tay.",
          "Cầu cao ở giữa: người đứng sau đỡ, người trước cúi xuống tránh.",
          "Cứ hô một tiếng. Một chữ \"tôi!\" giải quyết được 90% pha giẫm chân nhau.",
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Người đứng trên lưới đừng ngoái lại nhìn đồng đội đập. Giữ mặt hướng về lưới, vợt giơ sẵn — cầu chặn được hay không là ở đó.",
      },
      { type: "heading", text: "Giao cầu trong đánh đôi" },
      {
        type: "para",
        text: "Giao cầu thấp sát lưới là lựa chọn mặc định, rơi ngay sau vạch giao cầu ngắn. Giao cao chỉ dùng để đổi nhịp khi đối phương dâng quá cao. Sau khi giao, người giao lùi lại một bước và giơ vợt lên — đối phương đẩy nhanh là chuyện thường.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "chon-vot-chon-cau",
    title: "Chọn vợt và cầu cho người mới",
    summary:
      "Không cần vợt mấy triệu. Nhưng chọn sai thông số thì đánh mỏi tay mà không ăn thua.",
    category: "Trang bị",
    minutes: 5,
    art: "strings",
    cover: "/images/cam-nang/chon-vot-chon-cau.webp",
    accent: "gold",
    blocks: [
      {
        type: "para",
        text: "Người mới hay hỏi nên mua vợt nào. Câu trả lời thật là: ở giai đoạn đầu, vợt nào cũng được miễn đúng ba thông số dưới đây. Tiền nên để dành mua giày.",
      },
      { type: "heading", text: "Ba thông số cần nhìn" },
      {
        type: "steps",
        items: [
          {
            title: "Trọng lượng",
            meta: "chọn 4U hoặc 5U",
            body: "Ghi trên thân vợt. 3U nặng khoảng 85–89 g, 4U khoảng 80–84 g, 5U nhẹ hơn nữa. Số càng lớn vợt càng nhẹ. Người mới cầm 4U là vừa tay, vung nhanh và đỡ mỏi.",
          },
          {
            title: "Điểm cân bằng",
            meta: "chọn cân bằng đều",
            body: "Nặng đầu thì đập mạnh nhưng chậm và mỏi. Nhẹ đầu thì nhanh nhưng thiếu lực. Người mới chọn cân bằng đều là an toàn nhất, đánh đôi cũng hợp.",
          },
          {
            title: "Độ căng dây",
            meta: "20–23 lbs",
            body: "Căng cao nghe đã tai và kiểm soát tốt, nhưng đòi kỹ thuật chuẩn mới ra lực. Người mới căng 20–23 lbs sẽ thấy dễ đánh hơn hẳn. Khí hậu nóng ẩm làm dây xuống nhanh, vài tháng nên căng lại.",
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        text: "Vợt nhôm nguyên khối giá rẻ ngoài chợ nặng và rất cứng, đánh lâu dễ đau khuỷu tay. Chịu khó mua vợt carbon tầm trung, bền hơn nhiều lần.",
      },
      { type: "heading", text: "Chọn cầu" },
      {
        type: "para",
        text: "Cầu lông vũ có đánh số tốc độ, thường từ 75 đến 79. Số càng lớn cầu bay càng xa. Trời nóng làm không khí loãng, cầu bay xa hơn, nên xứ nóng phải dùng cầu số nhỏ hơn.",
      },
      {
        type: "facts",
        items: [
          { label: "Miền Nam, trời nóng", value: "Số 76 – 77" },
          { label: "Miền Bắc, mùa lạnh", value: "Số 77 – 78" },
          { label: "Sân có điều hoà", value: "Số 77" },
          { label: "Tập cơ bản", value: "Cầu nhựa cho rẻ" },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Cầu bay quá dài thì đổi xuống số nhỏ hơn, bay không tới thì lên số lớn hơn. Cứ thử một ống là biết sân mình hợp số nào.",
      },
      { type: "heading", text: "Thứ đáng đầu tư nhất" },
      {
        type: "para",
        text: "Là giày cầu lông, không phải vợt. Giày cầu lông có đế bám sàn gỗ, phần gót ôm chắc và mũi gia cố cho động tác lao lên lưới. Đi giày chạy bộ vào sân cầu là con đường ngắn nhất tới lật cổ chân, vì đế giày chạy cao và mềm, rất dễ lật khi đổi hướng ngang.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "chan-thuong",
    title: "Chấn thương hay gặp và cách tránh",
    summary:
      "Cổ chân, gân gót, vai, khuỷu. Biết trước để không phải nghỉ đánh cả tháng.",
    category: "Sức khoẻ",
    minutes: 5,
    cover: "/images/cam-nang/chan-thuong.webp",
    accent: "rose",
    blocks: [
      {
        type: "para",
        text: "Cầu lông nhìn nhẹ nhàng nhưng là môn có tỉ lệ chấn thương cổ chân cao. Phần lớn đến từ ba nguyên nhân rất đời thường: không khởi động, đi sai giày, và cố đánh khi đã mệt.",
      },
      { type: "heading", text: "Bốn chỗ hay hỏng nhất" },
      {
        type: "steps",
        items: [
          {
            title: "Lật cổ chân",
            body: "Thường xảy ra khi tiếp đất sau cú đập, hoặc giẫm phải chân đồng đội. Phòng bằng giày cầu lông đúng loại và tập thăng bằng — đứng một chân đánh răng mỗi ngày là đủ.",
          },
          {
            title: "Đau gân gót",
            body: "Đau âm ỉ phía sau gót, nặng nhất vào buổi sáng. Do bật nhảy và lao tới lặp đi lặp lại. Đừng tăng cường độ đột ngột: nghỉ ba tháng rồi quay lại đánh liền ba buổi một tuần là dễ dính nhất.",
          },
          {
            title: "Đau vai",
            body: "Do động tác đập cầu lặp lại. Cách tránh tốt nhất là tập thêm nhóm cơ xoay vai bằng dây kháng lực, mỗi tuần hai buổi ngắn.",
          },
          {
            title: "Đau khuỷu tay",
            body: "Thường do cầm vợt sai, dây căng quá cao, hoặc vợt quá nặng. Nếu thấy đau mặt ngoài khuỷu, xem lại kiểu cầm trước khi nghĩ tới chuyện đổi vợt.",
          },
        ],
      },
      { type: "heading", text: "Bị rồi thì làm gì" },
      {
        type: "list",
        items: [
          "Dừng đánh ngay. Cố đánh nốt ván là cách biến chấn thương nhẹ thành nặng.",
          "48 giờ đầu: chườm lạnh 15–20 phút mỗi lần, vài lần trong ngày.",
          "Kê cao chỗ bị thương khi nằm, băng ép vừa phải cho đỡ sưng.",
          "Sưng nhiều, đau khi chống chân, hoặc nghe tiếng rắc lúc bị — đi khám, đừng tự đoán.",
        ],
      },
      {
        type: "note",
        tone: "warn",
        text: "Hết đau không có nghĩa là đã lành. Cổ chân sau khi lật cần tập lại thăng bằng trước khi vào sân, nếu không rất dễ lật lại đúng chỗ cũ.",
      },
      {
        type: "para",
        text: "Cuối cùng: mệt thì nghỉ. Phần lớn chấn thương rơi vào ván cuối của buổi, khi chân đã rã mà đầu vẫn muốn đánh thêm. Kèo tuần sau vẫn còn đó.",
      },
    ],
  },
  /* ---------------------------------------------------------------- */
  {
    slug: "di-chuyen",
    title: "Sáu hướng chân: thứ quyết định bạn đánh được tới đâu",
    summary:
      "Đánh không tới cầu thì cú đánh đẹp cỡ nào cũng vô nghĩa. Bước chân mới là phần nâng trình nhanh nhất.",
    category: "Kỹ thuật",
    minutes: 6,
    art: "footwork",
    cover: "/images/cam-nang/di-chuyen.webp",
    accent: "gold",
    blocks: [
      {
        type: "para",
        text: "Người mới thường nghĩ đánh hay là đập mạnh. Thật ra khoảng cách lớn nhất giữa người đánh vài tháng và người đánh vài năm nằm ở chân. Ai tới cầu sớm thì còn thời gian chọn cú đánh; ai tới trễ thì chỉ còn nước với đại.",
      },
      {
        type: "para",
        text: "Cả sân cầu lông quy về sáu điểm quanh một vị trí trung tâm: hai góc lưới, hai bên hông, hai góc cuối sân. Tập được sáu đường này là phủ kín sân.",
      },
      { type: "heading", text: "Vị trí trung tâm" },
      {
        type: "para",
        text: "Sau mỗi cú đánh, quay về giữa sân, hơi lệch về sau vạch giao cầu ngắn chừng một mét. Chân rộng hơn vai, gối hơi khuỵu, trọng tâm dồn lên nửa bàn chân trước, vợt cầm cao ngang ngực. Đứng thẳng lưng gót chạm đất là đã chậm mất nửa nhịp.",
      },
      {
        type: "note",
        tone: "tip",
        text: "Trước khi đối thủ chạm cầu, nhún nhẹ hai chân một cái — gọi là bước nhảy chuẩn bị. Nó không đưa bạn đi đâu cả, nhưng giúp cơ chân sẵn sàng bật theo bất kỳ hướng nào.",
      },
      { type: "heading", text: "Sáu đường chân" },
      {
        type: "steps",
        items: [
          {
            title: "Hai góc lưới",
            meta: "Bước đâm",
            body: "Chân cùng bên tay cầm vợt bước dài lên trước, mũi chân hướng ra góc, gối không vượt quá mũi chân. Vươn vợt ra trước mặt, không phải ngang hông. Đạp chân trước để bật ngược về giữa.",
          },
          {
            title: "Hai bên hông",
            meta: "Bước ngang",
            body: "Đây là hướng dễ sai nhất: đa số vặn cả người rồi mới đi. Thay vào đó bước chéo chân, thân giữ hướng ra lưới, tay đánh vươn ngang. Cầu bên trái thì với ngang bằng trái tay, đừng chạy vòng để đánh thuận tay.",
          },
          {
            title: "Hai góc cuối sân",
            meta: "Bước xoay lùi",
            body: "Xoay hông mở ra sau, lùi bằng bước chéo hoặc bước nối, để cầu rơi vào phía trước vai đánh chứ đừng để nó rơi thẳng trên đầu. Đánh xong lấy đà chân sau đẩy người về giữa.",
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        text: "Đừng bao giờ lùi bằng cách đi giật lùi kiểu bước đều. Gót vướng nhau là ngã ngửa, mà ngã ngửa trong cầu lông rất hay gãy cổ tay vì phản xạ chống tay xuống sàn.",
      },
      { type: "heading", text: "Bài tập không cần cầu" },
      {
        type: "list",
        items: [
          "Chạm sáu góc: đặt sáu vật ở sáu điểm, xuất phát từ giữa, chạm một điểm rồi về giữa, lặp lại. Ba hiệp, mỗi hiệp 30 giây.",
          "Chỉ tay: nhờ người đứng ở lưới chỉ ngẫu nhiên một hướng, bạn di chuyển theo. Rèn phản xạ đọc hướng.",
          "Nhảy dây 3 phút trước buổi đánh. Rẻ nhất, hiệu quả nhất cho độ nảy của cổ chân.",
        ],
      },
      {
        type: "para",
        text: "Tập chân nghe chán hơn tập đập cầu rất nhiều. Nhưng sau một tháng bạn sẽ thấy mình tự nhiên đỡ được những quả trước đây chỉ biết đứng nhìn.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "giao-cau",
    title: "Giao cầu: quả duy nhất bạn toàn quyền quyết định",
    summary:
      "Mỗi ván có hơn hai chục quả giao. Đánh hỏng quả giao là tự cho điểm, không ai ép cả.",
    category: "Kỹ thuật",
    minutes: 5,
    art: "serve",
    cover: "/images/cam-nang/giao-cau.webp",
    accent: "navy",
    blocks: [
      {
        type: "para",
        text: "Trong cả trận, giao cầu là tình huống duy nhất không ai gây sức ép cho bạn: cầu nằm yên trong tay, muốn đứng bao lâu cũng được. Vậy mà đây lại là chỗ cho điểm nhiều nhất của người mới.",
      },
      { type: "heading", text: "Giao cầu thấp — quả dùng 80% thời gian" },
      {
        type: "para",
        text: "Mục tiêu: cầu bay sát mép trên lưới rồi rơi ngay sau vạch giao cầu ngắn của đối phương. Đối thủ phải vươn lên đỡ ở tầm thấp, không thể đập.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Đứng gần vạch giao cầu ngắn",
            body: "Chân trước là chân ngược bên tay cầm vợt, mũi chân hướng vào ô cần giao. Trọng tâm dồn chân sau, khi đánh thì chuyển dần ra trước.",
          },
          {
            title: "Thả cầu, đừng tung",
            body: "Cầm cầu ở phần lông hoặc phần thân, giữ ngang tầm eo, thả rơi tự nhiên. Tung cầu lên là mất kiểm soát ngay.",
          },
          {
            title: "Đẩy bằng cổ tay, không vung tay",
            body: "Toàn bộ cú đánh là một cái đẩy ngắn từ cẳng tay và cổ tay. Vai gần như đứng yên. Vung cả cánh tay thì cầu bay cao quá lưới, đối thủ đập ngay.",
          },
          {
            title: "Giao xong là vào thế thủ",
            body: "Đừng đứng ngắm quả giao của mình. Bước lùi nửa bước về tư thế chuẩn bị, vợt cầm cao — quả trả lưới sẽ tới rất nhanh.",
          },
        ],
      },
      {
        type: "court",
        highlight: "service-doubles",
        caption:
          "Ô cần rơi vào khi đánh đôi. Nhắm điểm cách vạch giao cầu ngắn chừng 20 cm là vừa đẹp.",
      },
      { type: "heading", text: "Giao cầu cao — dành cho đánh đơn" },
      {
        type: "para",
        text: "Đánh mạnh cho cầu bay thật cao và rơi thẳng đứng sát biên cuối sân đối phương. Cầu rơi càng dựng thì đối thủ càng khó đập. Trong đánh đôi hầu như không dùng, vì ô giao cầu ngắn hơn nên đối phương lùi ra đập rất dễ.",
      },
      {
        type: "note",
        tone: "tip",
        text: "Đánh đôi mà đối thủ đứng dí sát vạch chờ vồ quả giao thấp? Thỉnh thoảng lùa một quả nhanh và phẳng qua vai họ. Không cần ăn điểm, chỉ cần họ lùi lại nửa bước là quả giao thấp của bạn lại dễ thở.",
      },
      { type: "heading", text: "Ba lỗi bị bắt nhiều nhất" },
      {
        type: "list",
        items: [
          "Cầu cao quá 1,15 m lúc vợt chạm — tương đương ngang xương sườn dưới của phần lớn người Việt.",
          "Đầu vợt ngóc lên cao hơn tay cầm. Đầu vợt phải chúc xuống thấy rõ.",
          "Nhấc chân hoặc lê chân trong lúc đánh. Hai chân phải có phần chạm sàn cho tới khi vợt chạm cầu.",
        ],
      },
      {
        type: "para",
        text: "Ở sân phong trào ít ai bắt mấy lỗi này, nhưng tập đúng ngay từ đầu thì sau này có đánh giải cũng không phải sửa.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "loi-hay-cai",
    title: "Tám tình huống hay cãi nhau nhất trên sân",
    summary:
      "Cầu chạm vạch, chạm người, vợt qua lưới, cùng đội chạm hai lần. Thống nhất trước cho đỡ mất vui.",
    category: "Luật",
    minutes: 5,
    art: "lines",
    cover: "/images/cam-nang/loi-hay-cai.webp",
    accent: "rose",
    blocks: [
      {
        type: "para",
        text: "Sân phong trào không có trọng tài, nên luật chỉ hữu ích khi cả hai bên cùng biết. Dưới đây là những chỗ hay lời qua tiếng lại nhất, kèm câu trả lời gọn.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Cầu chạm vạch",
            meta: "TRONG",
            body: "Vạch là một phần của sân. Chạm vạch dù chỉ mép ngoài cũng tính trong. Người nhìn rõ nhất là người ở phía cầu rơi, không phải người đánh — thông lệ là bên đỡ gọi.",
          },
          {
            title: "Cầu chạm người hoặc quần áo",
            meta: "MẤT ĐIỂM",
            body: "Chạm bất kỳ phần nào của người là bên đó thua pha cầu ngay, kể cả khi cầu rõ ràng đang bay ra ngoài. Đây là chỗ nhiều người tiếc nhất: thấy cầu ra thì tránh ra, đừng lấy người chắn.",
          },
          {
            title: "Vợt chạm lưới",
            meta: "MẤT ĐIỂM",
            body: "Người, áo hay vợt chạm lưới khi cầu còn trong cuộc đều là lỗi. Nhưng đà vợt đi qua phía trên lưới sau khi đã đánh trúng cầu bên sân mình thì hợp lệ.",
          },
          {
            title: "Với vợt qua lưới đánh cầu",
            meta: "TUỲ LÚC",
            body: "Sang sân đối phương đánh cầu trước khi cầu bay qua là lỗi. Nhưng nếu cầu đã sang sân bạn rồi mới bị xoáy kéo ngược lại, bạn được với qua để đánh, miễn không chạm lưới.",
          },
          {
            title: "Hai người cùng đội cùng chạm",
            meta: "MẤT ĐIỂM",
            body: "Một pha cầu mỗi bên chỉ được chạm một lần. Cả hai cùng vụt một quả là lỗi, dù chỉ một người trúng cầu còn người kia chạm nhẹ.",
          },
          {
            title: "Cầu dính vợt rồi mới bay đi",
            meta: "HỢP LỆ",
            body: "Cú đánh kéo lê trên mặt vợt trông rất xấu nhưng vẫn hợp lệ, miễn là một động tác liên tục. Chỉ khi cầu dừng hẳn rồi hất tiếp mới là lỗi.",
          },
          {
            title: "Cầu mắc trên lưới hoặc chui qua lưới",
            meta: "MẤT ĐIỂM",
            body: "Giao cầu mắc trên mép lưới thì bên giao thua pha đó. Cầu chui dưới lưới hoặc lọt qua lỗ thủng cũng vậy.",
          },
          {
            title: "Cầu chạm trần nhà",
            meta: "THOẢ THUẬN",
            body: "Theo luật thì bên đánh thua pha cầu. Nhưng nhiều sân trong nhà ở Việt Nam trần thấp nên có lệ đánh lại. Cứ hỏi trước khi vào ván đầu.",
          },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Không ai nhìn rõ thì đánh lại. Đây không phải luật, mà là cách giữ cho buổi đánh còn vui. Không pha cầu nào đáng để mất lòng nhau.",
      },
      { type: "heading", text: "Vài chi tiết ít người biết" },
      {
        type: "list",
        items: [
          "Đánh đôi, khi đang giao cầu thì người nhận là người đứng ô chéo; hai người còn lại đứng đâu cũng được, miễn không che tầm nhìn.",
          "Ở ván thứ ba, đổi sân khi một bên chạm 11 điểm.",
          "Đánh đôi thắng pha cầu thì hai người tự đổi ô cho nhau, đối phương giữ nguyên vị trí.",
          "Được nghỉ 60 giây khi một bên tới 11 điểm, và 120 giây giữa các ván.",
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "chon-giay",
    title: "Giày cầu lông: món đáng tiền nhất trong túi đồ",
    summary:
      "Đi giày chạy bộ vào sân cầu là lý do số một của những cái cổ chân lật. Nâng cấp giày trước khi nâng cấp vợt.",
    category: "Trang bị",
    minutes: 4,
    art: "sole",
    cover: "/images/cam-nang/chon-giay.webp",
    accent: "emerald",
    blocks: [
      {
        type: "para",
        text: "Hỏi mười người mới chơi thì chín người tính đổi vợt xịn hơn. Nhưng nếu chỉ được nâng cấp một món, hãy nâng cấp giày. Vợt sai chỉ làm cầu bay không như ý; giày sai làm bạn nghỉ đánh hai tháng.",
      },
      { type: "heading", text: "Vì sao giày chạy bộ lại nguy hiểm" },
      {
        type: "para",
        text: "Giày chạy bộ được thiết kế cho chuyển động một chiều về trước, nên đế rất dày và mềm để giảm sốc. Cầu lông thì gần như không chạy thẳng: toàn dừng gấp, đạp ngang, xoay người. Đế cao và mềm khiến bàn chân bập bênh, và khi bạn đạp ngang mạnh thì cổ chân lật trước khi đế kịp bám.",
      },
      {
        type: "facts",
        items: [
          { label: "Đế giày cầu", value: "Cao su gum" },
          { label: "Độ cao đế", value: "Thấp, sát sàn" },
          { label: "Gia cố", value: "Hai bên hông" },
          { label: "Tuổi thọ", value: "Khoảng 1 năm" },
        ],
      },
      { type: "heading", text: "Bốn thứ cần kiểm tra khi mua" },
      {
        type: "steps",
        items: [
          {
            title: "Đế cao su gum",
            body: "Loại cao su vàng nâu trong mờ, bám rất tốt trên sàn gỗ và thảm PU. Đế đen của giày thể thao thường vừa trơn vừa để lại vệt đen trên sàn, nhiều sân cấm.",
          },
          {
            title: "Đế thấp, ôm sàn",
            body: "Càng sát sàn càng khó lật cổ chân. Đứng thử thấy mình hơi thấp xuống so với giày thường là đúng.",
          },
          {
            title: "Gia cố hai bên hông",
            body: "Bóp thử phần hông giày, phải thấy cứng chứ không mềm oặt. Đây là phần chống đỡ khi bạn đạp ngang.",
          },
          {
            title: "Đệm ở gót và mũi",
            body: "Cầu lông tiếp đất bằng gót rất nhiều, còn bước đâm lên lưới thì dồn hết vào mũi. Hai chỗ này cần đệm dày.",
          },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Thử giày vào buổi tối, đi kèm đôi tất bạn hay dùng khi đánh. Chân cuối ngày nở hơn sáng, mua vừa lúc sáng thì tối đi chật.",
      },
      { type: "heading", text: "Khi nào phải thay" },
      {
        type: "list",
        items: [
          "Nhìn nghiêng thấy rãnh đế đã mòn nhẵn — hết bám, trượt lúc dừng gấp.",
          "Đặt giày lên bàn phẳng thấy nó nghiêng sang một bên.",
          "Bóp hông giày thấy mềm oặt so với lúc mới.",
          "Đánh xong thấy đau gót hoặc đau lòng bàn chân mà trước không bị.",
        ],
      },
      {
        type: "para",
        text: "Đánh mỗi tuần một buổi thì một đôi dùng được khoảng một năm. Đừng đợi tới lúc đế rách mới thay — phần đệm chết trước khi đế rách, mà chính phần đệm mới là thứ bảo vệ đầu gối.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "danh-sang-som",
    title: "Đánh sáng sớm thứ 7: dậy, ăn, uống, khởi động",
    summary:
      "Vừa ngủ dậy là cơ thể ở trạng thái tệ nhất trong ngày để vận động mạnh. Có cách xoay chuyển trong 30 phút.",
    category: "Sức khoẻ",
    minutes: 5,
    art: "sunrise",
    accent: "sky",
    blocks: [
      {
        type: "para",
        text: "Đánh sáng sớm thứ 7 là lựa chọn tốt: sân vắng, trời mát, đánh xong vẫn còn nguyên ngày để làm việc khác. Nhưng nó cũng là khung giờ cơ thể chưa sẵn sàng nhất. Sau một đêm nằm yên, thân nhiệt đang ở đáy, khớp khô dịch, cơ ngắn lại, và bạn vừa trải qua bảy tám tiếng không uống giọt nước nào.",
      },
      {
        type: "note",
        tone: "warn",
        text: "Chấn thương buổi sáng hay rơi vào 15 phút đầu, và thường là gân gót hoặc cơ đùi sau. Lý do đơn giản: người chưa nóng mà đã lao vào đỡ quả cầu bất ngờ.",
      },
      { type: "heading", text: "Đêm hôm trước mới là lúc chuẩn bị" },
      {
        type: "list",
        items: [
          "Ngủ đủ. Thiếu ngủ làm phản xạ chậm đi thấy rõ, và đó là thứ cầu lông cần nhất.",
          "Uống một cốc nước trước khi đi ngủ. Bạn sẽ mất nước suốt đêm qua hơi thở và mồ hôi.",
          "Soạn sẵn túi đồ tối hôm trước: vợt, giày, quần áo, nước. Sáng dậy đỡ cập rập, và đỡ cái cớ để ngủ nướng.",
          "Đừng nhậu tối thứ 6. Cồn làm mất nước và phá giấc ngủ sâu — sáng hôm sau vào sân là biết ngay.",
        ],
      },
      { type: "heading", text: "Ăn gì trước khi đánh" },
      {
        type: "para",
        text: "Đánh lúc bụng rỗng hoàn toàn thì tới ván thứ ba là tụt đường huyết: chân nhũn, mắt hoa, đánh hỏng những quả bình thường ăn được. Nhưng ăn no rồi vào sân ngay cũng không xong.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Dậy trước giờ đánh 60–90 phút",
            body: "Đủ để ăn nhẹ, đi vệ sinh và cho thân nhiệt lên. Dậy trước 20 phút rồi phóng thẳng ra sân là kiểu dễ chấn thương nhất.",
          },
          {
            title: "Ăn nhẹ, dễ tiêu, trước 45–60 phút",
            body: "Một quả chuối, lát bánh mì với mật ong, hộp sữa chua, hoặc chén xôi nhỏ. Mục tiêu là có đường trong máu, không phải ăn no.",
          },
          {
            title: "Tránh đồ nhiều dầu mỡ và nhiều đạm",
            body: "Bún bò, phở tái nạm, bánh mì thịt đầy đủ — để dành ăn sau buổi đánh. Tiêu hoá chậm, vào sân là xóc bụng.",
          },
          {
            title: "Cà phê thì được, nhưng kèm nước",
            body: "Một ly cà phê trước 45 phút giúp tỉnh táo và tăng sức bền thật. Nhưng nó lợi tiểu, nên uống thêm nước lọc cho bù.",
          },
        ],
      },
      { type: "heading", text: "Uống" },
      {
        type: "para",
        text: "Buổi sáng bạn bắt đầu với cơ thể đã thiếu nước sẵn, khác hẳn buổi chiều. Bù trước chứ đừng đợi khát, vì biểu hiện đầu tiên của thiếu nước không phải khát mà là chân nặng và phản xạ chậm.",
      },
      {
        type: "facts",
        items: [
          { label: "Vừa ngủ dậy", value: "300–500 ml" },
          { label: "Trước khi đánh", value: "Thêm 200 ml" },
          { label: "Trong lúc đánh", value: "150 ml mỗi 15 phút" },
          { label: "Buổi trên 90 phút", value: "Thêm điện giải" },
        ],
      },
      {
        type: "note",
        tone: "tip",
        text: "Trời mát nên ít thấy khát, nhưng mồ hôi vẫn ra như thường — chỉ là bay hơi nhanh hơn nên bạn không nhận ra. Cứ uống theo lịch, đừng chờ cảm giác.",
      },
      { type: "heading", text: "Khởi động buổi sáng phải dài hơn" },
      {
        type: "para",
        text: "Bài khởi động 10 phút thông thường là cho cơ thể đã hoạt động cả ngày. Sáng sớm thì cộng thêm khoảng 5 phút nữa, và phần làm nóng chung phải kỹ hơn hẳn — mục tiêu số một là nâng thân nhiệt lên.",
      },
      {
        type: "steps",
        items: [
          {
            title: "Đánh thức cột sống ngay khi dậy",
            meta: "2 phút, ở nhà",
            body: "Quỳ bốn điểm, cong lưng lên rồi võng xuống chậm rãi mười nhịp. Sau đó đứng vươn hai tay lên trần, nghiêng sang từng bên. Đĩa đệm ngậm nước sau một đêm nằm nên rất dễ tổn thương nếu vặn mạnh đột ngột.",
          },
          {
            title: "Làm nóng lâu hơn bình thường",
            meta: "5 phút",
            body: "Chạy bước nhỏ, nâng cao đùi, chạy ngang sân cho tới khi thật sự thấy ấm và hơi lấm tấm mồ hôi. Đừng bỏ qua vì thấy trời mát.",
          },
          {
            title: "Cổ chân và gân gót thật kỹ",
            meta: "3 phút",
            body: "Xoay cổ chân, nhón gót lên xuống 20 cái, ngồi xổm đứng lên vài lần. Đây là nhóm dễ rách nhất vào buổi sáng.",
          },
          {
            title: "Vào trận từ từ",
            meta: "5 phút",
            body: "Ván đầu đánh 70% sức, đừng đập hết lực. Coi ván một như phần khởi động có tính điểm.",
          },
        ],
      },
      { type: "heading", text: "Sau khi đánh" },
      {
        type: "list",
        items: [
          "Giãn cơ tĩnh 5 phút ngay tại sân, lúc người còn nóng.",
          "Ăn sáng tử tế trong vòng một tiếng, có đạm — đây mới là lúc cho tô bún bò. Tiện thể là chỗ trả kèo.",
          "Uống bù cho tới khi hết khát hẳn, đừng dừng ở ngụm đầu tiên.",
          "Đừng về nhà ngủ tiếp ngay. Đi lại nhẹ nhàng nửa tiếng cho nhịp tim xuống từ từ.",
        ],
      },
      {
        type: "para",
        text: "Đánh sáng xong là còn nguyên ngày thứ 7 phía trước. Đó là phần thưởng lớn nhất của khung giờ này — miễn là bạn dành cho nó 30 phút chuẩn bị tử tế.",
      },
    ],
  },

  /* ---------------------------------------------------------------- */
  {
    slug: "phep-lich-su-san",
    title: "Luật bất thành văn ở sân",
    summary:
      "Những thứ không có trong quyển luật nhưng quyết định người ta có muốn rủ bạn đánh tuần sau hay không.",
    category: "Chuẩn bị",
    minutes: 4,
    art: "shuttle",
    cover: "/images/cam-nang/phep-lich-su-san.webp",
    accent: "gold",
    blocks: [
      {
        type: "para",
        text: "Luật thi đấu nói cho bạn biết pha cầu đó ai được điểm. Nhưng thứ quyết định một buổi đánh vui hay nhạt lại nằm ngoài quyển luật. Team mình 19 người, xoay tua nhau trên vài sân, nên mấy chuyện dưới đây đáng nói rõ một lần.",
      },
      { type: "heading", text: "Trước buổi đánh" },
      {
        type: "list",
        items: [
          "Xác nhận đi hay không trước, đừng để người đặt sân phải đoán. Sân đã đặt mà thiếu người thì phần tiền đó ai đó phải gánh.",
          "Bận đột xuất thì báo sớm nhất có thể, kèm một câu xin lỗi là đủ. Báo trước hai tiếng khác hẳn với im lặng rồi không tới.",
          "Tới sớm 10 phút để còn thay đồ và khởi động, thay vì vào sân là đánh luôn.",
        ],
      },
      { type: "heading", text: "Trong lúc đánh" },
      {
        type: "steps",
        items: [
          {
            title: "Cầu bên mình thì mình nhặt",
            body: "Quả rơi ở sân nào thì bên đó nhặt, đánh nhẹ trả về cho người giao cầu chứ đừng để họ chạy sang lấy. Chuyện nhỏ nhưng làm cả buổi đánh trôi nhanh hơn nhiều.",
          },
          {
            title: "Cầu lạc sang sân khác thì hô lên và đợi",
            body: "Đừng chạy vụt sang sân người ta khi họ đang trong pha cầu — vừa nguy hiểm vừa phá trận của họ. Hô một tiếng rồi đợi họ đánh xong.",
          },
          {
            title: "Bên đỡ gọi trong hay ngoài",
            body: "Người nhìn rõ nhất là người ở phía cầu rơi. Đã gọi thì bên kia tin, không tranh cãi. Không ai chắc thì đánh lại.",
          },
          {
            title: "Đánh đôi thì phải nói với nhau",
            body: "Hô Tôi, Của bạn, Ra — ba chữ đó tránh được gần hết những pha hai người cùng lao vào một quả rồi va vợt nhau.",
          },
          {
            title: "Đánh với người yếu hơn thì đừng đập mặt",
            body: "Thắng một pha cầu bằng cú đập vào người mới chơi không chứng minh được gì. Đánh vào góc, nhẹ tay lại một chút — họ mới muốn đi đánh tiếp.",
          },
          {
            title: "Xin lỗi khi ăn điểm may",
            body: "Cầu chạm mép lưới rồi rơi qua, hay trúng cạnh vợt mà thành điểm — giơ tay một cái là đủ. Thông lệ của môn này, không phải khách sáo.",
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        text: "Đừng vào sân khi đang bực chuyện ở công ty. Cầu lông có vợt và có lưới ngăn nhưng vẫn là môn dễ va chạm, và một pha đập hết sức trong lúc bực mình rất dễ thành chấn thương cho người khác.",
      },
      { type: "heading", text: "Sau buổi đánh" },
      {
        type: "list",
        items: [
          "Gom cầu hỏng và vỏ chai, đừng để lại cho người sân sau dọn.",
          "Chia tiền sân ngay trong buổi hôm đó. Để sang tuần là quên, mà người ứng tiền thì ngại nhắc.",
          "Thua kèo thì trả kèo. Cả đội thua bao cả đội thắng — đã chốt thì vui vẻ trả, đừng để phải nhắc.",
        ],
      },
      {
        type: "para",
        text: "Tóm lại chỉ có một nguyên tắc: làm sao để mọi người còn muốn dậy sớm vào thứ 7 tuần sau.",
      },
    ],
  },];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export const CATEGORIES = [
  "Chuẩn bị",
  "Kỹ thuật",
  "Luật",
  "Trang bị",
  "Sức khoẻ",
] as const;
