var BASEURL = "https://freetube.com.mx";
var BASESOURCE = "";
var D1_API = "https://data.drivepcthuan.workers.dev"; // D1 Worker Master API
var PLUGIN_ID = "freetube";

function getManifest() {
    return JSON.stringify({
        "id": "bluphim",
        "name": "Blu Phim [MOVIE]",
        "version": "1.0.1",
        "info": "Xem phim trực tuyến chất lượng cao từ nguồn bluphim.",
        "BASEURL": BASEURL,
        "iconUrl": "https://vaxplugin.alokillgtv.workers.dev/img/icon/bluphim.png",
        "headers": {
            "Referer": "https://freetube.com.mx/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        },
        "isEnabled": true,
        "isAdult": false,
        "adblock": false,
        "type": "MOVIE",
        "author": "alokillgtv",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: "phim-bo", title: "Phim Bộ", type: "Horizontal", path: "the-loai/phim-bo-1" },
        { slug: "phim-le", title: "Phim Lẻ", type: "Horizontal", path: "the-loai/phim-le-1" },
        { slug: "home", title: "Mới Cập Nhật", type: "Grid", path: "" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: "Phim Mới", slug: "the-loai/phim-moi-1" },
        { name: "Phim Bộ", slug: "the-loai/phim-bo-1" },
        { name: "Phim Lẻ", slug: "the-loai/phim-le-1" },
        { name: "Phim Chiếu Rạp", slug: "the-loai/phim-chieu-rap-1" },
        { name: "Hoạt Hình", slug: "the-loai/hoat-hinh-1" },
        { name: "Hành Động", slug: "the-loai/hanh-dong-1" },
        { name: "Võ Thuật Kiếm Hiệp", slug: "the-loai/vo-thuat-kiem-hiep-1" },
        { name: "Thần Thoại Cổ Trang", slug: "the-loai/than-thoai-co-trang-1" },
        { name: "Tình Cảm Lãng Mạn", slug: "the-loai/tinh-cam-lang-man-1" },
        { name: "Hài Hước", slug: "the-loai/hai-huoc-1" },
        { name: "Tâm Lý", slug: "the-loai/tam-ly-1" },
        { name: "Kinh Dị", slug: "the-loai/kinh-di-1" },
        { name: "Viễn Tưởng", slug: "the-loai/vien-tuong-1" },
        { name: "Phiêu Lưu", slug: "the-loai/phieu-luu-1" },
        { name: "Tội Phạm Hình Sự", slug: "the-loai/toi-pham-hinh-su-1" },
        { name: "Chiến Tranh", slug: "the-loai/chien-tranh-1" },
        { name: "Kỳ Ảo", slug: "the-loai/ky-ao-1" },
        { name: "Bí Ẩn", slug: "the-loai/bi-an-1" },
        { name: "Gia Đình", slug: "the-loai/gia-dinh-1" }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: "Mới nhất", value: "newest" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = parseInt(filters.page || 1, 10);

    var cleanSlug = (slug || "").replace(/^\/+|\/+$/g, "");
    // Một số bản native gửi lại URL lỗi ASP.NET thay vì slug.
    var errorPath = cleanSlug.match(/aspxerrorpath=\/?(?:%2F|\/)?(phim-bo|phim-le|phim-chieu-rap|hoat-hinh|phim-moi)/i);
    if (errorPath) cleanSlug = errorPath[1].toLowerCase();
    // Nếu native truyền nguyên URL lỗi, chỉ giữ lại route danh mục.
    if (/^(?:https?:\/\/[^/]+\/)?\??aspxerrorpath=/i.test(cleanSlug)) {
        cleanSlug = "the-loai/phim-moi-1";
    }
    if (!cleanSlug || cleanSlug === "home") {
        cleanSlug = "the-loai/phim-moi-1";
    }

    // Các mục trong getHomeSections có thể được gọi lại chỉ với slug ngắn.
    // FreeTube không có route /phim-bo, /phim-le...; route đúng là /the-loai/{slug}-1.
    if (cleanSlug === "phim-bo" || cleanSlug === "phim-le" ||
        cleanSlug === "phim-chieu-rap" || cleanSlug === "hoat-hinh" ||
        cleanSlug === "phim-moi") {
        cleanSlug = "the-loai/" + cleanSlug + "-1";
    }
    // Một số caller truyền route cũ dạng /phim-bo thay vì slug thuần.
    cleanSlug = cleanSlug.replace(/^\/?phim-(bo|le|chieu-rap|moi|hoat-hinh)(?:-\d+)?(?:\?.*)?$/i, "the-loai/phim-$1-1");

    // Nếu slug có dạng the-loai/...-1, thay số 1 bằng số page
    if (page > 1 && cleanSlug.indexOf("the-loai/") === 0) {
        var baseCategory = cleanSlug.replace(/-\d+$/, "");
        return BASEURL + "/" + baseCategory + "-" + page;
    }

    return BASEURL + "/" + cleanSlug;
}

function getUrlSearch(keyword, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = parseInt(filters.page || 1, 10);
    var q = encodeURIComponent(keyword || "");

    // Search trực tiếp qua web gốc (hoặc D1 nếu có cache)
    return BASEURL + "/search?k=" + q;
}

function getUrlDetail(slug, datasend) {
    if (!slug) return "";

    // Một số response lỗi của ASP.NET trả lại dạng
    // /?aspxerrorpath=/phim/slug. Chuẩn hóa trước khi dựng URL chi tiết.
    var errorDetail = slug.match(/aspxerrorpath=(?:%2F|\/)(phim|xem-phim)\/([^?#]+)/i);
    if (errorDetail) {
        return BASEURL + "/" + errorDetail[1].toLowerCase() + "/" + errorDetail[2];
    }

    // 0ms nếu đã có sẵn full chi tiết trong datasend
    if (datasend && datasend.indexOf('"servers"') > -1) {
        console.log("[FreeTube] getUrlDetail -> Có sẵn datasend 0ms: " + slug);
        return datasend;
    }

    // Nếu slug đã là URL hoàn chỉnh
    if (slug.indexOf("http") === 0) {
        return slug;
    }

    var cleanSlug = slug.replace(/^\/+|\/+$/g, "");
    if (cleanSlug.indexOf("phim/") === 0 || cleanSlug.indexOf("xem-phim/") === 0) {
        return BASEURL + "/" + cleanSlug;
    }
    return BASEURL + "/phim/" + cleanSlug;
}

function parseCategoriesResponse(apiResponseJson) {
    return getPrimaryCategories();
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function cleanHtml(s) {
    if (!s) return "";
    return s.replace(/<[^>]+>/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&#8211;/g, "-")
            .replace(/&#212;/g, "Ô")
            .replace(/&#244;/g, "ô")
            .replace(/&#226;/g, "â")
            .replace(/&#234;/g, "ê")
            .replace(/&#249;/g, "ù")
            .replace(/&#250;/g, "ú")
            .replace(/&#237;/g, "í")
            .replace(/&#236;/g, "ì")
            .replace(/&#224;/g, "à")
            .replace(/&#225;/g, "á")
            .replace(/&#253;/g, "ý")
            .replace(/&#245;/g, "õ")
            .replace(/\s+/g, " ")
            .trim();
}

function extractPageInfoHtml(html) {
    var startRe = /<div\b[^>]*\bid=["']page-info["'][^>]*>/i;
    var startM = startRe.exec(html || "");
    if (!startM) return "";

    var start = startM.index;
    var pos = start + startM[0].length;
    var depth = 1;
    var tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = pos;
    var tag;
    while ((tag = tagRe.exec(html)) !== null) {
        if (/^<div\b/i.test(tag[0]) && !/\/\s*>$/.test(tag[0])) depth++;
        else if (/^<\/div/i.test(tag[0])) depth--;
        if (depth === 0) return html.substring(start, tagRe.lastIndex);
    }
    return html.substring(start);
}

function parseListResponse(htmlResponse, url) {
    try {
        console.log("[FreeTube] parseListResponse URL: " + url);

        // 1. Kiểm tra nếu là JSON từ D1 API
        try {
            var d1Data = JSON.parse(htmlResponse);
            if (d1Data && d1Data.items && Array.isArray(d1Data.items) && d1Data.items.length > 0) {
                console.log("[FreeTube-D1] Trả về " + d1Data.items.length + " phim từ D1 Master!");
                return htmlResponse;
            }
        } catch (eJson) {}

        // 2. Nếu D1 trống hoặc URL là web gốc (fallback cào web gốc & sync lên D1)
        var items = [];
        var seen = {};
        var metaRecords = [];

        // Danh sách phim nằm trong cột trái #page-info. Không quét toàn bộ
        // HTML vì cột phải cũng có các block class="item" (phim hot/liên quan).
        var sourceHtml = htmlResponse || "";
        var pageInfoStart = sourceHtml.search(/<div\b[^>]*\bid=["']page-info["'][^>]*>/i);
        var listHtml = pageInfoStart > -1 ? sourceHtml.substring(pageInfoStart) : "";
        if (listHtml) {
            // page-info là cột trái. Nếu right-content nằm cùng response thì
            // dừng trước nó, không được quét các card phim liên quan bên phải.
            var rightColumn = listHtml.search(/<div\b[^>]*class=["'][^"']*\bright-content\b[^"']*["'][^>]*>/i);
            if (rightColumn > -1) listHtml = listHtml.substring(0, rightColumn);
            console.log("[FreeTube] Giới hạn parse danh sách trong #page-info");
        } else {
            console.log("[FreeTube] Không thấy #page-info, dùng fallback toàn trang");
            listHtml = sourceHtml;
        }

        // Pattern card: <li class="item ..."> ... <a href="/phim/..."> ... <img ... src="..."> ... <div class="name"><span>...</span>
        var itemRegex = /<li[^>]*class=["'][^"']*item[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
        var m;
        while ((m = itemRegex.exec(listHtml)) !== null) {
            var block = m[1];
            var linkM = block.match(/<a[^>]+href=["'](\/phim\/[^"']+)["']/i) ||
                         block.match(/<a[^>]+href=["'](https?:\/\/freetube\.com\.mx\/phim\/[^"']+)["']/i);
            if (!linkM) continue;

            var fullUrl = linkM[1].indexOf("http") === 0 ? linkM[1] : (BASEURL + linkM[1]);
            var slug = fullUrl.replace(/https?:\/\/freetube\.com\.mx\/phim\//i, "").replace(/^\/+|\/+$/g, "");
            if (seen[slug]) continue;
            seen[slug] = true;

            var titleM = block.match(/<div[^>]*class=["']name["'][^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/i) ||
                         block.match(/title=["'](?:Xem phim\s*)?([^"']+)["']/i);
            var title = titleM ? cleanHtml(titleM[1]) : slug;

            var imgM = block.match(/<img[^>]+(?:src|data-original)=["']([^"']+)["']/i);
            var poster = imgM ? imgM[1] : "";
            if (poster && poster.indexOf("http") !== 0) {
                poster = BASEURL + (poster.indexOf("/") === 0 ? "" : "/") + poster;
            }

            var labelM = block.match(/<span[^>]*class=["']label["'][^>]*>([\s\S]*?)<\/span>/i);
            var quality = labelM ? cleanHtml(labelM[1]) : "Full HD";

            items.push({
                "id": fullUrl,
                "title": title,
                "posterUrl": poster,
                "backdropUrl": poster,
                "quality": quality,
                "episode_current": quality,
                "year": 2026
            });

            metaRecords.push({
                "plugin": PLUGIN_ID,
                "slug": slug,
                "title": title,
                "poster": poster,
                "category": "home",
                "has_detail": 0
            });
        }

        // Một số trang render card bằng div.item thay vì li.item.
        if (items.length === 0) {
            var divItemRegex = /<div[^>]*class=["'][^"']*\bitem\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
            while ((m = divItemRegex.exec(listHtml)) !== null) {
                var divBlock = m[1];
                var divLink = divBlock.match(/<a[^>]+href=["'](\/phim\/[^"']+)["']/i);
                if (!divLink) continue;
                var divFull = BASEURL + divLink[1];
                var divSlug = divLink[1].replace(/^\/phim\//i, "").replace(/^\/+|\/+$/g, "");
                if (seen[divSlug]) continue;
                seen[divSlug] = true;
                var divTitleM = divBlock.match(/title=["'](?:Xem phim\s*)?([^"']+)["']/i) || divBlock.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
                var divTitle = divTitleM ? cleanHtml(divTitleM[1]) : divSlug;
                var divImgM = divBlock.match(/<img[^>]+(?:src|data-original)=["']([^"']+)["']/i);
                var divPoster = divImgM ? divImgM[1] : "";
                if (divPoster && divPoster.indexOf("http") !== 0) divPoster = BASEURL + (divPoster.indexOf("/") === 0 ? "" : "/") + divPoster;
                var divLabelM = divBlock.match(/<span[^>]*class=["']label["'][^>]*>([\s\S]*?)<\/span>/i);
                var divQuality = divLabelM ? cleanHtml(divLabelM[1]) : "Full HD";
                items.push({ id: divFull, title: divTitle, posterUrl: divPoster, backdropUrl: divPoster, quality: divQuality, episode_current: divQuality, year: 2026 });
            }
        }

        // Fallback chắc chắn hơn: card có thể chứa nhiều div lồng nhau làm
        // regex div.item kết thúc quá sớm. Lấy từng link phim trong #page-info,
        // tuyệt đối không lấy link ngoài vùng này.
        if (items.length === 0) {
            var movieLinkRegex = /<a\b[^>]+href=["']((?:https?:\/\/freetube\.com\.mx)?\/phim\/[^"']+)["'][^>]*>/gi;
            var linkMatch;
            while ((linkMatch = movieLinkRegex.exec(listHtml)) !== null) {
                var href = linkMatch[1];
                var absolute = href.indexOf("http") === 0 ? href : BASEURL + href;
                var movieSlug = absolute.replace(/^https?:\/\/freetube\.com\.mx\/phim\//i, "").replace(/[?#].*$/, "");
                if (!movieSlug || seen[movieSlug]) continue;
                seen[movieSlug] = true;

                // Lấy một đoạn nhỏ quanh thẻ a, đủ chứa title/img của card.
                var blockStart = Math.max(0, linkMatch.index - 1200);
                var block = listHtml.substring(blockStart, Math.min(listHtml.length, linkMatch.index + 1800));
                var titleM = linkMatch[0].match(/title=["']([^"']+)["']/i) || block.match(/title=["'](?:Xem phim\s*)?([^"']+)["']/i);
                var movieTitle = titleM ? cleanHtml(titleM[1]) : movieSlug;
                var posterM = block.match(/<img[^>]+(?:src|data-original)=["']([^"']+)["']/i);
                var moviePoster = posterM ? posterM[1] : "";
                if (moviePoster && moviePoster.indexOf("http") !== 0) moviePoster = BASEURL + (moviePoster.indexOf("/") === 0 ? "" : "/") + moviePoster;
                var qualityM = block.match(/<span[^>]*class=["']label["'][^>]*>([\s\S]*?)<\/span>/i);
                var movieQuality = qualityM ? cleanHtml(qualityM[1]) : "Full HD";

                items.push({
                    "id": absolute,
                    "title": movieTitle,
                    "posterUrl": moviePoster,
                    "backdropUrl": moviePoster,
                    "quality": movieQuality,
                    "episode_current": movieQuality,
                    "year": 2026
                });
                metaRecords.push({
                    "plugin": PLUGIN_ID,
                    "slug": movieSlug,
                    "title": movieTitle,
                    "poster": moviePoster,
                    "category": "home",
                    "has_detail": 0
                });
            }
            if (items.length > 0) console.log("[FreeTube] Lấy " + items.length + " phim từ link trong #page-info");
        }

        // Một số response thay đổi wrapper nhưng vẫn có card phim. Giữ khả năng
        // tương thích cũ nếu vùng #page-info không chứa card nào.
        // Không fallback quét toàn trang khi đã có #page-info: làm vậy sẽ
        // đưa phim ở cột phải vào danh sách. Nếu cấu trúc trang không có card,
        // trả danh sách rỗng để không làm bẩn D1 bằng dữ liệu sai.

        // Tự động sync ngầm lên D1 nếu có kết quả từ web gốc
        if (metaRecords.length > 0 && typeof httpRequest === "function") {
            try {
                httpRequest(D1_API + "/api/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Sync-Key": "vax_auto_sync" },
                    body: JSON.stringify(metaRecords)
                });
                console.log("[FreeTube-D1] Đã sync ngầm " + metaRecords.length + " metadata lên D1!");
            } catch (errSync) {
                console.log("[FreeTube-D1] Sync ngầm lỗi: " + errSync);
            }
        }

        // Phân trang
        var totalPages = 1;
        var pMatches = listHtml.match(/href=['"][^'"]*\/the-loai\/[^\/]+-(\d+)['"]/gi);
        if (pMatches) {
            for (var i = 0; i < pMatches.length; i++) {
                var pNumM = pMatches[i].match(/-(\d+)['"]/);
                if (pNumM) {
                    var n = parseInt(pNumM[1], 10);
                    if (n > totalPages) totalPages = n;
                }
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": totalPages || 1 }
        });
    } catch (e) {
        console.log("[FreeTube] parseListResponse err: " + e);
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(htmlResponse, url) {
    return parseListResponse(htmlResponse, url);
}

function parseMovieDetail(htmlResponse, url) {
    try {
        console.log("[FreeTube] parseMovieDetail: " + url);

        // 1. Kiểm tra xem có phải JSON từ D1 hay không
        try {
            var d1Obj = JSON.parse(htmlResponse);
            if (d1Obj && d1Obj.servers && Array.isArray(d1Obj.servers) && d1Obj.servers.length > 0) {
                console.log("[FreeTube-D1] Trả về chi tiết từ D1 Master!");
                return htmlResponse;
            }
        } catch (eJson) {}

        // 2. Parse HTML từ web gốc
        var titleM = htmlResponse.match(/<span[^>]*class=["']title["'][^>]*>([\s\S]*?)<\/span>/i) ||
                     htmlResponse.match(/<h1[^>]*>[\s\S]*?<span[^>]*class=["']title["'][^>]*>([\s\S]*?)<\/span>/i) ||
                     htmlResponse.match(/<title>Xem phim ([^<]+?)(?: online|\s*-\s*Bluphim)/i);
        var title = titleM ? cleanHtml(titleM[1]) : "";

        var oriM = htmlResponse.match(/<span[^>]*class=["']real-name["'][^>]*>([\s\S]*?)<\/span>/i);
        var originName = oriM ? cleanHtml(oriM[1]) : "";

        var posterM = htmlResponse.match(/<div[^>]*class=["']poster["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
        var poster = posterM ? posterM[1] : "";
        if (poster && poster.indexOf("http") !== 0) {
            poster = BASEURL + (poster.indexOf("/") === 0 ? "" : "/") + poster;
        }

        var desM = htmlResponse.match(/<div[^>]*class=["']detail["'][^>]*>([\s\S]*?)<\/div>/i);
        var description = desM ? cleanHtml(desM[1]) : "";

        var year = 2026;
        var director = "";
        var casts = "";
        var category = "";
        var country = "";

        // Trích xuất metadata từ cặp <dt> và <dd>
        var dtRegex = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
        var dm;
        while ((dm = dtRegex.exec(htmlResponse)) !== null) {
            var dtText = cleanHtml(dm[1]).toLowerCase();
            var ddText = cleanHtml(dm[2]);
            if (dtText.indexOf("năm") > -1) {
                var yVal = parseInt(ddText, 10);
                if (yVal) year = yVal;
            } else if (dtText.indexOf("đạo diễn") > -1) {
                director = ddText;
            } else if (dtText.indexOf("diễn viên") > -1) {
                casts = ddText;
            } else if (dtText.indexOf("thể loại") > -1) {
                category = ddText;
            } else if (dtText.indexOf("quốc gia") > -1) {
                country = ddText;
            }
        }

        // 3. Trích xuất danh sách tập từ watch page (/xem-phim/...)
        // Nếu trang hiện tại là trang detail /phim/slug, cần fetch sang /xem-phim/slug
        var watchUrl = url.replace(/\/phim\//i, "/xem-phim/");
        var watchHtml = htmlResponse;
        if (url.indexOf("/xem-phim/") === -1 && typeof httpRequest === "function") {
            try {
                var wRes = httpRequest(watchUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": url
                    }
                });
                if (wRes && (wRes.body || wRes.text)) {
                    watchHtml = wRes.body || wRes.text;
                }
            } catch (wErr) {
                console.log("[FreeTube] Fetch watch page error: " + wErr);
            }
        }

        var episodesSv1 = [];
        var episodesSv2 = [];

        // Match các nút tập: <a ... href="/xem-phim/slug/tap-X" title="...">Tập X</a>
        var epRegex = /<a[^>]+href=["'](\/xem-phim\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        var em;
        var epSeen = {};
        while ((em = epRegex.exec(watchHtml)) !== null) {
            var epHref = em[1];
            var epName = cleanHtml(em[2]);

            // Bỏ qua các nút server và nút xem phim chính
            if (epName.indexOf("Server") > -1 || epName.indexOf("Xem phim") > -1 || epName === "") continue;
            if (epHref.indexOf("?") > -1) continue; // tránh url phụ

            var epFullUrl = BASEURL + epHref;
            if (epSeen[epFullUrl]) continue;
            epSeen[epFullUrl] = true;

            episodesSv1.push({
                "id": epFullUrl,
                "name": epName,
                "slug": epHref
            });

            episodesSv2.push({
                "id": epFullUrl + "?sv2=true",
                "name": epName,
                "slug": epHref + "?sv2=true"
            });
        }

        // Nếu là phim lẻ chỉ có 1 tập duy nhất
        if (episodesSv1.length === 0) {
            episodesSv1.push({
                "id": watchUrl,
                "name": "Full",
                "slug": "full"
            });
            episodesSv2.push({
                "id": watchUrl + (watchUrl.indexOf("?") > -1 ? "&sv2=true" : "?sv2=true"),
                "name": "Full",
                "slug": "full-sv2"
            });
        }

        var servers = [
            { "name": "Server Gốc", "episodes": episodesSv1 }
        ];
        if (episodesSv2.length > 0) {
            servers.push({ "name": "Server Dự Phòng", "episodes": episodesSv2 });
        }

        var resultJson = JSON.stringify({
            "id": url,
            "title": title,
            "originName": originName,
            "posterUrl": poster,
            "backdropUrl": poster,
            "description": description,
            "quality": "Full HD",
            "year": year,
            "rating": "5.0",
            "status": "HD",
            "category": category,
            "country": country,
            "episode_current": episodesSv1.length > 0 ? (episodesSv1.length + " tập") : "Full",
            "servers": servers,
            "duration": "",
            "casts": casts,
            "director": director,
            "extra": ""
        });

        // 4. LAZY SYNC LÊN D1 MASTER: Tự động lưu Full Detail lên Cloudflare D1
        try {
            var slugM = url.match(/\/phim\/([^\/\?#]+)/i) || url.match(/\/xem-phim\/([^\/\?#]+)/i);
            var realSlug = slugM ? slugM[1] : "";
            if (realSlug && typeof httpRequest === "function") {
                httpRequest(D1_API + "/api/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Sync-Key": "vax_auto_sync" },
                    body: JSON.stringify([{
                        "plugin": PLUGIN_ID,
                        "slug": realSlug,
                        "title": title,
                        "poster": poster,
                        "year": year,
                        "has_detail": 1,
                        "detail_json": resultJson
                    }])
                });
                console.log("[FreeTube-D1] Lazy sync Full Detail lên D1 cho: " + realSlug);
            }
        } catch (syncErr) {
            console.log("[FreeTube-D1] Lazy sync detail err: " + syncErr);
        }

        return resultJson;
    } catch (e) {
        console.log("[FreeTube] parseMovieDetail err: " + e);
        return JSON.stringify({ "id": url, "title": "Error", "servers": [] });
    }
}

// =============================================================================
// SUBTITLE & BASE64 HELPER
// =============================================================================

var BASE64 = {
    encode: function (str) {
        try {
            if (!str) return "";
            var utf8Bytes = [];
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i);
                if (code < 128) {
                    utf8Bytes.push(code);
                } else if (code < 2048) {
                    utf8Bytes.push((code >> 6) | 192, (code & 63) | 128);
                } else if (
                    (code & 0xfc00) === 0xd800 &&
                    i + 1 < str.length &&
                    (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00
                ) {
                    code = 0x10000 + ((code & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
                    utf8Bytes.push(
                        (code >> 18) | 240,
                        ((code >> 12) & 63) | 128,
                        ((code >> 6) & 63) | 128,
                        (code & 63) | 128
                    );
                } else {
                    utf8Bytes.push(
                        (code >> 12) | 224,
                        ((code >> 6) & 63) | 128,
                        (code & 63) | 128
                    );
                }
            }
            var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var encoded = "";
            var byte1, byte2, byte3;
            var b1, b2, b3, b4;
            for (var j = 0; j < utf8Bytes.length; j += 3) {
                byte1 = utf8Bytes[j];
                byte2 = j + 1 < utf8Bytes.length ? utf8Bytes[j + 1] : NaN;
                byte3 = j + 2 < utf8Bytes.length ? utf8Bytes[j + 2] : NaN;
                b1 = byte1 >> 2;
                b2 = ((byte1 & 3) << 4) | (isNaN(byte2) ? 0 : byte2 >> 4);
                b3 = isNaN(byte2) ? 64 : ((byte2 & 15) << 2) | (isNaN(byte3) ? 0 : byte3 >> 6);
                b4 = isNaN(byte3) ? 64 : byte3 & 63;
                encoded += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
            }
            return encoded;
        } catch (e) {
            return "";
        }
    }
};

function srtToVtt(srtText) {
    if (!srtText) return "";
    var t = String(srtText)
        .replace(/^\uFEFF/, "")
        .replace(/\r\n?/g, "\n");
    // Đổi dấu phẩy phân cách mili-giây sang dấu chấm
    t = t.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{1,3})/g, function (_, a, b) {
        return a + "." + (b + "000").slice(0, 3);
    });
    if (!/^WEBVTT/.test(t)) {
        t = "WEBVTT\n\n" + t.replace(/^\n+/, "");
    }
    return t;
}

function extractAyamaStream(embedUrl) {
    if (!embedUrl || typeof httpRequest !== "function") return null;
    try {
        var idMatch = embedUrl.match(/[?&]id=([a-f0-9]+)/i);
        if (!idMatch) return null;
        var videoId = idMatch[1];

        // 1. Tải HTML trang embed để lấy CDN endpoint (ví dụ: https://cdn5.wakanta.fun hoặc https://cdn5.nanani2.fun)
        var embedRes = httpRequest(embedUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": "https://freetube.com.mx/"
            }
        });
        var embedHtml = embedRes ? (embedRes.body || embedRes.text || "") : "";
        var cdnMatch = embedHtml.match(/var\s+cdn\s*=\s*['"]([^'"]+)['"]/i);
        var cdn = cdnMatch ? cdnMatch[1] : "https://cdn5.wakanta.fun";
        var streamingPath = "/streaming";
        var directThirdUrl = "";

        // embed3rd chứa thêm iframe CDN. Lấy đúng origin/path của iframe đó,
        // không dùng https://No trong JS placeholder.
        if (/\/embed3rd(?:\?|$)/i.test(embedUrl)) {
            var nestedM = embedHtml.match(/<iframe[^>]+src=['"]([^'"]*\/streaming3rd\?[^'"]+)['"]/i);
            if (nestedM) {
                var nestedUrl = nestedM[1].replace(/&amp;/g, "&");
                var nestedOrigin = nestedUrl.match(/^(https?:\/\/[^\/]+)/i);
                if (nestedOrigin) cdn = nestedOrigin[1];
                streamingPath = "/streaming3rd";
                directThirdUrl = nestedUrl;
                console.log("[FreeTube] Server 3rd CDN thực: " + nestedUrl);
            }
        }

        // Server thứ 3 có HTML trung gian với `var cdn = "https://No"`.
        // Không được biến nó thành URL thật rồi trả về https://No/segment/...
        // vì ExoPlayer sẽ báo UnknownHostException. Server này để fallback WebView.
        if (!cdn || /(?:^|\/\/)(?:no|undefined|null)(?:\/|$)/i.test(cdn)) {
            // Với embed3rd, server đôi khi trả `https://No`. Dùng origin của
            // trang embed hiện tại để tiếp tục handshake direct stream.
            var originM = embedUrl.match(/^(https?:\/\/[^\/]+)/i);
            cdn = originM ? originM[1] : "https://moviking.ayama.fun";
            console.log("[FreeTube] CDN không hợp lệ, dùng domain trang hiện tại: " + cdn);
        }

        // Server 3rd không dùng handshake /geturl của server gốc. Endpoint
        // streaming3rd trả về một trang player, cần bóc link media bên trong.
        if (directThirdUrl) {
            var thirdRes = httpRequest(directThirdUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": embedUrl,
                    "Origin": "https://moviking.ayama.fun"
                }
            });
            var thirdHtml = thirdRes ? (thirdRes.body || thirdRes.text || "") : "";
            var thirdUrlM = thirdHtml.match(/(?:file|url|source)\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/i) ||
                            thirdHtml.match(/(https?:\/\/[^\s"'<>]+(?:\.m3u8|\/segment\/)[^\s"'<>]*)/i);
            if (thirdUrlM) {
                var thirdDirect = thirdUrlM[1];
                if (thirdDirect.indexOf("+ videoId +") > -1) {
                    thirdDirect = thirdDirect.replace(/\s*\+\s*videoId\s*\+\s*/i, videoId);
                }
                thirdDirect = thirdDirect.replace(/https?:\/\/(?:no|undefined|null)(?=\/)/i, cdn);
                if (thirdDirect.indexOf(videoId) > -1 || /\.m3u8/i.test(thirdDirect)) {
                    console.log("[FreeTube] ✅ Direct stream server 3rd: " + thirdDirect);
                    return { url: thirdDirect, referer: cdn + "/", subtitles: [] };
                }
            }
            console.log("[FreeTube] Server 3rd chỉ trả HTML, chưa có direct media");
            return null;
        }

        // 2. Gửi multipart POST tới /geturl để lấy token1, token2, token3
        var boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
        var body = "--" + boundary + "\r\n" +
            'Content-Disposition: form-data; name="renderer"\r\n\r\n' +
            "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)\r\n" +
            "--" + boundary + "\r\n" +
            'Content-Disposition: form-data; name="id"\r\n\r\n' +
            "3c8a9f6d7e1b4a5c9d2e3f4a5b6c7d8e\r\n" +
            "--" + boundary + "\r\n" +
            'Content-Disposition: form-data; name="videoId"\r\n\r\n' +
            videoId + "\r\n" +
            "--" + boundary + "\r\n" +
            'Content-Disposition: form-data; name="domain"\r\n\r\n' +
            "https://freetube.com.mx/\r\n" +
            "--" + boundary + "--\r\n";

        var getUrlRes = httpRequest("https://moviking.ayama.fun/geturl", {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": embedUrl,
                "Content-Type": "multipart/form-data; boundary=" + boundary,
                "Origin": "https://moviking.ayama.fun"
            },
            body: body
        });
        var tokens = getUrlRes ? (getUrlRes.body || getUrlRes.text || "").trim() : "";
        if (!tokens || tokens.indexOf("token1=") === -1) {
            console.log("[FreeTube] geturl không trả về token hợp lệ: " + tokens);
            return null;
        }

        // 3. Gọi streaming URL để trích xuất m3u8 playlist URL và danh sách phụ đề
        var streamingUrl = cdn + streamingPath + "?id=" + videoId + "&subId=&web=freetube.com.mx&" + tokens + "&cdn=" + cdn + "&lang=vi";
        var streamRes = httpRequest(streamingUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": "https://moviking.ayama.fun/"
            }
        });
        var streamHtml = streamRes ? (streamRes.body || streamRes.text || "") : "";

        // URL trong mã nguồn streaming là: var url = 'https://cdn.../segment/' + videoId + '/?token1=...&token3=...'
        var directHlsUrl = "";
        var hlsPattern = streamHtml.match(/var\s+url\s*=\s*['"]([^'"]+)['"]\s*\+\s*videoId\s*\+\s*['"]([^'"]+)['"]/i);
        if (hlsPattern) {
            directHlsUrl = hlsPattern[1] + videoId + hlsPattern[2];
        } else {
            var simpleMatch = streamHtml.match(/var\s+url\s*=\s*['"](https?:\/\/[^'"]+)['"]/i);
            if (simpleMatch) directHlsUrl = simpleMatch[1];
        }

        // Một số template dùng https://No làm placeholder cho CDN thật.
        directHlsUrl = directHlsUrl.replace(
            /https?:\/\/(?:no|undefined|null)(?=\/)/i,
            cdn
        );

        // 4. Trích xuất phụ đề (chuyển SRT thô sang WebVTT Data URI Base64 cho ExoPlayer)
        var subtitles = [];
        var tracksMatch = streamHtml.match(/tracks:\s*(\[[\s\S]*?\])\s*,/);
        if (tracksMatch) {
            try {
                var tracks = JSON.parse(tracksMatch[1]);
                for (var i = 0; i < tracks.length; i++) {
                    var tr = tracks[i];
                    var label = tr.label || tr.kind || "Subtitle";
                    var subFileUrl = tr.file;

                    // Ưu tiên tải Vietnamese và English để chuyển sang WebVTT Base64
                    if (subFileUrl && (label === "Vietnamese" || label === "English" || tr.default === true)) {
                        try {
                            var subRes = httpRequest(subFileUrl, {
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                                    "Referer": cdn + "/"
                                }
                            });
                            var rawSrt = subRes ? (subRes.body || subRes.text || "") : "";
                            if (rawSrt && rawSrt.indexOf("-->") > -1) {
                                var vttContent = srtToVtt(rawSrt);
                                var b64Vtt = BASE64.encode(vttContent);
                                if (b64Vtt) {
                                    var dataVttUrl = "data:text/vtt;charset=utf-8;base64," + b64Vtt;
                                    subtitles.push({
                                        "url": dataVttUrl,
                                        "lang": label,
                                        "mimeType": "text/vtt"
                                    });
                                    console.log("[FreeTube] ✅ Đã encode sub WebVTT (" + label + ") thành công!");
                                    continue;
                                }
                            }
                        } catch (subErr) {
                            console.log("[FreeTube] Lỗi tải/encode sub " + label + ": " + subErr);
                        }
                    }

                    // Fallback gán link gốc nếu không fetch trực tiếp được
                    if (subFileUrl) {
                        subtitles.push({
                            "url": subFileUrl,
                            "lang": label,
                            "mimeType": "text/vtt"
                        });
                    }
                }
            } catch (trErr) {
                console.log("[FreeTube] Lỗi parse tracks: " + trErr);
            }
        }

        if (directHlsUrl && directHlsUrl.indexOf(videoId) > -1 &&
            !/(?:https?:\/\/)(?:no|undefined|null)(?:\/|$)/i.test(directHlsUrl)) {
            console.log("[FreeTube] ✅ Giải mã direct m3u8 thành công: " + directHlsUrl);
            return {
                url: directHlsUrl,
                referer: cdn + "/",
                subtitles: subtitles
            };
        }
    } catch (err) {
        console.log("[FreeTube] Lỗi extractAyamaStream: " + err);
    }
    return null;
}

function parseDetailResponse(htmlResponse, fallbackUrl, datasend) {
    try {
        console.log("[FreeTube] parseDetailResponse URL: " + fallbackUrl);

        // 1. Nếu là link dạng clbpx (?v=videoId) từ D1
        var vMatch = (fallbackUrl || "").match(/[?&]v=([a-zA-Z0-9_-]+)/);
        if (vMatch && vMatch[1]) {
            var stream = "https://abysscdn.com/?v=" + vMatch[1];
            console.log("[FreeTube] ✅ Stream Abyss MP4 từ D1: " + stream);
            return JSON.stringify({
                "url": stream,
                "mimeType": "video/mp4",
                "isEmbed": false,
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                "subtitles": []
            });
        }

        // 2. Trích xuất iframe embed từ HTML tập phim
        var ifm = (htmlResponse || "").match(/<iframe[^>]+src=["']([^"']+)["']/i);
        var embedUrl = ifm ? ifm[1].replace(/&amp;/g, "&") : "";

        if (embedUrl) {
            console.log("[FreeTube] Stream Embed URL: " + embedUrl);

            // Cố gắng giải mã direct m3u8 để Native ExoPlayer phát trực tiếp mượt mà
            if (embedUrl.indexOf("moviking.ayama.fun/embed") > -1) {
                var directStream = extractAyamaStream(embedUrl);
                if (directStream && directStream.url) {
                    return JSON.stringify({
                        "url": directStream.url,
                        "mimeType": "application/x-mpegURL",
                        "isEmbed": false,
                        "headers": {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                            "Referer": directStream.referer || "https://freetube.com.mx/"
                        },
                        "subtitles": directStream.subtitles || []
                    });
                }
            }

            // Fallback trả về embed nếu không giải mã được direct stream (cho WebView)
            return JSON.stringify({
                "url": embedUrl,
                "mimeType": "text/html",
                "isEmbed": true,
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Referer": "https://freetube.com.mx/"
                },
                "subtitles": []
            });
        }

        // 3. Direct m3u8 nếu có
        var m3u8M = (htmlResponse || "").match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i);
        if (m3u8M && m3u8M[1]) {
            return JSON.stringify({
                "url": m3u8M[1],
                "mimeType": "application/x-mpegURL",
                "isEmbed": false,
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Referer": "https://freetube.com.mx/"
                },
                "subtitles": []
            });
        }

        return JSON.stringify({
            "url": "https://vaxplugin.alokillgtv.workers.dev/blankvd.mp4",
            "mimeType": "video/mp4",
            "isEmbed": false,
            "headers": {},
            "subtitles": []
        });
    } catch (e) {
        console.log("[FreeTube] parseDetailResponse err: " + e);
        return JSON.stringify({
            "url": "https://vaxplugin.alokillgtv.workers.dev/blankvd.mp4",
            "mimeType": "video/mp4",
            "isEmbed": false,
            "headers": {},
            "subtitles": []
        });
    }
}


// =============================================================================
// JKHX / QuickJS Runtime Compatibility Adapter
// =============================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getHome: async function(filter, page = 1) {
            try {
                if (typeof getUrlList === 'function' && typeof parseListResponse === 'function') {
                    const slug = (typeof getHomeSections === 'function') ? (JSON.parse(getHomeSections())[0]?.slug || 'phim-moi') : 'phim-moi';
                    const url = getUrlList(slug, page);
                    const res = await globalThis.fetch(url, { headers: (typeof getManifest === 'function' ? JSON.parse(getManifest()).headers : {}) || { 'User-Agent': 'Mozilla/5.0' } });
                    const html = await res.text();
                    const raw = parseListResponse(html, slug, page);
                    const parsed = (typeof raw === 'string') ? JSON.parse(raw) : raw;
                    const list = parsed.items || parsed.movies || (Array.isArray(parsed) ? parsed : []);
                    return {
                        items: list.map(it => ({
                            id: it.slug || it.id,
                            name: it.title || it.name,
                            poster: it.poster || it.thumb || it.image,
                            year: it.year,
                            type: 'movie'
                        })),
                        hasMore: true
                    };
                }
            } catch (e) {
                console.error('[Adapter] getHome error:', e);
            }
            return { items: [], hasMore: false };
        },
        getStreams: async function(id, type, season, episode, context) {
            try {
                if (typeof getUrlDetail === 'function' && typeof parseDetailResponse === 'function') {
                    const url = getUrlDetail(id);
                    const headers = (typeof getManifest === 'function' ? JSON.parse(getManifest()).headers : {}) || { 'User-Agent': 'Mozilla/5.0' };
                    const res = await globalThis.fetch(url, { headers });
                    const html = await res.text();
                    const raw = parseDetailResponse(html, url, '');
                    const parsed = (typeof raw === 'string') ? JSON.parse(raw) : raw;
                    if (parsed && parsed.url) {
                        return [{
                            name: 'Direct Stream',
                            type: (parsed.mimeType && parsed.mimeType.includes('mpegURL')) ? 'm3u8' : 'mp4',
                            url: parsed.url,
                            headers: parsed.headers || headers,
                            subtitles: parsed.subtitles || []
                        }];
                    }
                }
            } catch (e) {
                console.error('[Adapter] getStreams error:', e);
                throw e;
            }
            throw new Error('Không thể phân giải stream từ plugin');
        }
    };
}
