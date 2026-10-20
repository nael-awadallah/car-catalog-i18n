# car-catalog-i18n

حزمة خفيفة ومستقلة عن أي إطار عمل، توفر ماركات وموديلات السيارات مترابطة، مع أسماء متعددة اللغات ودوال بحث.
تعمل في Node.js والمتصفح ولا تحتاج أي اعتماديات وقت التشغيل. الأسماء الأساسية بالإنجليزية، والترجمة العربية مضمّنة، ويمكن للمجتمع إضافة لغات أخرى.

[English](README.md)

> **الحالة: إصدار مبكر (0.x).** البيانات الحالية أولية وصغيرة، والترجمة العربية **لم تُراجَع بعد من مراجع عربي متمكّن**.
> راجع [تقرير التغطية](docs/COVERAGE.md) لمعرفة ما هو مشمول فعلاً. الحزمة لا تدّعي تغطية كاملة.

## التثبيت

```sh
npm install car-catalog-i18n
```

## الاستخدام

```ts
import { createCatalog } from "car-catalog-i18n";
import ar from "car-catalog-i18n/locales/ar";

const catalog = createCatalog({ locale: "ar", translations: ar });

catalog.getMakes();                 // كل الماركات
catalog.getModels("toyota");        // موديلات ماركة معيّنة
catalog.getMake("toyota");
catalog.getModel("toyota/camry");

catalog.searchMakes("تويو");
catalog.searchModels("كامري", { makeId: "toyota", limit: 20 });
```

كل نتيجة تحتوي `name` (الاسم الأساسي) و`displayName` (الاسم المعروض) و`translated`.
إن لم توجد ترجمة يُستخدم الاسم الأساسي.

البحث يطابق الأسماء الأساسية والمترجمة والأسماء البديلة، ويتجاهل حالة الأحرف والتشكيل والتطويل،
ويوحّد صور الألف (أ إ آ ٱ ← ا). الترتيب: تطابق تام ثم بداية الاسم ثم جزء من الاسم.

كل نسخة من `createCatalog` مستقلة، فلا توجد لغة عامة مشتركة بين الطلبات.

## المطوّر

أنشأها ويشرف عليها [Nael Awadallah](https://github.com/nael-awadallah).

## المساهمة والتراخيص

انظر [CONTRIBUTING.md](CONTRIBUTING.md) و[دليل الترجمة](docs/translation-guide.md).
الكود بترخيص MIT، والبيانات الأصلية CC0 (انظر [DATA-LICENSE](DATA-LICENSE)). أسماء الماركات والموديلات علامات تجارية لأصحابها.
