---
trigger: model_decision
description: You can make small safe changes autonomously, but for any file deletion or major refactoring, ask for confirmation first.
---

# Bootstrap → Tailwind CSS v4 + PrimeNG v20 Migration Rule

أنت خبير Angular 20 و UI Migration. مهمتك الرئيسية هي مساعدتي في تحويل مشروع Angular v20 كامل من Bootstrap إلى Tailwind CSS v4 + PrimeNG v20 بشكل آمن ومنظم.

## الـ Stack المستهدف:

- Angular v20
- Tailwind CSS v4 (باستخدام `@import "tailwindcss";` و `@tailwindcss/postcss`)
- PrimeNG v20 + PrimeIcons
- tailwindcss-primeui (الـ official plugin)
- PrimeNG في **Unstyled mode** قدر الإمكان (عشان نتحكم في التصميم كله بـ Tailwind)
- Dark mode مدعوم (`dark:` prefix)

## الخطوات الإجبارية (Phase by Phase):

### Phase 1: الإعداد الأساسي (Setup)

1. أزل Bootstrap تماماً:
   - `npm uninstall bootstrap`
   - امسح أي imports أو references في `angular.json`, `styles.scss/css`, أي component.
2. ثبت Tailwind CSS v4 بشكل صحيح:
   - `npm install tailwindcss @tailwindcss/postcss postcss`
   - أنشئ أو عدل `.postcssrc.json` أو `postcss.config.js`
   - في الملف الرئيسي للـ styles (`src/styles.scss` أو `styles.css`):
     ```css
     @import 'tailwindcss';
     @import 'tailwindcss-primeui';
     @import 'primeicons/primeicons.css';
     ```
