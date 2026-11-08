# 🎬 Peih Movie Player (Tương đương Vax)

Ứng dụng xem phim độc lập, mã nguồn mở dành cho Android:
- **100% Không bị kiểm tra hay khóa từ xa**: Tự do cài đặt, không phụ thuộc máy chủ bên thứ ba.
- **Bộ chọn nguồn phát (Source Selector)**: Cho phép chuyển đổi linh hoạt giữa các nguồn:
  - ⚡ **KKPhim VIP**: Kho phim số 1, cập nhật liên tục, server m3u8 siêu tốc.
  - 💎 **Blu Phim**: Nguồn phim Bluphim chất lượng cao (đã giải mã từ Vax).
  - 🐉 **Hoạt Hình 3D (HH3D)**: Chuyên phim hoạt hình 3D Donghua Trung Quốc.
  - 🍿 **AnimeVV**: Kho hoạt hình anime Nhật Bản phong phú.
  - 📺 **Kho Plugin Vax (88 nguồn)**: Tích hợp sẵn toàn bộ 88 plugin từ `moviex.json`.
- **Trang chủ phong phú (Netflix style)**:
  - Hero Banner tự động hiển thị phim nổi bật.
  - 5 danh mục cuộn ngang: Phim Mới Cập Nhật, Phim Bộ Đang Hot, Phim Lẻ Chiếu Rạp, Hoạt Hình & Anime, TV Shows & Gameshow (hơn 120 phim xuất hiện ngay lập tức).
  - Hỗ trợ cuộn vô tận (Infinite Scroll) khi duyệt theo từng chuyên mục.
- **Trình phát ExoPlayer chuyên nghiệp**: HLS m3u8, MP4, tự động xoay ngang toàn màn hình (Sensor Landscape), chống tắt màn hình.

---

## 🚀 Tải về cài đặt

👉 **[Tải PeihMovie-release.apk mới nhất (v1.1.0)](https://github.com/peihdoolb/movie/releases/download/v1.1.0/PeihMovie-release.apk)**

Hoặc truy cập: [GitHub Releases](https://github.com/peihdoolb/movie/releases)

---

## 📂 Cấu trúc dự án

```text
peihdoolb/movie/
├── .github/workflows/
│   └── build-apk.yml        # CI/CD tự động build APK trên GitHub Actions
├── app/                     # Mã nguồn ứng dụng Android Kotlin (Jetpack Compose + ExoPlayer)
│   ├── build.gradle.kts
│   ├── src/main/assets/     # Tích hợp sẵn 88 nguồn phim Vax (moviex.json, filex.json...)
│   └── src/main/java/com/peihdoolb/movie/
│       ├── MainActivity.kt
│       ├── ui/screens/
│       │   ├── HomeScreen.kt    # Trang chủ đa danh mục, Hero banner, chọn nguồn
│       │   ├── DetailScreen.kt  # Chi tiết phim, chọn server, danh sách tập
│       │   ├── SearchScreen.kt  # Tìm kiếm phim thời gian thực
│       │   └── SourcesScreen.kt # Quản lý và tìm kiếm 88 nguồn phim
│       └── ui/player/
│           └── VideoPlayerActivity.kt # ExoPlayer toàn màn hình
└── repo.json                # Repository Manifest cho các app tương thích
```
