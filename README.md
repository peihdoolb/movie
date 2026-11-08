# 🎬 Peih Movie Player & Plugin Repository

Dự án phát triển ứng dụng xem phim độc lập và Kho Plugin mở rộng cho Android (hỗ trợ cả **JKHX Player** `1.apk`, **Stremio**, và ứng dụng độc lập **Peih Movie**).

---

## 🌟 1. Kho Plugin cho app `1.apk` (JKHX Player)

Nếu bạn đang dùng ứng dụng **`1.apk` (JKHX Player)** hoặc các trình phát tương tự, bạn có thể thêm kho plugin này trực tiếp:

1. Mở ứng dụng **`1.apk`**.
2. Vào phần **Cài đặt** (Settings) ➔ **Quản lý Plugin / Repository** (Plugins).
3. Bấm **Thêm Repository** (Add Repository) và dán đường link sau:
   ```text
   https://raw.githubusercontent.com/peihdoolb/movie/main/repo.json
   ```
4. Bấm **Lưu / Cập nhật**: Toàn bộ danh sách 6 plugin sau sẽ xuất hiện sẵn sàng để cài đặt:
   - **KKPhim**: Cập nhật phim mới liên tục, luồng stream m3u8 nhanh & ổn định.
   - **OPhim**: Kho phim bộ, phim lẻ, anime phong phú.
   - **Blu Phim [MOVIE]**: Nguồn phim Bluphim chất lượng cao (đã giải mã từ Vax).
   - **Hoạt Hình 3D [HH3D]**: Phim hoạt hình 3D Trung Quốc vietsub / thuyết minh.
   - **AnimeVV [ANIME]**: Kho phim anime Nhật Bản chọn lọc.
   - **Sài Gòn Phim**: Nguồn phim điện ảnh, truyền hình tổng hợp.

---

## 🚀 2. Tải Ứng dụng APK độc lập (Peih Movie)

Dự án này tích hợp sẵn **GitHub Actions CI/CD** tự động biên dịch mã nguồn Android Kotlin mỗi khi cập nhật code:

- **100% Độc lập**: Không chứa bất kỳ cơ chế kiểm tra phiên bản từ xa (`update.json`) nào của bên thứ ba, không bao giờ bị khóa tính năng.
- **Trình phát ExoPlayer**: Hỗ trợ phát HLS m3u8, MP4, tùy biến header chống chặn referer, chạy full-screen mượt mà.
- **Giao diện Material 3**: Tìm kiếm thời gian thực, duyệt theo danh mục và chọn tập phim nhanh chóng.

👉 **Tải file APK mới nhất tại:** [GitHub Releases](https://github.com/peihdoolb/movie/releases)

---

## 📂 3. Cấu trúc dự án

```text
peihdoolb/movie/
├── .github/workflows/
│   └── build-apk.yml        # CI/CD tự động build APK trên GitHub Actions
├── app/                     # Mã nguồn ứng dụng Android Kotlin (Jetpack Compose + ExoPlayer)
│   ├── build.gradle.kts
│   └── src/main/java/com/peihdoolb/movie/
├── data/                    # Toàn bộ kho JSON giải mã gốc của Vax
│   ├── moviex.json          # 88 plugins Vax
│   ├── filex.json           # 162 plugins Vax
│   └── xfile.json           # 74 plugins Vax
├── plugins/                 # Các plugin scraper JavaScript cho JKHX / QuickJS
│   ├── kkphim.js
│   ├── ophim.js
│   ├── bluphim.js
│   ├── hh3d.js
│   ├── animevv.js
│   └── saigonphim.js
├── repo.json                # Repository Manifest chuẩn cho JKHX Player
├── build.gradle.kts
└── settings.gradle.kts
```
