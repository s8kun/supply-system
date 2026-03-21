# نظام إدارة شركة التوريد الذكي

واجهة API مبنية بـ Laravel لإدارة العملاء، المنتجات، الطلبات، المخزون، الرصيد، وإشعارات إعادة الطلب.

## المميزات الأساسية
- إدارة العملاء والمنتجات والطلبات وعناصر الطلب.
- إنشاء عميل جديد مع **حساب دخول مرتبط** تلقائيًا (`users` + `customers`).
- خصم الرصيد تلقائيًا عند إنشاء الطلب وإرجاعه عند الإلغاء.
- خصم المخزون فقط عند التسليم الفعلي (وليس عند إنشاء الطلب).
- تتبع التسليم بشكل **تراكمي** عبر `deliveredQuantity` مع حالات:
  - `pending`
  - `partial`
  - `delivered`
- مزامنة حالة الطلب تلقائيًا من التسليم:
  - `pending` / `processing` / `completed`
- دعم الدفع عبر عملية صريحة `mark-paid`، مع تعيين تلقائي لـ `isPaid` عند اكتمال التسليم بالكامل.
- تقرير جاهز للطباعة: **Orders Fulfillment Report** (`/reports/fulfillment`).
- إشعارات إعادة الطلب عند وصول المخزون إلى حد إعادة الطلب.
- شحن الرصيد عبر كود استخدام واحد (Redeem Code).

## المتطلبات
- PHP 8.4 أو أحدث
- Composer
- قاعدة بيانات (MySQL أو SQLite)
- (اختياري) Node.js/NPM إذا كنت ستبني الأصول

## التشغيل باستخدام Docker (الأسرع)
```bash
docker compose up -d --build
```

- التطبيق عبر Nginx: `http://localhost:8080`
- API: `http://localhost:8080/api/v1`

> ملاحظة مهمة: الإعداد الحالي موجّه للتطوير، وملف `docker/entrypoint.sh` يشغّل:
> `php artisan migrate:fresh --seed --force`
> عند بدء الحاوية، يعني إعادة تهيئة البيانات.

إيقاف التشغيل:
```bash
docker compose down
```

## التشغيل اليدوي (بدون Docker)
1) تثبيت الاعتمادات:
```bash
composer install
```

2) إعداد البيئة:
```bash
cp .env.example .env
php artisan key:generate
```

3) إعداد قاعدة البيانات:

خيار MySQL في `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=SupplyCompany
DB_USERNAME=...
DB_PASSWORD=...
```

خيار SQLite:
```bash
touch database/database.sqlite
```
وفي `.env`:
```env
DB_CONNECTION=sqlite
DB_DATABASE=/full/path/to/database/database.sqlite
```

4) تشغيل المايجريشن والسييد:
```bash
php artisan migrate
php artisan db:seed
```

5) إنشاء رابط التخزين:
```bash
php artisan storage:link
```

6) تشغيل السيرفر:
```bash
php artisan serve
```

Base URL:
```text
http://localhost:8000/api/v1
```

## المصادقة والصلاحيات
- أغلب المسارات محمية بـ Sanctum وتحتاج:
```text
Authorization: Bearer <token>
```
- التوكن من `/auth/register` أو `/auth/login`.
- الأدوار الرئيسية: `admin` و`supervisor` و`customer`.

## الجدولة (Reorder Notices)
تشغيل المجدول محليًا:
```bash
php artisan schedule:work
```

في الإنتاج (cron):
```cron
* * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
```

## الاختبارات
```bash
php artisan test
```

ملاحظة: الإعداد في `phpunit.xml` يستخدم SQLite in-memory أثناء الاختبارات:
- `DB_CONNECTION=sqlite`
- `DB_DATABASE=:memory:`

## ملفات اختبار API الجاهزة
طلبات HTTP الجاهزة موجودة في:
```text
tests/TestApi
```

## التوثيق
- توثيق API الكامل: `docs/api.md`
- دليل Docker: `README_DOCKER.md`
