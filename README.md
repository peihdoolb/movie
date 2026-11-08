# 🎬 Vax-ver2 & Peih Movie Player

Dự án cung cấp giải pháp xem phim không bị khóa:

---

## 🌟 1. Vax-ver2.apk (Bản Clone Vax Player gốc - Không bao giờ bị khóa)

Bản clone trực tiếp từ Vax Player gốc, giữ lại **100% giao diện, tính năng, hiệu ứng và cơ chế đổi nguồn động của Vax Player**:
- **Không bao giờ bị khóa từ xa**: Đã can thiệp vào mã máy (DEX), chuyển hướng cơ chế kiểm tra `update.json` về server GitHub của bạn ([`up.json`](https://github.com/peihdoolb/movie/blob/main/up.json)).
- **Tự động nhận diện mã viết tắt**: Hoạt động hoàn hảo với `moviex`, `filex`, `xfile`...
- **Đổi nguồn đổi toàn bộ Trang chủ**: Đúng chuẩn cơ chế Plugin-Driven UI của Vax.

👉 **[Tải Vax-ver2.apk](https://github.com/peihdoolb/movie/releases/download/v2.0.0/Vax-ver2.apk)**

---

## 📱 2. PeihMovie (Ứng dụng mở nguồn Android độc lập)

Ứng dụng độc lập viết bằng Kotlin Jetpack Compose + ExoPlayer:
- **Tích hợp trọn vẹn 88 nguồn phim từ hệ thống Vax** vào danh sách plugin mặc định của ứng dụng.
- **Chọn nguồn linh hoạt**: Chọn nhanh ngay tại Trang chủ (Bottom Sheet có tìm kiếm) hoặc tại tab **Kho nguồn**.
- **Trang chủ thay đổi 100% theo nguồn được chọn**:
  - Chọn **Hoạt Hình 3D (HH3D)**: Trang chủ tự động chuyển sang phim hoạt hình 3D (Tiên Nghịch, Thế Giới Hoàn Mỹ, Mục Thần Ký, Võ Thần Chúa Tể..., phân mục Đang Chiếu, Phim Lẻ / OVA, Hoàn Thành).
  - Chọn **KKPhim**: Hiển thị kho phim điện ảnh, truyền hình, hoạt hình từ KKPhim VIP.
  - Chọn các nguồn khác (Nguồn C, Anime, Drama, Điện ảnh...): Trang chủ tự động thay đổi danh mục và nguồn phim tương ứng.
- **Trình phát m3u8 ổn định**: Đã khắc phục triệt để lỗi crash khi chọn tập phim.

👉 **[Tải PeihMovie-release.apk (v2.1.0)](https://github.com/peihdoolb/movie/releases/download/v2.1.0/PeihMovie-release.apk)**

---

## 📂 3. Cấu trúc dự án

```text
peihdoolb/movie/
├── .github/workflows/
│   └── build-apk.yml        # CI/CD tự động build & patch APK trên GitHub Actions
├── scripts/
│   └── patch_vax.py         # Script tự động can thiệp DEX bypass kiểm tra update của Vax
├── up.json                  # Cấu hình update độc lập luôn mở khóa
├── data/                    # Toàn bộ kho JSON giải mã của Vax
├── plugins/                 # Các plugin scraper JS
└── app/                     # Mã nguồn PeihMovie
```
