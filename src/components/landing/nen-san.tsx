/**
 * Nền hero: một sàn sân cầu lông chạy vào chiều sâu, dưới hai quầng đèn
 * nhà thi đấu.
 *
 * Trước đó nền chỉ là một mặt navy phẳng. Quả cầu 3D thì đẹp nhưng nó
 * lơ lửng trong hư không — không có gì nói cho mắt biết đây là một cái
 * sân, cũng không có gì cho biết đâu là gần đâu là xa.
 *
 * PHẢI NẰM ĐÈ LÊN CANVAS, KHÔNG PHẢI PHÍA SAU.
 *
 * Canvas của hero dựng với `alpha: false` và tự xoá nền bằng navy đặc,
 * nên bất cứ thứ gì đặt phía sau đều bị che kín — đây là chỗ dễ mất nửa
 * tiếng nếu không biết trước. `mix-blend-mode: screen` giải quyết: màu
 * sáng cộng vào nền tối thành ÁNH SÁNG, còn màu đen thì trong suốt. Nhờ
 * vậy mấy nét vàng đọc như vạch sơn được đèn hắt vào, chứ không phải một
 * tấm màng dán lên trên.
 *
 * ĐƯỜNG NÉT TỰ TÍNH THEO PHỐI CẢNH, KHÔNG DÙNG `rotateX` CỦA CSS.
 *
 * Xoay một lưới phẳng bằng CSS 3D thì gọn hơn thật, nhưng nó kéo theo cả
 * một ngữ cảnh 3D mới: mọi thứ bên trong phải tự lo z-index, và nét vẽ
 * gần chân màn hình sẽ dày gấp mấy lần nét ở xa. Ở đây chỉ cần mấy đoạn
 * thẳng, mà đã là đoạn thẳng thì chiếu phối cảnh vẫn ra đoạn thẳng — nên
 * tính thẳng toạ độ hai đầu rồi vẽ, nét nào cũng mảnh như nhau.
 *
 * Các vạch ngang thưa dần theo cấp số nhân khi tiến về điểm tụ. Chia đều
 * thì mắt đọc ra ngay là một cái lưới bẹt nằm nghiêng, chứ không ra một
 * mặt sàn trải xa.
 */

/**
 * Điểm tụ.
 *
 * Bản đầu đặt ở 430/1000 và chụp lại thấy ngay vì sao không được: mấy nét
 * chụm vào đúng sau dòng "LH Sport Hub", vạch ngang thì cắt ngang thân
 * chữ. Hạ xuống 640 thì cả mặt sàn nằm gọn dưới hai cái nút, còn nửa
 * trên của khung trả lại cho quả cầu.
 */
const TU_X = 500;
const TU_Y = 640;

/** Mép dưới khung — nơi sàn bắt đầu. */
const DAY = 1000;

/**
 * Hai biên dọc của sân ở mép dưới, và hai vạch đơn nằm trong.
 *
 * Số âm và số lớn hơn 1000 là cố ý: sân rộng hơn khung hình, nên hai biên
 * ngoài bị cắt mất ở hai mép — đúng như khi đứng ngay trong sân nhìn ra.
 */
const BIEN = [-900, -260, 1260, 1900];

/** Vị trí các vạch ngang, tính theo phần đường đã đi từ đáy lên điểm tụ. */
const VACH_NGANG = [0, 0.22, 0.4, 0.545, 0.655, 0.74, 0.805, 0.855];

/**
 * Hạt nhiễu, nhúng thẳng dưới dạng data URI.
 *
 * Một mảng navy lớn phủ kín màn hình bao giờ cũng lộ ra mấy vệt sọc do
 * màn hình chỉ có 8 bit mỗi kênh, và chính mấy vệt đó làm nền trông rẻ
 * tiền. Rắc một lớp hạt cực mảnh lên trên thì mắt không còn bắt được
 * ranh giới giữa hai sắc độ kề nhau nữa.
 *
 * `feTurbulence` chạy MỘT LẦN lúc trang dựng ảnh nền rồi thôi, không
 * phải mỗi khung hình — nên rẻ hơn hẳn so với vẽ hạt bằng canvas. Ô hạt
 * chỉ 160px và được lát lại, đủ lớn để không thấy lặp.
 */
const HAT_NHIEU =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
      '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>' +
      '<feColorMatrix type="saturate" values="0"/></filter>' +
      '<rect width="160" height="160" filter="url(#n)"/>' +
      "</svg>",
  );

/** Lấy điểm nằm giữa đáy và điểm tụ theo tỉ lệ t. */
function diemTren(xDay: number, t: number) {
  return {
    x: xDay + (TU_X - xDay) * t,
    y: DAY + (TU_Y - DAY) * t,
  };
}

export function NenSan({ gold }: { gold: string }) {
  const bienTrai = BIEN[0];
  const bienPhai = BIEN[BIEN.length - 1];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/*
        BLEND ĐẶT Ở TỪNG LỚP CON, KHÔNG ĐẶT Ở THẺ BỌC.

        Thẻ bọc mà mang `mix-blend-mode` thì nó tự dựng một ngữ cảnh
        xếp chồng riêng, và mọi lớp bên trong chỉ còn hoà với nhau chứ
        không với ảnh 3D phía dưới. Lớp ánh sáng cần `screen`, còn lớp
        hạt cần `soft-light` — hai chế độ khác nhau thì buộc phải tách.
      */}

      {/*
        Hai mảng sáng lớn phá thế phẳng của nửa trên khung: một mảng
        xanh ấm phía trên trái, một mảng lạnh hơn bên phải.

        Rất mờ và rất rộng — thấy được rõ là hỏng, chỉ cần nền thôi bệt
        một màu. Bản đầu để đậm gần gấp rưỡi, chụp lại thì cả khung sáng
        lên và quả cầu hết nổi; thứ đáng nhìn ở đây là quả cầu, nền chỉ
        có việc đỡ nó.
      */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: [
            `radial-gradient(76% 54% at 12% 10%, #3a5ea83d, transparent 66%)`,
            `radial-gradient(66% 50% at 92% 26%, #1d5f7a2e, transparent 64%)`,
          ].join(","),
        }}
      />

      {/*
        Hai quầng đèn hắt xuống từ trên. Để riêng khỏi SVG sàn vì chúng cần
        phủ mờ cả khung, mà bộ lọc mờ trong SVG thì tốn hơn hẳn so với một
        khối gradient của CSS.
      */}
      <div
        className="absolute inset-0 mix-blend-screen den-nha-thi-dau"
        style={{
          background: [
            `radial-gradient(52% 44% at 18% -8%, ${gold}22, transparent 62%)`,
            `radial-gradient(52% 44% at 82% -8%, #9fc0ff1f, transparent 62%)`,
          ].join(","),
        }}
      />

      {/*
        Vũng sáng trên mặt sàn và dải mù ở đường chân trời.

        ĐẶT TRƯỚC SVG, tức nằm DƯỚI mấy nét vạch. Vạch sơn nằm trên sàn
        nên chỗ nào sàn được đèn rọi thì vạch ở đó sáng theo; úp ngược
        thứ tự lại thì vũng sáng phủ mờ lên vạch, thành ra sương chứ
        không thành ánh sáng.

        Vũng sáng bẹt và rộng (74% ngang, 16% dọc) vì nó là một hình tròn
        nhìn xiên. Để tròn đều thì nó đọc thành một quả cầu sáng lơ lửng,
        không dính gì tới mặt sàn.
      */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: [
            `radial-gradient(74% 16% at 50% 90%, ${gold}26, transparent 72%)`,
            `linear-gradient(to bottom, transparent 60%, #7fa6ff14 64%, transparent 69%)`,
          ].join(","),
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full mix-blend-screen"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <defs>
          {/*
            Càng về phía điểm tụ càng mờ hẳn đi. Không có lớp che này thì
            mấy nét chụm lại thành một búi đặc ngay giữa khung, hút mắt
            khỏi quả cầu — thứ đáng nhìn nhất ở đây.
          */}
          <linearGradient id="nen-san-mo" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.62" />
            <stop offset="30%" stopColor="#fff" stopOpacity="0.42" />
            <stop offset="62%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="88%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="nen-san-che">
            <rect
              x="0"
              y={TU_Y}
              width="1000"
              height={DAY - TU_Y}
              fill="url(#nen-san-mo)"
            />
          </mask>
        </defs>

        <g
          mask="url(#nen-san-che)"
          stroke={gold}
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
          fill="none"
        >
          {/* Bốn vạch dọc chạy về điểm tụ */}
          {BIEN.map((x) => (
            <line key={x} x1={x} y1={DAY} x2={TU_X} y2={TU_Y} />
          ))}

          {/*
            KHÔNG VẼ VẠCH GIỮA SÂN. Sân thật thì có, nhưng ở đây nó trùng
            trục dọc của khung nên không có phối cảnh nào để đọc: nó hiện
            ra thành một sọc thẳng đứng chạy xuyên qua mũi tên mời cuộn.
          */}

          {/* Vạch ngang, thưa dần về phía xa */}
          {VACH_NGANG.map((t) => {
            const a = diemTren(bienTrai, t);
            const b = diemTren(bienPhai, t);
            return <line key={t} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
      </svg>

      {/* Hạt nhiễu, trên cùng để phủ lên tất cả các lớp dưới */}
      <div
        className="absolute inset-0 mix-blend-soft-light opacity-[0.28]"
        style={{ backgroundImage: `url("${HAT_NHIEU}")` }}
      />
    </div>
  );
}
