import { defineConfig, globalIgnores } from "eslint/config";
import babelParser from "@babel/eslint-parser";
import next from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Cấu hình ESLint.
 *
 * TRƯỚC ĐÂY DỰ ÁN KHÔNG LINT ĐƯỢC DÒNG NÀO. Có script `"lint": "next lint"`
 * trong package.json nên nhìn thì tưởng là có, nhưng ba tầng cùng thiếu:
 *
 *   · `next lint` đã bị gỡ ở Next 16. Chạy `npm run lint` ra lỗi
 *     "no such directory: ...\lint" — nó hiểu chữ "lint" là tên thư mục.
 *   · không có gói eslint nào trong package.json.
 *   · không có tệp cấu hình nào.
 *
 * Cái giá của việc đó không phải lý thuyết. Trang 404 có hai thẻ `<img>`
 * trỏ thẳng vào tệp logo gốc, kèm dòng tắt luật `@next/next/no-img-element`
 * ngay bên trên — đúng cái luật ở đây. React phát ra thẻ preload cho ảnh
 * trong cây, mà `not-found` nằm trong payload của mọi route, nên 479KB
 * logo bị tải ở MỌI trang. Lint bật thì luật đó đã lên tiếng lúc viết.
 *
 * ==================================================================
 * TẠI SAO KHÔNG DÙNG `eslint-config-next` NHƯ TÀI LIỆU NEXT HƯỚNG DẪN
 * ------------------------------------------------------------------
 * Đã cài và đã thử. Gói đó nạp `typescript-eslint` ngay ở điểm vào, mà
 * `typescript-eslint` chưa hỗ trợ TypeScript 7:
 *
 *   Error: typescript-eslint does not support TS 7.0.
 *       at node_modules/eslint-config-next/dist/index.js:5
 *
 * Dự án đang dùng TypeScript 7.0.2. Hạ cấp TypeScript chỉ để chạy được
 * lint thì đắt hơn cái được, nên thay vào đó lấy thẳng hai plugin mà
 * `eslint-config-next` vốn gói lại — chúng không cần typescript-eslint:
 *
 *   · @next/eslint-plugin-next   22 luật, gồm cả no-img-element
 *   · eslint-plugin-react-hooks  luật về hook
 *
 * Phần THIẾU so với bản đầy đủ là nhóm luật TypeScript (biến không dùng,
 * ép kiểu thừa...). Khi typescript-eslint hỗ trợ TS 7 thì đổi tệp này
 * về đúng ba dòng trong tài liệu Next là xong — xem
 * node_modules/next/dist/docs/01-app/03-api-reference/05-config/03-eslint.md
 *
 * Trong lúc chờ, `tsc` vẫn bắt phần lớn nhóm đó khi dựng.
 * ==================================================================
 *
 * Dùng `core-web-vitals` chứ không phải bản nền: nó nâng những luật ảnh
 * hưởng tốc độ tải từ cảnh báo thành lỗi. App này chạy trên điện thoại
 * giữa sân, bằng 4G.
 */
const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".playwright-mcp/**",
  ]),
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    languageOptions: {
      /* ESLint không tự đọc được cú pháp TypeScript, mà bộ phân tích quen
         thuộc `@typescript-eslint/parser` thì chặn TS 7 (xem ghi chú trên).
         Babel đọc TS bằng bộ phân tích riêng, không đụng tới trình biên
         dịch TypeScript, nên không vướng. */
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [
            ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
            ["@babel/preset-react", { runtime: "automatic" }],
          ],
        },
      },
    },
    plugins: {
      "@next/next": next,
      "react-hooks": reactHooks,
    },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,

      /*
        `set-state-in-effect` để CẢNH BÁO, không phải lỗi.
        Lần chạy đầu tiên nó bắt 13 chỗ có sẵn: cờ "đã gắn" cho an toàn
        hydrate, đồng bộ `matchMedia`, mấy hiệu ứng ở trang giới thiệu.
        Phần lớn là mẫu quen thuộc, và viết lại cho đúng ý luật này
        thường phải chuyển sang `useSyncExternalStore` — tức sửa 13 chỗ
        trong 13 tệp, là một việc riêng chứ không phải việc dựng lint.

        Để cảnh báo thì nền sạch, `npm run lint` chạy xong ra 0 lỗi, nên
        bất kỳ LỖI MỚI nào cũng nổi lên ngay. Mà 13 chỗ kia vẫn nằm đó
        trong bản in, không bị giấu đi.
      */
      "react-hooks/set-state-in-effect": "warn",

      /*
        `preserve-manual-memoization` cũng để cảnh báo.
        Nó báo "Existing memoization could not be preserved" — nghĩa là
        React Compiler sẽ bỏ qua component đó thay vì tối ưu. Mà dự án
        này KHÔNG bật React Compiler (xem next.config.ts), nên lời khuyên
        ấy hiện chưa có tác dụng gì.

        Giữ ở mức cảnh báo chứ không tắt hẳn: hôm nào bật React Compiler
        thì đây đúng là danh sách cần xem lại.
      */
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
]);

export default eslintConfig;
