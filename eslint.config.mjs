import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  {
    rules: {
      // แอปนี้ใช้ 3 pattern ที่ React Compiler lint ของ Next 16 ไม่รองรับ:
      //  1) โหลดเซฟผู้เล่นจาก localStorage หลัง hydrate (setState ใน effect)
      //  2) เกมจอพิกเซลบน canvas ที่ต้องแก้ค่าภายใน refs ทุกเฟรมของ game loop
      //  3) เนื้อหาภาษาไทยใช้เครื่องหมายคำพูด “ ” ใน JSX ปกติ
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);