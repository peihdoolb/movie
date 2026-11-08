var iddomain = "animevv"
BASEURL = "https://animevv.com";
NEWDOMAIN = true;
//var BASEURL = "https://animevv.com";
var popup_html = "";
var DEV = true;
function getManifest() {
  return JSON.stringify({
    id: "animevv",
    name: "Nguồn Animevv",
    description: "Nguồn phim Animevv...",
    "version": "2.4",
    info: "",
    "BASEURL": BASEURL,
    iconUrl: "https://vaxplugin.alokillgtv.workers.dev/img/icon/animevv.png",
    isEnabled: true,
    "adblock": false,
    type: "ANIME",
    "author": "Alokillgtv",
    
    playerType: "auto"
  });
}
// popup_html: popup_html,

function log(msg) {
  	console.log(msg);
}

if (NEWDOMAIN) {
    if (typeof httpRequest === "function") {
        var res = httpRequest("https://vaxplugin.alokillgtv.workers.dev/jsonStore/domain.json?debug=9780752&time=2323", {
            method: "POST"
        });
        if (res && res.isSuccessful) {
            var resobj = JSON.parse(res.body);
            if (resobj[iddomain]) {
                BASEURL = resobj[iddomain].new;
            }
        } 
    } 
} 
BASELINK = BASEURL;
console.log("BASEURL " + BASEURL);

function getHomeSections() {
    return JSON.stringify([
        {"slug": "/top","title": "Top Anime","type": "Horizontal"},
       {"slug": "/quoc-gia/Trung%20Qu%E1%BB%91c","title": "Trung Quốc","type": "Horizontal"},
       {"slug": "/quoc-gia/Nh%E1%BA%ADt%20B%E1%BA%A3n","title": "Nhật Bản","type": "Horizontal"},
        {"slug": "/moi-cap-nhat","title": "Phim Mới","type": "Grid"}
    ]);
}



function getPrimaryCategories() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("getPrimaryCategories[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function getFilterConfig() {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify({
            category: menulist
        });
    } catch (e) {
        log("getFilterConfig[err]:\n " + e);
        return JSON.stringify({ category: [] });
    }
}

function getUrlList(slug, filtersJson) {
    try {
        log("getUrlList[url]: \n" + slug);

        // 1. Kiểm tra nếu slug là link tuyệt đối (chứa http)
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }

        var page = 1;
        var path = slug || "";

        // 2. Xử lý an toàn filtersJson cho link tương đối
        if (filtersJson) {
            var fixedJson2 = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

            try {
                var filters = JSON.parse(fixedJson2);
                page = parseInt(filters.page) || 1;

                if (filters.category) {
                    if (Array.isArray(filters.category) && filters.category.length > 0) {
                        path = filters.category[0].slug;
                    } else if (typeof filters.category === 'string') {
                        path = filters.category;
                    }
                }
            } catch (jsonErr) {}
        }

        // 3. Ghép URL an toàn với BASEURL
        var resultUrl = BASEURL;
        
        if (path) {
            resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
        }

        // 4. Ghép tham số phân trang page (tự động nhận biết ? hay &)
        if (page > 0 && resultUrl.indexOf("page=") === -1) {
            resultUrl += "?page=" + page;
        }

        // 5. Làm sạch dấu // thừa ở path (giữ nguyên https://)
        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlList[err]:\n " + e);
        if (slug && slug.indexOf("http") > -1) {
            log("getUrlList[url]: \n" + slug);
            return slug;
        }
        var fallback = BASEURL + (slug ? (slug.indexOf("/") === 0 ? slug : "/" + slug) : "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlList[url]: \n" + finalFallback);
        return finalFallback;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var page = 1;

        // 1. Giải mã filtersJson lấy trang đúng chuẩn hàm gốc
        if (filtersJson) {
            var fixedJson = filtersJson
                .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
                .replace(/:,/g, ':');

            try {
                var filters = JSON.parse(fixedJson);
                page = parseInt(filters.page) || 1;
            } catch (jsonErr) {}
        }

        // 2. Khởi tạo URL tìm kiếm kèm cấu trúc /search?lang=vi-VN&q=
        var encodedKeyword = encodeURIComponent(keyword || "");
        var resultUrl = BASEURL + "/tim-kiem?q=" + encodedKeyword;

        // 3. Nếu page > 1 thì nối thêm &page=
        if (page > 1) {
            resultUrl += "&page=" + page;
        }

        var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalUrl);
        return finalUrl;

    } catch (e) {
        log("getUrlSearch[err]:\n " + e);
        var fallback = BASEURL + "/tim-kiem?q=" + encodeURIComponent(keyword || "");
        var finalFallback = fallback.replace(/([^:]\/)\/+/g, "$1");
        log("getUrlSearch[url]: \n" + finalFallback);
        return finalFallback;
    }
}
// http://vkey.vn/animevv
// /quoc-gia/M%E1%BB%B9
// /top
//filtersJson = "{page:5}"
//getUrlList("/top", filtersJson)
//getUrlSearch("girl", filtersJson)

function getUrlDetail(slug) {
    try {
        log("getUrlDetail[url]: \n" + slug);
        if (!slug) return "";
        if (slug.indexOf('http') === 0) return slug;
        var detailUrl = BASEURL + "/" + slug;
        log("getUrlDetail[url]: \n" + detailUrl);
        return detailUrl;
    } catch (e) {
        log("getUrlDetail[err]:\n " + e);
        return "";
    }
}

function getUrlCategories() { 
    try {
        log("getUrlCategories[url]: \n" + BASEURL);
        return BASEURL; 
    } catch (e) {
        log("getUrlCategories[err]:\n " + e);
        return "";
    }
}


function getUrlCountries() { 
    try {
        return ""; 
    } catch (e) {
        log("getUrlCountries[err]:\n " + e);
        return "";
    }
}

function getUrlYears() { 
    try {
        return ""; 
    } catch (e) {
        log("getUrlYears[err]:\n " + e);
        return "";
    }
}

// =============================================================================
// PARSERS
// =============================================================================


function parseListResponse(html, $url) {
    try {
        var $doc = _$(html);
        var json = $doc.find("script[type='application/json']").html();
        if (!json) throw new Error("Không tìm thấy script JSON");
        var $data = JSON.parse(json);

        // ✅ Defensive parsing — chấp nhận nhiều structure
        var listData = [];
        if ($data && $data.props) {
            var p = $data.props;

            if (p.results && Array.isArray(p.results.data))     listData = p.results.data;
            else if (Array.isArray(p.results))                  listData = p.results;
            else if (Array.isArray(p.items))                    listData = p.items;
            else if (Array.isArray(p.animes))                   listData = p.animes;
            else if (Array.isArray(p.data))                     listData = p.data;
            else {
                // Fallback: quét key nào là mảng có item hợp lệ
                for (var k in p) {
                    if (Array.isArray(p[k]) && p[k].length > 0) {
                        var first = p[k][0];
                        if (first && (first.slug || first.id || first.title)) {
                            listData = p[k];
                            break;
                        }
                    }
                }
            }
        }
        if (!Array.isArray(listData)) listData = [];

        var $items = [];
        listData.forEach(function(item) {
            var poster = BASEURL + (item.thumbnailOptimized || item.thumbnail || "");
            var background = item.backgroundOptimized
                ? BASEURL + item.backgroundOptimized
                : (item.background ? BASEURL + item.background : poster);
            var year = Number(item.year) || 2026;

            $items.push({
                "id":              BASEURL + "/anime/" + (item.slug || item.id || ""),
                "title":           item.title || item.name || "",
                "quality":         item.lastEpisodeName || "",
                "episode_current": item.statusEpisode || "",
                "posterUrl":       typeof poster === "string" ? poster : "",
                "backdropUrl":     typeof background === "string" ? background : "",
                "year":            year
            });
        });

        return JSON.stringify({
            "items": $items,
            "pagination": { "currentPage": 1, "totalPages": 9999 }
        });
    } catch (e) {
        log("parseListResponse[err]: " + e);
        return JSON.stringify({
            "items": [],
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    }
}

//html = sourceHTML;
// https://vicdn.cc/api/type/hoat-hinh/1
// https://vicdn.cc/?q=ta
//JSON.parse(parseListResponse(sourceHTML, "https://vicdn.cc/api/type/hoat-hinh/1"))

//$data = parseJSDataIsolated(script);
function parseSearchResponse(html, url) {
    try {
        log("parseSearchResponse[url]: \n" + url);
        return parseListResponse(html, url);
    } catch (e) {
        log("parseSearchResponse[err]:\n " + e);
        return JSON.stringify({
            "items": [],
            "pagination": {
                "currentPage": 1,
                "totalPages": 1
            }
        });
    }

function decodeHTMLEntities(str) {
}
    try {
        if (!str) return "";
        return str.replace(/&#(\d+);|&#x([0-9a-fA-F]+);/g, (match, dec, hex) => {
            if (dec) {
                return String.fromCharCode(parseInt(dec, 10));
            }
            if (hex) {
                return String.fromCharCode(parseInt(hex, 16));
            }
            return match;
        });
    } catch (e) {
        log("decodeHTMLEntities[err]:\n " + e);
    }
}

function parseMovieDetail(html, url) {
    try {
        log("parseMovieDetail[url]: \n" + url);
        // === BƯỚC 2: TRÍCH XUẤT THÔNG TIN PHIM ===
        var $doc = _$(html)
        var json = $doc.find("script[type='application/json']").html();
        var $data = JSON.parse(json);
        var anime = $data.props.anime;
        var slugVD = anime.slug;
        var poster = BASEURL + anime.backgroundOptimized;;
        var lname = anime.title;
        var ldes = anime.description;
        var ldirec = "";
        var lactor = "";
        var lduran = $doc.find(".items-center span:content('phút/tập')").text();
        var status = "Tập: " + anime.statusEpisode;
        var category = "";
        var merge = [];
        anime.genres.forEach(function(item) {
            merge.push("[" + item.name + "](/the-loai/" + item.slug + ")");
        })
        category = merge.join(", ");
        var episode_current = anime.lastEpisodeName;
        var year = Number(anime.year);
        var quality = "HD";
        var rating = anime.rating;
        var country = anime.country;
        var extra = "";
        var listEpi = $data.props.episodeGroups;
        var servers = [];
        listEpi.forEach(function(box, key) {
            var episodes = [];
            box.episodes.forEach(function(item) {
                episodes.push({
                    id: BASEURL + "/xem-phim/" + slugVD + "/" + item.watchKey,
                    name: item.name,
                    slug: "tap-" + item.slug
                })
            })
            servers.push({
                name: "Server " + (key + 1),
                episodes: episodes
            })
        })
        return JSON.stringify({
            id: url || "",
            title: lname || "",
            posterUrl: poster || "",
            backdropUrl: poster || "",
            description: ldes || "",
            quality: quality || "",
            year: year || "",
            rating: rating || "",
            status: status || "",
            category: category || "",
            episode_current: episode_current || "",
            servers: servers || "",
            duration: lduran || "",
            casts: lactor || "",
            director: ldirec || "",
            country: country || "",
            extra: extra || ""
        });

    } catch (e) {
        log("parseMovieDetail[err]:\n " + e);
        return JSON.stringify({
            id: url || url || "error",
            title: "error",
            servers: []
        });
    }
}

function parseDetailResponse(html, url, datasend) {
    console.log("[animevv] parseDetailResponse: " + url);

    // ============ 1. Kiểm tra nguồn trong Inertia page ============
    var sources = [];
    try {
        var im = html.match(/<script[^>]*data-page=["']app["'][^>]*>([\s\S]*?)<\/script>/);
        if (im) {
            var raw = im[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");
            var pageData = JSON.parse(raw);
            sources = (pageData.props || {}).sources || [];
        }
    } catch(e) {
        console.log("[animevv] parse sources err: " + e);
    }

    // Kiểm tra xem có nguồn Abyss không (type=embed hoặc label Abyss)
    var hasAbyss = false;
    for (var i = 0; i < sources.length; i++) {
        var s = sources[i];
        if (s.type === "embed" || /abyss/i.test(s.label || "") || /abyss/i.test(s.message || "")) {
            hasAbyss = true;
            break;
        }
    }

    // Nếu không có nguồn Abyss: không render / không phát tập này
    if (sources.length > 0 && !hasAbyss) {
        console.log("[animevv] Tập này không có nguồn Abyss -> bỏ qua không phát");
        return JSON.stringify({
            url: "https://vaxplugin.alokillgtv.workers.dev/blankvd.mp4",
            mimeType: "video/mp4",
            isEmbed: false,
            headers: {},
            subtitles: []
        });
    }

    // ============ 2. Trả về WebView ưu tiên nguồn Abyss ============
    return fallbackWebView(url);
}

function fallbackWebView(url) {
    return JSON.stringify({
        url: url,
        isEmbed: true,
        mimeType: "",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
            "Referer": BASEURL,
            "Block-Ads": false,
            "Block-Domains": "google.com,www.google.com,iz.shrikesanopias.cyou,073m.com,meatusbyway.cfd,podzols.lactoidhazansswagers.cyou,kr.hutchetcymblin.com,uv.pastfibres.cfd,tc.sovransbraws.com,googlesyndication.com,doubleclick.net,googleadservices.com,googletagmanager.com,google-analytics.com",
            "Custom-Js": runJS()
        },
        subtitles: []
    });
}

function makeStream(m3u8Url, referer) {
    console.log("🎬 Return stream: " + m3u8Url);
    return JSON.stringify({
        url: m3u8Url,
        mimeType: "application/x-mpegURL",
        isEmbed: false,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
            "Referer": referer || "https://abysscdn.com/",
            "Origin": "https://abysscdn.com"
        },
        subtitles: []
    });
}


function runJS() {
    return `(function(){
if (window.__vax_mse) return;
window.__vax_mse = 1;

// ═══════════════════════════════════════════════════════════════════
// 0. ƯU TIÊN NGUỒN ABYSS: Gán localStorage trước khi React khởi tạo
// ═══════════════════════════════════════════════════════════════════
try {
    localStorage.setItem("animevv:last-source-type:v2", "embed");
} catch(e){}

// Tự động tìm và click nút server Abyss nếu giao diện đã render
function selectAbyssButton() {
    try {
        var btns = document.querySelectorAll('button, a, div[role=button]');
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i];
            var txt = (b.textContent || b.innerText || '').toLowerCase();
            if (txt.indexOf('abyss') > -1) {
                if (!b.classList.contains('active') && !b.classList.contains('bg-')) {
                    b.click();
                }
                break;
            }
        }
    } catch(e){}
}
setInterval(selectAbyssButton, 500);

// Bắt iframe Abyss khi được load vào DOM
function checkAbyssIframe() {
    try {
        var iframes = document.querySelectorAll('iframe');
        for (var i = 0; i < iframes.length; i++) {
            var src = iframes[i].src || '';
            if (src && /abyss(cdn|player)?\.(com|to|net)|playhydrax\.com|zplayer\.io|short\.(ink|icu)/i.test(src)) {
                var vMatch = src.match(/[?&]v=([a-zA-Z0-9_-]+)/) || src.match(/abyssplayer\.com\/([a-zA-Z0-9_-]+)/);
                var abyssFinal = (vMatch && vMatch[1]) ? ('https://abysscdn.com/?v=' + vMatch[1]) : src;
                if (typeof SnifferBridge !== 'undefined' && SnifferBridge.play) {
                    SnifferBridge.play(abyssFinal, JSON.stringify({
                        "Referer": "https://abysscdn.com/",
                        "User-Agent": navigator.userAgent
                    }));
                }
                break;
            }
        }
    } catch(e){}
}
setInterval(checkAbyssIframe, 400);

// ═══════════════════════════════════════════════════════════════════
// 1. CHẶN CONSOLE WEB — dùng Object.defineProperty (mạnh hơn)
// ═══════════════════════════════════════════════════════════════════
try {
    var noop = function(){};
    var fakeConsole = {
        log: noop, warn: noop, error: noop, info: noop, debug: noop,
        trace: noop, dir: noop, table: noop, group: noop, groupEnd: noop,
        groupCollapsed: noop, time: noop, timeEnd: noop, timeLog: noop,
        assert: noop, count: noop, countReset: noop, clear: noop
    };
    try {
        Object.defineProperty(window, 'console', {
            get: function(){ return fakeConsole; },
            set: function(){},
            configurable: false,
            enumerable: true
        });
    } catch(e1) {
        try { window.console = fakeConsole; } catch(e2){}
    }
} catch(e){}

var G = function(m){ try{ SnifferBridge.log('[GUARD] '+m); }catch(e){} };
var L = function(m){ try{ SnifferBridge.log('[MSE] '+m); }catch(e){} };
G('install');

// ═══════════════════════════════════════════════════════════════════
// 2. GUARD CHỐNG REDIRECT (giữ tối thiểu)
// ═══════════════════════════════════════════════════════════════════
var ALLOWED = ['animevv.com','abysscdn.com','googlevideo.com','blogger.com','blogspot.com','googleusercontent.com','gstatic.com','googleapis.com'];
function isOk(u){
    if (!u) return true;
    if (u.indexOf('about:') === 0 || u.indexOf('blob:') === 0 || u.indexOf('data:') === 0) return true;
    if (u.charAt(0) === '/' || u.charAt(0) === '#') return true;
    for (var i = 0; i < ALLOWED.length; i++) if (u.indexOf(ALLOWED[i]) > -1) return true;
    return false;
}

try { window.open = function(u){ G('block open'); return null; }; } catch(e){}
try {
    var origAClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function(){
        if (!isOk(this.href)) { G('block a.click'); return; }
        return origAClick.apply(this, arguments);
    };
} catch(e){}
document.addEventListener('click', function(e){
    try {
        var a = e.target && e.target.closest ? e.target.closest('a') : null;
        if (a && a.href && !isOk(a.href)) {
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        }
    } catch(err){}
}, true);

// Watchdog chống redirect main frame
var ORIGIN = location.origin, ORIG_PATH = location.pathname + location.search;
var RESTORING = 0;
window.addEventListener('beforeunload', function(e){
    if (RESTORING) return;
    var cur = location.origin;
    if (cur && cur !== 'null' && cur !== ORIGIN && cur.indexOf('about:') === -1) {
        e.preventDefault(); e.returnValue = 'stay';
        G('beforeunload block');
        return 'stay';
    }
}, true);
setInterval(function(){
    try {
        var cur = location.origin;
        if (!cur || cur === 'null' || cur === ORIGIN) return;
        if (cur.indexOf('about:') === 0 || cur.indexOf('data:') === 0 || cur.indexOf('blob:') === 0) return;
        G('watchdog → restore');
        RESTORING = 1;
        try { location.replace(ORIGIN + ORIG_PATH); } catch(e){}
        setTimeout(function(){ RESTORING = 0; }, 500);
    } catch(e){}
}, 50);

G('guards ready');

// ═══════════════════════════════════════════════════════════════════
// 3. HOOK M3U8
// ═══════════════════════════════════════════════════════════════════
var done = 0;
var REFERER = 'https://www.blogger.com/';
var ORIGIN_HDR = 'https://www.blogger.com';

var WORKER = 'https://animevv.alokillgtv06.workers.dev';

// Chế độ phát:
//   "content" — gửi thẳng m3u8 raw cho native qua SnifferBridge.playM3u8Content
//               (nhanh, không tốn request worker, nhưng dính giới hạn bridge size)
//   "worker"  — POST m3u8 lên worker, nhận URL .m3u8, native tự fetch
//               (chậm hơn ~1 round-trip, nhưng chắc chắn với m3u8 lớn)
//   "auto"    — thử "content" trước, nếu m3u8 > 30KB thì dùng "worker"
var PLAY_MODE = "content";
var CONTENT_SIZE_LIMIT = 30 * 1024;

function send(m3u8, base){
    if (done) return;
    if (!m3u8 || m3u8.indexOf('#EXTM3U') !== 0) return;
    done = 1;

    L('MODE=' + PLAY_MODE + ' m3u8 len=' + m3u8.length);
    try { SnifferBridge.toast('Da bat link!', 2000); } catch(e){}

    // Dừng WebView player trước
    try {
        var vids = document.querySelectorAll('video');
        for (var vi = 0; vi < vids.length; vi++) {
            try { vids[vi].pause(); } catch(e){}
        }
    } catch(e){}

    // Chọn chế độ thực tế khi "auto"
    var mode = PLAY_MODE;
    if (mode === "auto") {
        mode = (m3u8.length > CONTENT_SIZE_LIMIT) ? "worker" : "content";
        L('AUTO → ' + mode);
    }

    if (mode === "content") {
        sendByContent(m3u8);
    } else {
        sendByWorker(m3u8);
    }
}

// ─── Chế độ 1: gửi m3u8 raw cho native ───
function sendByContent(m3u8) {
    L('CONTENT mode: sending raw m3u8');
    try {
        SnifferBridge.playM3u8Content(m3u8, location.href, JSON.stringify({
            'Referer': location.origin + '/',
            'Origin': location.origin,
            'User-Agent': navigator.userAgent
        }));
        L('CONTENT sent OK');
    } catch(e) {
        L('CONTENT err ' + e.message + ' → fallback worker');
        // Nếu content fail, tự chuyển sang worker
        sendByWorker(m3u8);
    }
}

// ─── Chế độ 2: POST m3u8 lên worker, nhận URL ───
function sendByWorker(m3u8) {
    L('WORKER mode: uploading m3u8');
    fetch(WORKER + '/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: m3u8
    }).then(function(r){ return r.json(); }).then(function(j){
        if (!j || !j.url) throw new Error('store failed');
        L('WORKER OK id=' + j.id);
        L('WORKER URL=' + j.url);

        try {
            SnifferBridge.play(j.url, JSON.stringify({
                'Referer': WORKER + '/',
                'User-Agent': navigator.userAgent
            }));
            L('WORKER sent OK');
        } catch(e) {
            L('WORKER play err ' + e.message);
        }
    }).catch(function(err){
        L('WORKER err ' + (err.message || err));

        // Fallback cuối: rewrite segment qua worker rồi gửi content
        try {
            var CR = String.fromCharCode(13), LF = String.fromCharCode(10);
            var norm = m3u8.split(CR + LF).join(LF).split(CR).join(LF);
            var lines = norm.split(LF);
            var out = [];
            for (var i = 0; i < lines.length; i++) {
                var t = lines[i].replace(/^\s+|\s+$/g, '');
                if (t.length > 0 && t.charAt(0) !== '#') {
                    out.push(WORKER + '/?u=' + encodeURIComponent(t));
                } else {
                    out.push(lines[i]);
                }
            }
            SnifferBridge.playM3u8Content(out.join(LF), WORKER + '/', JSON.stringify({
                'Referer': WORKER + '/',
                'User-Agent': navigator.userAgent
            }));
            L('WORKER fallback sent');
        } catch(e2) {
            L('WORKER fallback err ' + e2.message);
        }
    });
}

function isM3U8(s){
    if (typeof s !== 'string') return false;
    return s.trim().indexOf('#EXTM3U') === 0;
}

function findInBytes(bytes){
    try {
        var u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        var n = Math.min(u8.length, 4096);
        var head = '';
        for (var i = 0; i < n; i++) head += String.fromCharCode(u8[i]);
        if (head.indexOf('#EXTM3U') === 0 || head.indexOf('#EXTM3U') > -1) {
            var full = '';
            for (var j = 0; j < u8.length; j++) full += String.fromCharCode(u8[j]);
            return full;
        }
    } catch(e){}
    return null;
}

try {
    if (window.MediaSource) {
        var origAdd = MediaSource.prototype.addSourceBuffer;
        MediaSource.prototype.addSourceBuffer = function(mime){
            L('addSourceBuffer ' + mime);
            var sb = origAdd.apply(this, arguments);
            try {
                var origApp = sb.appendBuffer;
                sb.appendBuffer = function(buf){
                    try {
                        if (!done && buf) {
                            var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
                            var m = findInBytes(u8);
                            if (m) { L('MSE appendBuffer → m3u8'); send(m, REFERER); }
                        }
                    } catch(e){}
                    return origApp.apply(this, arguments);
                };
                L('hooked appendBuffer');
            } catch(e){}
            return sb;
        };
        L('hooked MediaSource');
    }
} catch(e){ L('ms err ' + e.message); }

try {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.decrypt) {
        var origDec = window.crypto.subtle.decrypt;
        window.crypto.subtle.decrypt = function(){
            var p = origDec.apply(this, arguments);
            if (p && p.then) {
                return p.then(function(buf){
                    try {
                        if (buf && !done) {
                            var m = findInBytes(buf);
                            if (m) { L('subtle.decrypt → m3u8'); send(m, REFERER); }
                        }
                    } catch(e){}
                    return buf;
                });
            }
            return p;
        };
        L('hooked subtle.decrypt');
    }
} catch(e){ L('subtle err ' + e.message); }

try {
    var origFetch = window.fetch;
    window.fetch = function(input){
        var url = (typeof input === 'string') ? input : ((input && input.url) || '');
        var p = origFetch.apply(this, arguments);
        if (!p || !p.then) return p;
        return p.then(function(resp){
            try {
                if (!done && resp) {
                    var ct = (resp.headers && resp.headers.get ? resp.headers.get('content-type') : '') || '';
                    if (ct.indexOf('mpegurl') > -1 || ct.indexOf('m3u') > -1) {
                        resp.clone().text().then(function(txt){
                            if (isM3U8(txt)) { L('fetch → m3u8'); send(txt, REFERER); }
                        }).catch(function(){});
                    }
                }
            } catch(e){}
            return resp;
        });
    };
    L('hooked fetch');
} catch(e){ L('fetch err ' + e.message); }

try {
    var origOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url){
        this.__url = url;
        return origOpen.apply(this, arguments);
    };
    var origSendX = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(){
        var xhr = this;
        xhr.addEventListener('load', function(){
            try {
                if (done) return;
                if (xhr.responseType === '' || xhr.responseType === 'text') {
                    var txt = xhr.responseText || '';
                    if (isM3U8(txt)) { L('xhr → m3u8'); send(txt, REFERER); }
                }
                if (xhr.responseType === 'arraybuffer' && xhr.response) {
                    var m = findInBytes(new Uint8Array(xhr.response));
                    if (m) { L('xhr arraybuffer → m3u8'); send(m, REFERER); }
                }
            } catch(e){}
        });
        return origSendX.apply(this, arguments);
    };
    L('hooked xhr');
} catch(e){ L('xhr err ' + e.message); }

try {
    if (window.Worker) {
        var OW = window.Worker;
        window.Worker = function(url, opts){
            L('new Worker ' + url);
            var w = new OW(url, opts);
            try {
                var origPost = w.postMessage;
                w.postMessage = function(){
                    try {
                        var msg = arguments[0];
                        if (typeof msg === 'string' && isM3U8(msg)) { L('worker post → m3u8'); send(msg, REFERER); }
                        else if (msg && typeof msg === 'object') {
                            var s = JSON.stringify(msg);
                            if (s.indexOf('#EXTM3U') > -1) {
                                var m = s.match(/#EXTM3U[\\s\\S]*/);
                                if (m) send(m[0].replace(/\\\\n/g, '\\n'), REFERER);
                            }
                        }
                    } catch(e){}
                    return origPost.apply(this, arguments);
                };
                w.addEventListener('message', function(ev){
                    try {
                        var d = ev.data;
                        if (typeof d === 'string' && isM3U8(d)) { L('worker msg → m3u8'); send(d, REFERER); }
                    } catch(e){}
                });
            } catch(e){}
            return w;
        };
        L('hooked Worker');
    }
} catch(e){ L('worker err ' + e.message); }

try {
    var origBlob = URL.createObjectURL;
    URL.createObjectURL = function(blob){
        var u = origBlob.apply(this, arguments);
        try {
            if (!done && blob instanceof Blob) {
                if (typeof blob.text === 'function') {
                    blob.text().then(function(t){
                        if (isM3U8(t)) { L('blob → m3u8'); send(t, REFERER); }
                    }).catch(function(){});
                } else {
                    var r = new FileReader();
                    r.onload = function(e){
                        if (isM3U8(e.target.result)) { L('blob → m3u8'); send(e.target.result, REFERER); }
                    };
                    r.readAsText(blob);
                }
            }
        } catch(e){}
        return u;
    };
    L('hooked createObjectURL');
} catch(e){ L('blob err ' + e.message); }

setTimeout(function(){
    try {
        var sels = ['button','[role=button]','.jw-icon-display','.jw-display-icon-container','[class*=play]'];
        var seen = {};
        for (var s = 0; s < sels.length; s++) {
            var all = document.querySelectorAll(sels[s]);
            for (var i = 0; i < all.length; i++) {
                var b = all[i];
                if (seen[b]) continue;
                seen[b] = 1;
                var r = b.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    L('click ' + (b.className || b.tagName).substring(0, 40));
                    try { b.click(); } catch(e){}
                }
            }
        }
    } catch(e){}
}, 4000);

setTimeout(function(){ if (!done) L('TIMEOUT 45s'); }, 45000);

L('ready');
})();`;
}






function parseCategoriesResponse(apiResponseJson) {
    try {
        var listurl = getLISTmenu();
        var menulist = buildMenu(listurl);
        return JSON.stringify(menulist);
    } catch (e) {
        log("parseCategoriesResponse[err]:\n " + e);
        return JSON.stringify([]);
    }
}

function parseCountriesResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseCountriesResponse[err]:\n " + e);
        return "[]";
    }
}

function parseYearsResponse(html) {
    try {
        return "[]";
    } catch (e) {
        log("parseYearsResponse[err]:\n " + e);
        return "[]";
    }
}


// https://vsmov.com/api/the-loai/hanh-dong
function getLISTmenu() {
    return `[{\"link\":\"/the-loai/anime-bo\",\"name\":\"Anime bộ\"},{\"link\":\"/the-loai/anime-le\",\"name\":\"Anime lẻ\"},{\"link\":\"/the-loai/hanh-dong\",\"name\":\"Action\"},{\"link\":\"/the-loai/phieu-luu\",\"name\":\"Adventure\"},{\"link\":\"/the-loai/anime-sap-chieu\",\"name\":\"Anime sắp chiếu\"},{\"link\":\"/the-loai/dong-tinh-nam\",\"name\":\"Boys Love\"},{\"link\":\"/the-loai/cartoon\",\"name\":\"Cartoon\"},{\"link\":\"/the-loai/co-trang\",\"name\":\"Cổ Trang\"},{\"link\":\"/the-loai/hai-huoc\",\"name\":\"Comedy\"},{\"link\":\"/the-loai/dien-loan\",\"name\":\"Dementia\"}]`;
}

function buildMenu(menuStr, type) { 
    var menuArray = JSON.parse(menuStr); 
    let menulist = []; 
    if (!menuArray || !Array.isArray(menuArray)) return menulist; 
    var typeStr = type !== undefined ? String(type).trim() : undefined; 
    for (var i = 0; i < menuArray.length; i++) { 
        var item = menuArray[i]; 
        if (!item) continue; 
        var link = item.link ? String(item.link).trim() : ""; 
        var name = item.name ? String(item.name).trim() : ""; 
        if (!link || !name) continue; 
        var menuItem = {}; 
        if (typeStr === "false") { 
            menuItem = { "slug": link, "title": name, "type": "Horizontal" }; 
        } else if (typeStr === "true") { 
            menuItem = { "slug": link, "title": name, "type": "Grid" }; 
        } else { 
            menuItem = { "slug": link, "name": name }; 
        } 
        menulist.push(menuItem); 
    } 
    return menulist; 
}

function _$(param) {
    // -------------------------------------------------------------
    // 1. HELPER PARSER & UTILS
    // -------------------------------------------------------------
    function parseHTML(htmlString) {
        let nodes = [];
        let root = { id: 0, tag: "ROOT", attrs: {}, childrenIds: [], parentId: null };
        nodes.push(root);

        try {
            let html = (htmlString || "").trim();
            if (!html) return { root, nodes };

            const VOID_TAGS = new Set(["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"]);
            let stack = [0];
            let tagRegex = /<(?:\/([a-zA-Z0-9_-]+)|([a-zA-Z0-9_-]+)([^>]*?)(\/)?)\s*>/g;
            
            let lastIndex = 0;
            let match;
            let maxIter = 50000;
            let iter = 0;

            while ((match = tagRegex.exec(html)) !== null && iter++ < maxIter) {
                let textBefore = html.slice(lastIndex, match.index).trim();
                let parentId = stack[stack.length - 1];

                if (textBefore) {
                    let textId = nodes.length;
                    nodes.push({ id: textId, tag: "#text", text: textBefore, attrs: {}, childrenIds: [], parentId: parentId });
                    nodes[parentId].childrenIds.push(textId);
                }

                lastIndex = tagRegex.lastIndex;
                let isCloseTag = !!match[1];
                let tagName = (match[1] || match[2] || "").toLowerCase();
                let attrStr = match[3] || "";
                let isSelfClosing = !!match[4] || VOID_TAGS.has(tagName);

                if (isCloseTag) {
                    for (let i = stack.length - 1; i > 0; i--) {
                        if (nodes[stack[i]].tag === tagName) {
                            stack.splice(i);
                            break;
                        }
                    }
                } else {
                    let attrs = {};
                    let attrRegex = /([a-zA-Z0-9_-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
                    let attrMatch;
                    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
                        attrs[attrMatch[1].toLowerCase()] = attrMatch[2] || attrMatch[3] || attrMatch[4] || "";
                    }

                    let nodeId = nodes.length;
                    let node = { id: nodeId, tag: tagName, attrs: attrs, childrenIds: [], parentId: parentId };
                    nodes.push(node);
                    nodes[parentId].childrenIds.push(nodeId);

                    if (!isSelfClosing) {
                        stack.push(nodeId);
                    }
                }
            }

            let remainingText = html.slice(lastIndex).trim();
            if (remainingText && stack.length > 0) {
                let parentId = stack[stack.length - 1];
                let textId = nodes.length;
                nodes.push({ id: textId, tag: "#text", text: remainingText, attrs: {}, childrenIds: [], parentId: parentId });
                nodes[parentId].childrenIds.push(textId);
            }
        } catch (err) {
            if (typeof window !== "undefined" && window.log) window.log("parseHTML error: " + err.message);
        }
        return { root, nodes };
    }

    function getNodeText(node, nodes, depth) {
        if (!node || (depth || 0) > 20) return "";
        if (node.tag === "#text") return node.text || "";
        let text = "";
        if (node.childrenIds) {
            for (let cid of node.childrenIds) {
                text += getNodeText(nodes[cid], nodes, (depth || 0) + 1) + " ";
            }
        }
        return text.trim();
    }

    // -------------------------------------------------------------
    // 2. QUERY ENGINE & SELECTOR MATCHING
    // -------------------------------------------------------------
    function matchSingleSelector(node, sel, nodes) {
        if (!node || node.tag === "#text" || node.tag === "ROOT") return false;

        let cleanSel = sel;
        
        // 1. Tách pseudo positional (:first, :last, :eq)
        cleanSel = cleanSel.replace(/:first|:last|:eq\([0-9]+\)/gi, "").trim();

        // 2. Tách pseudo :content(...)
        let pseudoContentArg = null;
        let contentMatch = cleanSel.match(/:content\((['"]?)(.*?)\1\)/i);
        if (contentMatch) {
            pseudoContentArg = contentMatch[2];
            cleanSel = cleanSel.replace(contentMatch[0], "").trim();
        }

        // 3. Khớp Selector gốc
        if (cleanSel && cleanSel !== "*") {
            let tagMatch = cleanSel.match(/^[a-zA-Z0-9_-]+/);
            if (tagMatch && node.tag !== tagMatch[0].toLowerCase()) return false;

            let idMatch = cleanSel.match(/#([a-zA-Z0-9_-]+)/);
            if (idMatch && (!node.attrs || node.attrs.id !== idMatch[1])) return false;

            // Class matching (hỗ trợ Tailwind)
            let classMatches = cleanSel.match(/\.([a-zA-Z0-9_\-\/\\:]+)/g);
            if (classMatches) {
                if (!node.attrs || !node.attrs.class) return false;
                let elClasses = node.attrs.class.split(/\s+/);
                for (let c of classMatches) {
                    let targetClass = c.substring(1);
                    if (!elClasses.includes(targetClass)) return false;
                }
            }

            let attrMatch = cleanSel.match(/\[([a-zA-Z0-9_-]+)(?:=['"]?(.*?)['"]?)?\]/);
            if (attrMatch) {
                let attrName = attrMatch[1].toLowerCase();
                let attrVal = attrMatch[2];
                if (!node.attrs || !(attrName in node.attrs)) return false;
                if (attrVal !== undefined && node.attrs[attrName] !== attrVal) return false;
            }
        }

        if (pseudoContentArg !== null) {
            let fullText = getNodeText(node, nodes, 0);
            let keywords = pseudoContentArg.split("|").map(k => k.trim().toLowerCase());
            let found = keywords.some(kw => fullText.toLowerCase().includes(kw));
            if (!found) return false;
        }

        return true;
    }

    function querySelectorAllSingleLevel(startNode, selector, nodes) {
        let results = [];
        function search(currentId, depth) {
            if (depth > 50) return;
            let current = nodes[currentId];
            if (!current) return;

            if (current.tag !== "ROOT" && current.tag !== "#text" && current.id !== startNode.id) {
                if (matchSingleSelector(current, selector, nodes)) {
                    results.push(current);
                }
            }
            if (current.childrenIds) {
                for (let cid of current.childrenIds) {
                    search(cid, depth + 1);
                }
            }
        }
        search(startNode.id, 0);

        if (selector.indexOf(":first") !== -1) return results.slice(0, 1);
        if (selector.indexOf(":last") !== -1) return results.slice(-1);
        
        let eqMatch = selector.match(/:eq\(([0-9]+)\)/i);
        if (eqMatch) {
            let idx = parseInt(eqMatch[1], 10);
            return results[idx] ? [results[idx]] : [];
        }

        return results;
    }

    function querySelectorAll(startNode, selector, nodes) {
        try {
            if (!startNode || !selector) return [];

            if (selector.indexOf(',') !== -1) {
                let groupSelectors = selector.split(',').map(s => s.trim());
                let resMap = new Map();
                for (let gSel of groupSelectors) {
                    let subRes = querySelectorAll(startNode, gSel, nodes);
                    for (let r of subRes) resMap.set(r.id, r);
                }
                return Array.from(resMap.values());
            }

            let spaceParts = selector.trim().split(/\s+/);
            if (spaceParts.length > 1) {
                let currentNodes = [startNode];
                for (let part of spaceParts) {
                    let nextLevelNodes = [];
                    let addedIds = new Set();
                    for (let cNode of currentNodes) {
                        let subResults = querySelectorAllSingleLevel(cNode, part, nodes);
                        for (let r of subResults) {
                            if (!addedIds.has(r.id)) {
                                addedIds.add(r.id);
                                nextLevelNodes.push(r);
                            }
                        }
                    }
                    currentNodes = nextLevelNodes;
                    if (currentNodes.length === 0) break;
                }
                return currentNodes;
            }

            return querySelectorAllSingleLevel(startNode, selector, nodes);
        } catch (err) {
            return [];
        }
    }

    // -------------------------------------------------------------
    // 3. MINIJQ CLASS CONSTRUCTOR & PROTOTYPE
    // -------------------------------------------------------------
    function MiniJQ(elements, nodesStore) {
        this.elements = Array.isArray(elements) ? elements : (elements ? [elements] : []);
        this.nodes = nodesStore || [];
        this.length = this.elements.length;
    }

    MiniJQ.prototype = {
        find: function(selector) {
            if (this.elements.length === 0) return new MiniJQ([], this.nodes);
            let matched = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                let res = querySelectorAll(el, selector, this.nodes);
                for (let r of res) {
                    if (!addedIds.has(r.id)) {
                        addedIds.add(r.id);
                        matched.push(r);
                    }
                }
            }
            return new MiniJQ(matched, this.nodes);
        },

        text: function() {
            if (this.elements.length === 0) return "";
            return getNodeText(this.elements[0], this.nodes, 0);
        },

        html: function() {
            if (this.elements.length === 0) return "";
            let self = this;
            let serialize = function(nodeId, depth) {
                if (depth > 20) return "";
                let node = self.nodes[nodeId];
                if (!node) return "";
                if (node.tag === "#text") return node.text || "";
                let attrs = Object.entries(node.attrs || {}).map(([k, v]) => ` ${k}="${v}"`).join("");
                let childrenHTML = (node.childrenIds || []).map(cid => serialize(cid, depth + 1)).join("");
                return `<${node.tag}${attrs}>${childrenHTML}</${node.tag}>`;
            };
            return (this.elements[0].childrenIds || []).map(cid => serialize(cid, 0)).join("");
        },

        attr: function(name, value) {
            if (value !== undefined) {
                for (let el of this.elements) {
                    if (el && el.tag !== "#text") {
                        if (!el.attrs) el.attrs = {};
                        el.attrs[name] = value;
                    }
                }
                return this;
            }
            if (this.elements.length === 0 || !this.elements[0].attrs) return "";
            return this.elements[0].attrs[name] || "";
        },

        each: function(callback) {
            if (typeof callback !== 'function') return this;
            this.elements.forEach((el, index) => {
                let jqEl = new MiniJQ([el], this.nodes);
                callback.call(jqEl, index, jqEl);
            });
            return this;
        },

        textAll: function(delimiter) {
            if (delimiter === undefined) delimiter = " ";
            let texts = [];
            for (let el of this.elements) {
                texts.push(getNodeText(el, this.nodes, 0));
            }
            return texts.join(delimiter);
        },

        first: function() {
            return new MiniJQ(this.elements.length > 0 ? [this.elements[0]] : [], this.nodes);
        },

        last: function() {
            return new MiniJQ(this.elements.length > 0 ? [this.elements[this.elements.length - 1]] : [], this.nodes);
        },

        eq: function(index) {
            return new MiniJQ(this.elements[index] ? [this.elements[index]] : [], this.nodes);
        },

        parent: function() {
            let parents = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                if (el && el.parentId !== null && el.parentId !== 0) {
                    let pNode = this.nodes[el.parentId];
                    if (pNode && !addedIds.has(pNode.id)) {
                        addedIds.add(pNode.id);
                        parents.push(pNode);
                    }
                }
            }
            return new MiniJQ(parents, this.nodes);
        },

        next: function() {
            let nexts = [];
            for (let el of this.elements) {
                if (!el || el.parentId === null) continue;
                let pNode = this.nodes[el.parentId];
                if (!pNode) continue;

                let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                let idx = siblings.findIndex(s => s.id === el.id);
                if (idx !== -1 && idx + 1 < siblings.length) {
                    nexts.push(siblings[idx + 1]);
                }
            }
            return new MiniJQ(nexts, this.nodes);
        },

        before: function() {
            let befores = [];
            for (let el of this.elements) {
                if (!el || el.parentId === null) continue;
                let pNode = this.nodes[el.parentId];
                if (!pNode) continue;

                let siblings = pNode.childrenIds.map(cid => this.nodes[cid]).filter(c => c && c.tag !== "#text");
                let idx = siblings.findIndex(s => s.id === el.id);
                if (idx > 0) {
                    befores.push(siblings[idx - 1]);
                }
            }
            return new MiniJQ(befores, this.nodes);
        },

        after: function() {
            return this.next();
        },

        closest: function(selector) {
            let matched = [];
            let addedIds = new Set();
            for (let el of this.elements) {
                let currParentId = el.parentId;
                let depth = 0;
                while (currParentId !== null && currParentId !== 0 && depth++ < 30) {
                    let curr = this.nodes[currParentId];
                    if (!curr) break;
                    if (matchSingleSelector(curr, selector, this.nodes)) {
                        if (!addedIds.has(curr.id)) {
                            addedIds.add(curr.id);
                            matched.push(curr);
                        }
                        break;
                    }
                    currParentId = curr.parentId;
                }
            }
            return new MiniJQ(matched, this.nodes);
        }
    };

    // -------------------------------------------------------------
    // 4. MAIN ENTRY POINT LOGIC FOR _$
    // -------------------------------------------------------------
    try {
        if (!param) return new MiniJQ([], []);
        if (param instanceof MiniJQ) return param;
        if (typeof param === "string") {
            let parsed = parseHTML(param);
            return new MiniJQ(parsed.root, parsed.nodes);
        }
        return new MiniJQ(param, []);
    } catch (err) {
        return new MiniJQ([], []);
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
