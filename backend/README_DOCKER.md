# تشغيل المشروع باستخدام Docker | Running with Docker

هذا الدليل لتشغيل backend فقط باستخدام `compose.yaml`.
This guide is for running the backend service stack using `compose.yaml`.

## المتطلبات | Requirements
- Docker
- Docker Compose (v2, command: `docker compose`)

## التشغيل | Start
```bash
docker compose up -d --build
```

## الوصول للخدمات | Service URLs
- التطبيق عبر Nginx | App via Nginx: `http://localhost:8080`
- API base | قاعدة الـ API: `http://localhost:8080/api/v1`
- قاعدة البيانات MySQL داخل الشبكة | MySQL host inside compose network: `db:3306`

## الإيقاف | Stop
```bash
docker compose down
```

## ملاحظات مهمة | Important Notes
- ملف `docker/entrypoint.sh` يقوم عند الإقلاع بـ:
  - إنشاء `.env` (إذا غير موجود)
  - `composer install` (إذا `vendor` غير موجود)
  - `php artisan key:generate --force`
  - `php artisan migrate:fresh --seed --force`
- هذا مناسب للتطوير المحلي، لكنه **يمسح البيانات** مع كل تشغيل جديد للحاوية.
- This is development-friendly, but `migrate:fresh --seed` resets data on container start.

- منفذ الويب المعروض من `compose.yaml` هو `8080` وليس `8000`.
- Exposed web port in `compose.yaml` is `8080` (not `8000`).
