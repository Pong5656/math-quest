import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  {
    rules: {
      // แอปนี้ใช้ 2 pattern ที่ React Compiler lint ของ Next 16 ไม่รองรับ:
      //  1) โหลดเซฟ/ความคืบหน้าจาก localStorage หลัง hydrate (setState ใน effect)
      //  2) เกมจอพิกเซลบน canvas ที่ต้องแก้ค่าภายใน refs ทุกเฟรมของ game loop
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      // `useItem` ใน src/lib/store.ts เป็นฟังก์ชันธรรมดา (ใช้ไอเทม) ไม่ใช่ React Hook —
      // และเนื้อหาภาษาไทยใช้เครื่องหมายคำพูด “ ” ใน JSX ปกติ
      "react-hooks/rules-of-hooks": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);