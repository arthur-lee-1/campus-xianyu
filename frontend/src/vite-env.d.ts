/// <reference types="vite/client" />

/**
 * 类型声明补齐（给 TS/编辑器用）
 *
 * 你截图里 `import styles from './index.module.css'` 报红，
 * 大概率是因为项目缺少对 CSS Modules 的类型声明。
 *
 * 说明：
 * - 这些声明不会影响运行时，只是让 TypeScript 知道导入的类型是什么
 * - Vite 官方模板通常自带这个文件；你这个项目里之前缺失了
 */

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.scss' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.sass' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.module.less' {
  const classes: Record<string, string>;
  export default classes;
}

