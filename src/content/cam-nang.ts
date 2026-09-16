/**
 * Nội dung Cẩm nang.
 *
 * Cố ý để ở file tĩnh thay vì database: đây là kiến thức nền, vài tháng
 * mới sửa một lần, nên không đáng dựng cả trang quản trị để biên tập.
 * Muốn thêm bài thì viết thêm một phần tử vào mảng bên dưới.
 */

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
  /** Ảnh bìa; để trống thì dùng bìa chữ. */
  cover?: string;
  accent: "navy" | "gold" | "sky" | "rose" | "emerald";
  blocks: Block[];
};

export const ARTICLES: Article[] = [
  /* ---------------------------------------------------------------- */
  {
    slug: "khoi-dong",
    title: "Khởi động 10 phút trước khi vào sân",
    summary:
      "Bỏ khởi động là cách nhanh nhất để nghỉ đánh vài tuần. Đây là bài 10 phút đủ dùng cho buổi tối thứ 7.",
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
        text: "Đi làm về muộn, vào sân trễ? Cắt bước 1 xuống còn 1 phút, nhưng đừng bao giờ bỏ bước 2.",
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
    cover: "/images/feed-3.jpg",
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
    cover: "/images/feed-1.jpg",
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
    cover: "/images/feed-4.jpg",
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
];

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
