// =========================================================================
// THÔNG TIN NGUỒN PHIM & CẤU HÌNH (SOURCE CONFIGURATION)
// =========================================================================
var BASEURL = "https://api.phim4k.space";
var BASEAPI = "https://api.phim4k.space/rest-api";
var BASELINK = BASEURL;
var API_KEY = "bbbb411dea44849";
var CDN_BASE = "https://sv1.p4k.dpdns.org";
var HMAC_SECRET = "5e8d1b4f9c2a6e730b1f8d4a92c5e3d1";
var DYN_SECRET = "8zP2mN7xR4vW9bQ1eC5yU0sI6tO3pA4f";
var DYN_WORKER = "https://ltv.cryboiz.workers.dev/api/add";
var PHIM4K_TITLE_MAP = {};

function log(msg) {
  try { console.log("[saigonphim] " + msg); } catch (e) {}
}

function logShort(value, limit) {
  var s = String(value || "").replace(/\s+/g, " ");
  var n = limit || 240;
  return s.length > n ? s.slice(0, n) + "..." : s;
}

var PHIMAPI_BASE = "https://phimapi.com";
var PHIMAPI_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
};
var PHIM4K_HEADERS = {
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "api-key": API_KEY,
  "authorization": "Basic YWRtaW46MTIzNA==",
  "Origin": BASEURL,
  "Referer": BASEURL + "/"
};

var PHIMAPI_GENRES = {
  "1": "hanh-dong",
  "2": "phieu-luu",
  "3": "toi-pham",
  "5": "lich-su",
  "6": "chien-tranh",
  "7": "am-nhac",
  "8": "hai-huoc",
  "9": "chinh-kich",
  "11": "khoa-hoc-vien-tuong",
  "12": "bi-an",
  "13": "hoat-hinh",
  "14": "gia-dinh",
  "15": "kinh-di",
  "43": "chinh-kich",
  "75": "hinh-su",
  "83": "tvb",
  "130": "hanh-dong",
  "138": "kinh-di"
};

function phimApiPoster(path) {
  var s = String(path || "");
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return "https://phimimg.com/" + s.replace(/^\/+/, "");
}

function phimApiJson(url) {
  try {
    var res = httpRequest(url, { method: "GET", headers: PHIMAPI_HEADERS, timeout: 15000 });
    log("phimapi GET " + url + " status=" + (res && res.status) + " ok=" + !!(res && res.isSuccessful) + " len=" + (res && res.body ? String(res.body).length : 0));
    if (res && res.isSuccessful && res.body) return JSON.parse(res.body);
    log("phimapi empty/fail: " + logShort(res && res.body));
  } catch (e) { log("phimapi error: " + e); }
  return null;
}

function phimApiRawItems(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  var pools = [];
  function push(v) {
    if (Array.isArray(v) && v.length) pools.push(v);
  }
  push(json.items);
  if (json.data) {
    if (Array.isArray(json.data)) return json.data;
    push(json.data.items);
    push(json.data.movies);
    if (json.data.params) push(json.data.params.items);
  }
  if (json.params) push(json.params.items);
  return pools.length ? pools[0] : [];
}

function phimApiPageOf(url) {
  var m = String(url || "").match(/[?&]page=(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}

function phimApiUrlForSource(sourceUrl, page) {
  var s = String(sourceUrl || "");
  var p = parseInt(page, 10) || 1;
  var qm = s.match(/[?&]q=([^&]*)/);
  if (s.indexOf("/search") >= 0 && qm) {
    var q = "";
    try { q = decodeURIComponent(qm[1]); } catch (e) { q = qm[1]; }
    return PHIMAPI_BASE + "/v1/api/tim-kiem?keyword=" + encodeURIComponent(q) + "&limit=24&page=" + p;
  }
  var gm = s.match(/content_by_genre_id[?&]id=(\d+)/i);
  if (gm) {
    var genreId = gm[1];
    if (genreId === "18") return PHIMAPI_BASE + "/v1/api/danh-sach/phim-bo?page=" + p + "&limit=24";
    var genre = PHIMAPI_GENRES[genreId];
    if (genre) return PHIMAPI_BASE + "/v1/api/the-loai/" + genre + "?page=" + p + "&limit=24";
  }
  if (/tvseries|phim-bo/i.test(s)) return PHIMAPI_BASE + "/v1/api/danh-sach/phim-bo?page=" + p + "&limit=24";
  if (/top_views|phim-moi/i.test(s)) return PHIMAPI_BASE + "/danh-sach/phim-moi-cap-nhat-v3?page=" + p;
  if (/\/movies|phim-le/i.test(s)) return PHIMAPI_BASE + "/v1/api/danh-sach/phim-le?page=" + p + "&limit=24";
  return PHIMAPI_BASE + "/danh-sach/phim-moi-cap-nhat-v3?page=" + p;
}

function phimApiPagination(json, page) {
  var p = (json && json.pagination) ||
          (json && json.data && json.data.params && json.data.params.pagination) ||
          (json && json.data && json.data.pagination) || {};
  var per = parseInt(p.totalItemsPerPage || p.itemsPerPage, 10) || 24;
  var total = parseInt(p.totalItems, 10) || 0;
  var totalPages = parseInt(p.totalPages, 10) || (total ? Math.ceil(total / per) : 9999);
  return {
    currentPage: parseInt(p.currentPage, 10) || parseInt(page, 10) || 1,
    totalPages: Math.max(1, totalPages),
    totalItems: total,
    itemsPerPage: per
  };
}

function phimApiMapItem(item) {
  if (!item) return null;
  var slug = String(item.slug || "").trim();
  if (!slug) return null;
  var title = String(item.name || item.origin_name || "").replace(/<[^>]*>/g, "").trim();
  if (!title) return null;
  return {
    id: PHIMAPI_BASE + "/phim/" + encodeURIComponent(slug),
    title: title,
    posterUrl: phimApiPoster(item.poster_url || item.thumb_url || ""),
    backdropUrl: phimApiPoster(item.thumb_url || item.poster_url || ""),
    year: item.year || "",
    quality: item.quality || "",
    episode_current: item.episode_current || "",
    lang: item.lang || ""
  };
}

function phimApiListJson(json, sourceUrl) {
  if (!json) return "";
  var page = phimApiPageOf(sourceUrl);
  var raw = phimApiRawItems(json);
  if (!raw.length) return "";
  var items = [];
  for (var i = 0; i < raw.length; i++) {
    var mapped = phimApiMapItem(raw[i]);
    if (mapped) items.push(mapped);
  }
  if (!items.length) return "";
  return JSON.stringify({
    items: items,
    pagination: phimApiPagination(json, page)
  });
}

function phimApiFallbackList(sourceUrl) {
  var page = phimApiPageOf(sourceUrl);
  var target = /phimapi\.com/i.test(String(sourceUrl || "")) ? sourceUrl : phimApiUrlForSource(sourceUrl, page);
  log("phimapi list fallback source=" + sourceUrl + " target=" + target);
  var json = phimApiJson(target);
  if (!json) return "";
  var raw = phimApiRawItems(json);
  if (!raw.length && target.indexOf("tim-kiem") < 0 && target.indexOf("phim-moi-cap-nhat-v3") < 0) {
    target = PHIMAPI_BASE + "/danh-sach/phim-moi-cap-nhat-v3?page=" + page;
    log("phimapi list fallback retry=" + target);
    json = phimApiJson(target);
    raw = json ? phimApiRawItems(json) : [];
  }
  if (!raw.length) {
    log("phimapi list fallback empty");
    return "";
  }
  var out = phimApiListJson(json, target);
  log("phimapi list fallback result=" + (out ? "ok" : "empty"));
  return out;
}

function phimApiSlugify(title) {
  var s = String(title || "");
  s = s.replace(/\s*\(\d{4}\)\s*/g, " ");
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {}
  s = s.replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  s = s.replace(/[^a-z0-9\s-]/g, " ");
  s = s.replace(/[\s-]+/g, "-").replace(/^-+|-+$/g, "");
  return s;
}

function phimApiNorm(title) {
  var s = String(title || "");
  try {
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch (e) {}
  s = s.replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  return s.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function phimApiScore(a, b) {
  var x = phimApiNorm(a);
  var y = phimApiNorm(b);
  if (!x || !y) return 0;
  if (x === y) return 100;
  var wa = x.split(" ").filter(function (w) { return w.length > 1; });
  var wb = y.split(" ").filter(function (w) { return w.length > 1; });
  if (!wa.length || !wb.length) return 0;
  var set = {};
  for (var i = 0; i < wb.length; i++) set[wb[i]] = true;
  var hit = 0;
  for (var j = 0; j < wa.length; j++) if (set[wa[j]]) hit++;
  return hit / Math.max(wa.length, wb.length) * 100;
}

function phimApiTrySlug(slug) {
  if (!slug) return null;
  var json = phimApiJson(PHIMAPI_BASE + "/phim/" + encodeURIComponent(slug));
  if (json && json.movie) return json;
  return null;
}

function phimApiFindByTitle(title) {
  var base = phimApiSlugify(title);
  if (!base) return null;
  var candidates = [base];
  var ym = String(title || "").match(/\((\d{4})\)/);
  if (ym) candidates.push(base + "-" + ym[1]);
  for (var i = 0; i < candidates.length; i++) {
    var found = phimApiTrySlug(candidates[i]);
    if (found) return found;
  }
  var keyword = String(title || "").replace(/\s*\(\d{4}\)\s*/g, " ").trim();
  if (!keyword) keyword = base;
  var json = phimApiJson(PHIMAPI_BASE + "/v1/api/tim-kiem?keyword=" + encodeURIComponent(keyword) + "&limit=10");
  var items = phimApiRawItems(json);
  if (!items.length) return null;
  var best = null;
  var bestScore = 0;
  for (var j = 0; j < items.length; j++) {
    var score = phimApiScore(title, items[j] && items[j].name);
    if (score > bestScore) {
      bestScore = score;
      best = items[j];
    }
  }
  if (!best || !best.slug) return null;
  return phimApiTrySlug(best.slug);
}

function phimApiSlugFromUrl(url) {
  var s = String(url || "");
  var m = s.match(/phimapi\.com\/phim\/([^?&#/]+)/i);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }
  var q = s.match(/[?&]vx_slug=([^&]*)/);
  if (q) {
    try { return decodeURIComponent(q[1]); } catch (e) { return q[1]; }
  }
  return "";
}

function phimApiTitleFromUrl(url) {
  var s = String(url || "");
  var m = s.match(/[?#&]vx_title=([^&]*)/);
  if (m) {
    try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
  }
  var clean = s.replace(/#.*$/, "");
  if (PHIM4K_TITLE_MAP[clean]) return PHIM4K_TITLE_MAP[clean];
  var path = clean.replace(/^https?:\/\/[^/]+/, "");
  if (PHIM4K_TITLE_MAP[path]) return PHIM4K_TITLE_MAP[path];
  return "";
}

function isPhim4kUrl(url) {
  return /api\.phim4k\.space\/rest-api\/v130\//i.test(String(url || ""));
}

function isPhimApiUrl(url) {
  return /phimapi\.com\//i.test(String(url || ""));
}

function phimApiHasPlayable(servers) {
  if (!Array.isArray(servers)) return false;
  for (var i = 0; i < servers.length; i++) {
    if (servers[i] && Array.isArray(servers[i].episodes) && servers[i].episodes.length) return true;
  }
  return false;
}

function phimApiDetailJson(json, url) {
  if (!json || !json.movie) return "";
  var movie = json.movie;
  var episodes = json.episodes || [];
  var servers = [];
  for (var i = 0; i < episodes.length; i++) {
    var server = episodes[i] || {};
    var rows = server.server_data || [];
    var list = [];
    for (var j = 0; j < rows.length; j++) {
      var ep = rows[j] || {};
      var link = ep.link_m3u8 || ep.link_embed || "";
      if (!link) continue;
      list.push({
        name: ep.name || ep.slug || ("Tập " + (list.length + 1)),
        slug: ep.slug || "",
        id: link
      });
    }
    if (list.length) servers.push({ name: "Nguồn dự phòng", episodes: list });
  }
  if (!phimApiHasPlayable(servers)) return "";
  var category = Array.isArray(movie.category) ? movie.category.map(function (c) { return c.name; }).join(", ") : "";
  var country = Array.isArray(movie.country) ? movie.country.map(function (c) { return c.name; }).join(", ") : "";
  var director = Array.isArray(movie.director) ? movie.director.join(", ") : (movie.director || "");
  var casts = Array.isArray(movie.actor) ? movie.actor.join(", ") : (movie.actor || "");
  var rating = 0;
  if (movie.tmdb && movie.tmdb.vote_average) rating = movie.tmdb.vote_average;
  else if (movie.imdb && movie.imdb.vote_average) rating = movie.imdb.vote_average;
  return JSON.stringify({
    id: url || "",
    title: movie.name || "",
    originName: movie.origin_name || "",
    posterUrl: phimApiPoster(movie.poster_url || movie.thumb_url || ""),
    backdropUrl: phimApiPoster(movie.thumb_url || movie.poster_url || ""),
    description: String(movie.content || "").replace(/<[^>]*>/g, ""),
    quality: movie.quality || "",
    year: movie.year || "",
    rating: rating ? String(rating) : "",
    status: movie.status || "",
    category: category,
    episode_current: movie.episode_current || "",
    servers: servers,
    duration: movie.time || "",
    casts: casts,
    director: director,
    country: country,
    lang: movie.lang || ""
  });
}

function phimApiDetailUrlFromTitle(url) {
  var slug = phimApiSlugFromUrl(url);
  if (slug) return PHIMAPI_BASE + "/phim/" + encodeURIComponent(slug);
  var title = phimApiTitleFromUrl(url);
  if (!title) return "";
  var json = phimApiFindByTitle(title);
  if (json && json.movie && json.movie.slug) return PHIMAPI_BASE + "/phim/" + encodeURIComponent(json.movie.slug);
  return "";
}

function phimApiFallbackDetail(url) {
  var slug = phimApiSlugFromUrl(url);
  var title = phimApiTitleFromUrl(url);
  log("phimapi detail fallback url=" + url + " slug=" + slug + " title=" + title);
  var json = slug ? phimApiTrySlug(slug) : null;
  if (!json && title) json = phimApiFindByTitle(title);
  if (!json) {
    log("phimapi detail fallback not found");
    return "";
  }
  var out = phimApiDetailJson(json, url);
  log("phimapi detail fallback result=" + (out ? "ok" : "no-stream"));
  return out;
}

function phim4kDetailFatal(data) {
  if (!data || typeof data !== "object") return true;
  if (data.status === false || data.success === false || data.error) return true;
  var st = String(data.status || "").toLowerCase();
  if (st === "error" || st === "fail" || st === "failed") return true;
  if (!data.title && !data.name) return true;
  if (/maintenance|bảo trì|internal server/i.test(String(data.message || "")) && !data.videos && !data.season) return true;
  return false;
}

function phim4kListBad(data) {
  if (!data || typeof data !== "object") return true;
  if (data.status === false || data.success === false || data.error) return true;
  var st = String(data.status || "").toLowerCase();
  if (st === "error" || st === "fail" || st === "failed") return true;
  var msg = String(data.message || data.msg || "").toLowerCase();
  if (/maintenance|bảo trì|tạm đóng|internal server|service unavailable/.test(msg)) return true;
  return false;
}

function phim4kHasAnyItem(data) {
  if (!data) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (Array.isArray(data.movie) && data.movie.length) return true;
  if (Array.isArray(data.tvseries) && data.tvseries.length) return true;
  if (Array.isArray(data.movies) && data.movies.length) return true;
  if (Array.isArray(data.items) && data.items.length) return true;
  if (data.data) {
    if (Array.isArray(data.data)) return data.data.length > 0;
    if (Array.isArray(data.data.items) && data.data.items.length) return true;
    if (Array.isArray(data.data.movie) && data.data.movie.length) return true;
    if (Array.isArray(data.data.tvseries) && data.data.tvseries.length) return true;
    if (Array.isArray(data.data.movies) && data.data.movies.length) return true;
  }
  return false;
}

function phim4kProbeList(url) {
  if (typeof httpRequest !== "function") return true;
  try {
    var res = httpRequest(url, { method: "GET", headers: PHIM4K_HEADERS, timeout: 10000 });
    var body = res && res.body ? String(res.body) : "";
    log("phim4k probe list url=" + url + " status=" + (res && res.status) + " ok=" + !!(res && res.isSuccessful) + " len=" + body.length + " prefix=" + logShort(body));
    if (!res || !res.isSuccessful || !body) return false;
    var json = JSON.parse(body);
    if (phim4kListBad(json) || !phim4kHasAnyItem(json)) return false;
    return true;
  } catch (e) {
    log("phim4k probe list error: " + e);
    return false;
  }
}

function phim4kProbeDetail(url) {
  if (typeof httpRequest !== "function") return true;
  try {
    var res = httpRequest(url, { method: "GET", headers: PHIM4K_HEADERS, timeout: 10000 });
    var body = res && res.body ? String(res.body) : "";
    log("phim4k probe detail url=" + url + " status=" + (res && res.status) + " ok=" + !!(res && res.isSuccessful) + " len=" + body.length + " prefix=" + logShort(body));
    if (!res || !res.isSuccessful || !body) return false;
    var json = JSON.parse(body);
    if (phim4kDetailFatal(json)) return false;
    var hasVideo = Array.isArray(json.videos) && json.videos.length > 0;
    var hasSeason = Array.isArray(json.season) && json.season.some(function (s) { return s && Array.isArray(s.episodes) && s.episodes.length; });
    return hasVideo || hasSeason;
  } catch (e) {
    log("phim4k probe detail error: " + e);
    return false;
  }
}

function phimApiStreamJson(url) {
  var link = String(url || "");
  var mime = /\.m3u8(\?|$)/i.test(link) ? "application/x-mpegURL" : (/\.mkv(\?|$)/i.test(link) ? "video/x-matroska" : "video/mp4");
  var skipTimes = mime === "application/x-mpegURL" ? [{ start: 890, end: 935, type: "ad" }] : [];
  return JSON.stringify({
    url: link,
    mimeType: mime,
    isEmbed: false,
    skipTimes: skipTimes,
    headers: {
      "User-Agent": PHIMAPI_HEADERS["User-Agent"],
      "Referer": "https://phimapi.com/",
      "Origin": "https://phimapi.com"
    },
    subtitles: []
  });
}

var PHIM4K_READY = null;
var USE_PHIMAPI = false;

function phim4kCheck() {
  if (typeof httpRequest !== "function") {
    PHIM4K_READY = null;
    log("phim4k startup check skipped: httpRequest unavailable");
    return null;
  }
  var url = BASEURL + "/rest-api/v130/movies?page=1";
  try {
    var res = httpRequest(url, { method: "GET", headers: PHIM4K_HEADERS, timeout: 5000 });
    var body = res && res.body ? String(res.body) : "";
    log("phim4k startup check url=" + url + " status=" + (res && res.status) + " ok=" + !!(res && res.isSuccessful) + " len=" + body.length + " prefix=" + logShort(body));
    if (!res || !res.isSuccessful || !body) {
      PHIM4K_READY = false;
      return false;
    }
    var json = JSON.parse(body);
    PHIM4K_READY = !phim4kListBad(json) && phim4kHasAnyItem(json);
    log("phim4k startup ready=" + PHIM4K_READY);
    return PHIM4K_READY;
  } catch (e) {
    PHIM4K_READY = false;
    log("phim4k startup error: " + e);
    return false;
  }
}

function phim4kReady() {
  if (PHIM4K_READY === null) phim4kCheck();
  return PHIM4K_READY;
}

try {
  phim4kCheck();
  USE_PHIMAPI = PHIM4K_READY === false;
  log("phim4k mode=" + (USE_PHIMAPI ? "phimapi" : "phim4k"));
} catch (e) {
  log("phim4k init error: " + e);
}

function getManifest() {
  try {
    return JSON.stringify({
      "id": "saigonphim",
      "name": "[MOVIE] Sài Gòn Phim",
      "version": "1.5.2",
      "author": "Alokillgtv",
      "BASEURL": BASEURL,
      "baseUrl": BASEURL,
      "headers": {
        "API-KEY": API_KEY,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      "iconUrl": "https://vaxplugin.alokillgtv.workers.dev/img/saigonphim.png",
      "isEnabled": true,
      "isAdult": false,
      "adblock": false,
      "type": "MOVIE",
      "subtitleCat": false,
      "playerType": "exoplayer"
    });
  }
  catch(e){
    // VERTICAL
    return JSON.stringify({
      "id": "loiapp",
      "name": "Plugin bị lỗi cài đặt",
      "version": "1.0",
      "info": "Plugin đang bị lỗi: \n" + e,
      "baseUrl": "http://vkey.vn/",
      "iconUrl": "https://raw.githubusercontent.com/alokillgtv03/vaxplugins/main/img/novahd.png",
      "isEnabled": true,
      "type": "MOVIE",
      "playerType": "exoplayer"
     });
  }
}

// ===== HÀM MENU LIST BEGIN ======
// Tạo List phim ở menu Home
  function getHomeSections() {
      return JSON.stringify([
          {"slug": "/rest-api/v130/movies","title": "Phim Lẻ","type": "Horizontal"},
          {"slug": "/rest-api/v130/tvseries","title": "TV Show","type": "Horizontal"},
          {"slug": "/rest-api/v130/top_views?period=day&type=all&limit=20","title": "Phim Mới","type": "Grid"},
      ]);
  }
  
  // Hàm khởi tạo thẻ chủ đề
  function getLISTmenu() {
    try{
      return `[{
    "link": "/rest-api/v130/content_by_genre_id?id=1",
    "name": "Action"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=2",
    "name": "Adventure"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=3",
    "name": "Crime"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=5",
    "name": "History"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=6",
    "name": "War"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=7",
    "name": "Music"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=8",
    "name": "Comedy"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=9",
    "name": "Drama"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=11",
    "name": "Science Fiction"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=12",
    "name": "Mystery"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=13",
    "name": "Animation"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=14",
    "name": "Family"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=15",
    "name": "Horror"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=18",
    "name": "TV Series"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=43",
    "name": "Drama"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=75",
    "name": "Criminal"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=83",
    "name": "TVB"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=130",
    "name": "Action & Adventure"
}, {
    "link": "/rest-api/v130/content_by_genre_id?id=138",
    "name": "Horror"
}]`;
    } catch(e){
      log("getLISTmenu[err]:\n " + e);
      return `[
        {"link":"/","name":"getLISTmenu() error"},
      ]`;
    }
  }
// ===== HÀM MENU LIST END ======

// ===== HÀM TẠO URL BEGIN ======
  function getUrlList(slug, filtersJson) {
      log("getUrlList slug=" + slug + " filters=" + filtersJson);
      var paramPage = "page=";
      try {
          //log("getUrlList[url]: \n" + slug);
          if (slug && slug.indexOf("http") > -1) {
              return slug;
          }
          var page = 1;
          var path = slug || "";
          if (filtersJson) {
              var fixedJson2 = filtersJson
                  .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
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
              } catch (e) {log("getUrlList():\n" + e)}
          }
          var resultUrl = BASELINK;
          if (path) {
              resultUrl += (path.indexOf("/") === 0 ? "" : "/") + path;
          }
          if (page > 0 && resultUrl.indexOf("page=") === -1) {
              
              if(resultUrl.indexOf("?") > -1){
                paramPage = "&" + paramPage;
              }
              else{
                paramPage = "?" + paramPage;
              }
              resultUrl += paramPage + page;
          }
          var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
          log("getUrlList output=" + finalUrl);
           if (!USE_PHIMAPI) return finalUrl;
          var fallbackUrl = phimApiUrlForSource(finalUrl, page);
          log("getUrlList fallback=" + fallbackUrl);
          return fallbackUrl;
      } catch (e) {
          log("getUrlList[err]:\n " + e);
          return BASEURL;
      }
  }
  
  function getUrlSearch(keyword, filtersJson) {
      log("getUrlSearch keyword=" + keyword + " filters=" + filtersJson);
      // https://apip4k.dpdns.org/rest-api/v130/search?q=k%E1%BA%BB&page=1&type=movieserieslive
    // https://api.phim4k.online/rest-api/v130/search?q=m%E1%BB%A5c%20th%E1%BA%A7n%20k%C3%BD&page=1&type=movieserieslive
      var paramSearch = "/rest-api/v130/search?type=movieserieslive&q=";
      var paramPage = "page=";
      try {
          var page = 1;
          if (filtersJson) {
              var fixedJson = filtersJson
                  .replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":').replace(/:,/g, ':');
              try {
                  var filters = JSON.parse(fixedJson);
                  page = parseInt(filters.page) || 1;
              } catch (e) {log("getUrlList():\n" + e)}
          }
          var encodedKeyword = encodeURIComponent(keyword || "");
          
          var resultUrl = BASELINK + paramSearch + encodedKeyword;
          if (page > 0) {
            if(resultUrl.indexOf("?") > -1){
                paramPage = "&" + paramPage;
              }
              else{
                paramPage = "?" + paramPage;
              }
              resultUrl += paramPage + page;
          }
  
          var finalUrl = resultUrl.replace(/([^:]\/)\/+/g, "$1");
          log("getUrlSearch output=" + finalUrl);
           if (!USE_PHIMAPI) return finalUrl;
          var fallbackUrl = phimApiUrlForSource(finalUrl, page);
          log("getUrlSearch fallback=" + fallbackUrl);
          return fallbackUrl;
  
      } catch (e) {
         // log("getUrlSearch[err]:\n " + e);
          return BASEURL;
      }
  }
// http://vkey.vn/animevv
// /quoc-gia/M%E1%BB%B9
// /top
//filtersJson = "{page:5}"
//getUrlList("/top", filtersJson)
//getUrlSearch("girl", filtersJson)
// ===== HÀM TẠO URL END ======

// ===== HÀM TẠO KHỐI LIST PHIM BEGIN ======
function parseListResponse(html, $url) {
    log("parseListResponse url=" + $url + " htmlLen=" + (html ? String(html).length : 0) + " prefix=" + logShort(html));
    if (/phimapi\.com/i.test(String($url || ""))) {
        var apiJson = null;
        try { apiJson = JSON.parse(html); } catch (e) { log("phimapi list json error: " + e); }
        var apiOut = apiJson ? phimApiListJson(apiJson, $url) : "";
        if (apiOut) return apiOut;
        var apiRetry = phimApiFallbackList($url);
        if (apiRetry) return apiRetry;
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
    // console.log("ListURL:\n" + $url);
    //console.log("ListRaw:\n" + html);
    // --- Helper: lấy mảng phim thô từ payload JSON ---
        // --- Helper: lấy mảng phim thô từ payload JSON ---
    // --- Helper: lấy mảng phim thô từ payload JSON ---
    function extractRawList($data) {
        if (Array.isArray($data)) return $data;

        var pools = [];

        function pushPool(arr) {
            if (Array.isArray(arr) && arr.length > 0) pools.push(arr);
        }

        if ($data) {
            // Format CŨ: root-level
            pushPool($data.movie);
            pushPool($data.tvseries);
            pushPool($data.movies);
            pushPool($data.items);

            // Format MỚI: bọc trong "data"
            if ($data.data) {
                var d = $data.data;
                if (Array.isArray(d)) return d;
                pushPool(d.items);
                pushPool(d.movie);
                pushPool(d.tvseries);
                pushPool(d.movies);
            }
        }

        // Chỉ 1 pool → trả trực tiếp
        if (pools.length === 1) return pools[0];

        // Nhiều pool → gộp, dedupe theo videos_id
        if (pools.length > 1) {
            var merged = [];
            var seen = {};
            pools.forEach(function (arr) {
                arr.forEach(function (item) {
                    if (!item) return;
                    var key = item.videos_id || item._id || item.slug || "";
                    if (key && seen[key]) return;
                    if (key) seen[key] = true;
                    merged.push(item);
                });
            });
            return merged;
        }

        return [];
    }

    // --- Helper: map 1 item thô -> item chuẩn ---
    function mapItem(item, srcUrl) {
        var videosId  = item.videos_id || item._id || "";
        var titleRaw  = item.title     || item.name || "";
        var releaseRaw = item.release  || item.year || "";
        var typeStr   = item.type      || "";

        // Xác định TV series
        var isTV = (item.is_tvseries == 1)
                || (srcUrl.indexOf("tvseries") > -1)
                || (typeStr === "series")
                || (typeStr === "hoathinh");

        var id = isTV
            ? "/rest-api/v130/single_details?type=tvseries&id=" + videosId
            : "/rest-api/v130/single_details?type=movie&id="    + videosId;

        var title = titleRaw.replace(/([\s\S]+)\(\d+\)[\s\S]+/, "$1");
        var fallbackTitle = title || titleRaw;
        PHIM4K_TITLE_MAP[id] = fallbackTitle;
        PHIM4K_TITLE_MAP[BASEURL + id] = fallbackTitle;
        id += "#vx_title=" + encodeURIComponent(fallbackTitle);

        // Ảnh — giữ đúng logic code gốc, thêm fallback cho format mới
        var poster     = item.thumbnail_url || item.thumb_url || "";
        var background = item.poster_url    || item.thumb_url || poster;

        poster = "https://saigon.alokillgtv06.workers.dev/?name="
               + encodeURIComponent(title)
               + "&get=poster&backup=" + encodeURIComponent(background);

        var lang = titleRaw.replace(/[\s\S]+\(\d+\)([\s\S]+)/, "$1");

        return {
            "id":              id || "",
            "title":           title || "",
            "quality":         releaseRaw || "",
            "episode_current": item.episode_current || "",
            "posterUrl":       poster || "",
            "backdropUrl":     background || "",
            "year":            item.year || "",
            "lang":            lang || ""
        };
    }

    // --- Helper: gộp list thô vào mảng items (có dedupe theo id) ---
    function mergeInto(items, seen, rawList, srcUrl) {
        rawList.forEach(function (item) {
            if (!item) return;
            var obj = mapItem(item, srcUrl);
            if (!obj.title || obj.title.length < 2) return;
            if (!obj.posterUrl || obj.posterUrl.length < 5) return;
            if (seen[obj.id]) return;
            seen[obj.id] = true;
            items.push(obj);
        });
    }

    // --- Helper: build URL cho 1 page bất kỳ dựa trên $url gốc ---
    function buildPageUrl(baseUrl, page) {
        if (/[?&]page=\d+/.test(baseUrl)) {
            return baseUrl.replace(/([?&]page=)\d+/, "$1" + page);
        }
        return baseUrl + (baseUrl.indexOf("?") > -1 ? "&" : "?") + "page=" + page;
    }

    // --- Helper: fetch 1 page, trả về {list, url, ok} ---
    function fetchPage(baseUrl, page) {
        var targetUrl = buildPageUrl(baseUrl, page);
        try {
            // console.log("fetchPage[" + page + "]:\n" + targetUrl);

            var res = httpRequest(targetUrl, {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Accept":     "application/json, text/plain, */*",
                    "api-key":    API_KEY,
                    "authorization": "Basic YWRtaW46MTIzNA=="
                }
            });

            if (res && res.isSuccessful && res.body) {
                var json = JSON.parse(res.body);
                var list = extractRawList(json);
                // console.log("fetchPage[" + page + "] -> " + list.length + " items");
                return { list: list, url: targetUrl, ok: true };
            }
            // console.log("fetchPage[" + page + "] fail: status=" + (res && res.status));
            return { list: [], url: targetUrl, ok: false };
        } catch (e) {
            // console.log("fetchPage[" + page + "] err: " + e);
            return { list: [], url: targetUrl, ok: false };
        }
    }

    // --- Helper: xáo trộn mảng (Fisher-Yates) ---
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        return arr;
    }

    // --- Helper: lấy số page hiện tại từ URL (mặc định 1) ---
    function getCurrentPage(url) {
        var m = url.match(/[?&]page=(\d+)/);
        return m ? parseInt(m[1], 10) : 1;
    }

    try {
        var items = [];
        var seen  = {};

        var curPage = getCurrentPage($url);
        // console.log("Current page = " + curPage);

        // 1) Parse trang hiện tại (luôn luôn)
        var $data   = JSON.parse(html);
        if (phim4kListBad($data)) {
            if (USE_PHIMAPI) {
                var badListFallback = phimApiFallbackList($url);
                if (badListFallback) return badListFallback;
            }
        }
        var curList = extractRawList($data);
        log("phim4k list raw=" + curList.length);
        mergeInto(items, seen, curList, $url);
        log("phim4k list mapped=" + items.length);
        if (!items.length) {
            if (USE_PHIMAPI) {
                var fallbackList = phimApiFallbackList($url);
                if (fallbackList) return fallbackList;
            }
        }

        // 2) CHỈ ở page 1 mới fetch thêm page 30 & 31 rồi gộp + xáo trộn
        if (curPage === 1) {
            var extraPages = [30, 31];
            for (var p = 0; p < extraPages.length; p++) {
                var pageNum = extraPages[p];
                var r = fetchPage($url, pageNum);
                if (r.ok && r.list.length > 0) {
                    mergeInto(items, seen, r.list, r.url);
                    // console.log("after page " + pageNum + " -> total = " + items.length);
                }
            }

            shuffle(items);
            // console.log("Page 1: shuffled, final items = " + items.length);
        } else {
            // Page 2+ : giữ nguyên thứ tự gốc, không fetch thêm, không xáo
            // console.log("Page " + curPage + ": normal mode, items = " + items.length);
        }

        log("phim4k list final=" + items.length + " page=" + curPage);
        return JSON.stringify({
            "items": items,
            "pagination": {
                "currentPage": curPage,
                "totalPages":    9999
            }
        });

    } catch (e) {
        log("phim4k list error: " + e);
        if (USE_PHIMAPI) {
            var fallbackList = phimApiFallbackList($url);
            if (fallbackList) return fallbackList;
        }
        return JSON.stringify({
            "items": [],
            "pagination": {
                "currentPage": 1,
                "totalPages":  1
            }
        });
    }
}
//html = sourceHTML;
//$data = parseJSDataIsolated(script);
// ===== HÀM TẠO KHỐI LIST PHIM END ======

// Helper 1: Đồng bộ tên tập phim (fmEpi)
function fmEpi(filename, hasMultipleSeasons) {
    if (!filename) return "";
    let clean = filename.replace(/\.(mkv|mp4|avi|flv|webm|ts|m3u8)$/i, "").trim();

    // 1. Dạng S01E02 / S1E2 / S01.E02
    const seMatch = clean.match(/S(\d+)[\s._-]*E(\d+)/i);
    if (seMatch) {
        var sNum = parseInt(seMatch[1], 10);
        var eNum = parseInt(seMatch[2], 10);
        return hasMultipleSeasons ? `Mùa ${sNum} Tập ${eNum}` : `Tập ${eNum}`;
    }

    // 2. Dạng E01.Revised / E01 / EP01 / Ep.01 / Tập 01
    const epMatch = clean.match(/(?:EP|Tập|Ep|E)[\s._-]*(\d{1,4})/i);
    if (epMatch) {
        var epVal = parseInt(epMatch[1], 10);
        return hasMultipleSeasons ? `Mùa 1 Tập ${epVal}` : `Tập ${epVal}`;
    }

    // 3. Dạng Season trọn bộ
    const seasonOnlyMatch = clean.match(/\b(?:S|Season\s*)(\d{1,2})\b/i);
    if (seasonOnlyMatch && !clean.match(/E\d+/i)) {
        return `Mùa ${parseInt(seasonOnlyMatch[1], 10)} (Trọn bộ)`;
    }

    // 4. Số đứng đầu tên file (Ví dụ: 127TVP, 127P...)
    const leadNumMatch = clean.match(/^(\d{1,4})/);
    if (leadNumMatch) {
        var leadVal = parseInt(leadNumMatch[1], 10);
        return hasMultipleSeasons ? `Mùa 1 Tập ${leadVal}` : `Tập ${leadVal}`;
    }

    // 5. Lọc từ rác & lấy số tập bất kỳ
    let cleanName = clean
        .replace(/(\d+)V\d+/gi, "$1")
        .replace(/[._-]/g, " ")
        .replace(/\b(2160p|1080p|720p|4k|50fps|60fps|25fps|x265|x264|h264|h265|hevc|10bit|hdr|hdr10|sdr|aac|ac3|dts|truehd|atmos|bluray|remux|web-dl|webrip|hdtv|vietsub|thuyetminh|engsub)\b/ig, "");

    const numMatch = cleanName.match(/\b(\d{1,4})\b/);
    if (numMatch) {
        var numVal = parseInt(numMatch[1], 10);
        return hasMultipleSeasons ? `Mùa 1 Tập ${numVal}` : `Tập ${numVal}`;
    }

    return clean;
}

// Helper 2: Đồng bộ tên Server/Bản phim (Hàm gốc của bạn)
function formatLabelName(rawName, prefix, counts) {
    const raw = rawName || "";

    let is4K = /4k|uhd|2160p/i.test(raw);
    let is2K = /2k|1440p|qhd/i.test(raw);
    let is1080 = /1080p?/i.test(raw);
    let isRemux = /remux/i.test(raw);

    const fpsMatch = raw.match(/(\d+\s*fps)/i);
    const fpsStr = fpsMatch ? ` ${fpsMatch[1].toUpperCase()}` : "";

    const hdrMatch = raw.match(/\b(SDR|HDR10\+|HDR10|HDR|DV|Dolby\s*Vision)\b/i);
    const hdrStr = hdrMatch ? ` ${hdrMatch[1].toUpperCase()}` : "";

    let typeLabel = "";
    let versionNum = 0;
    let priority = 99;

    if (isRemux) {
        counts.numRemux++;
        typeLabel = "Chất lượng tự động";
        versionNum = counts.numRemux;
        priority = 1;
    } else if (is4K) {
        counts.num4k++;
        typeLabel = "Chất lượng cao (2160P)";
        versionNum = counts.num4k;
        priority = 1;
    } else if (is2K) {
        counts.num2k++;
        typeLabel = "Chất lượng cao (1440P)";
        versionNum = counts.num2k;
        priority = 2;
    } else if (is1080) {
        counts.num1080++;
        typeLabel = "Chất lượng tốt (1080P)";
        versionNum = counts.num1080;
        priority = 3;
    } else {
        counts.numOther++;
        typeLabel = "Chất lượng khác";
        versionNum = counts.numOther;
        priority = 4;
    }

    const formattedName = `${prefix}${typeLabel} [FIX ${versionNum}]${fpsStr}${hdrStr}`.trim();
    return { name: formattedName, priority: priority };
}



// ============================================================================
// formatLabelName — ĐÃ SỬA: bỏ FPS / HDR / DV
// ============================================================================
function formatLabelName(rawName, prefix, counts) {
    const raw = rawName || "";

    let is4K    = /4k|uhd|2160p/i.test(raw);
    let is2K    = /2k|1440p|qhd/i.test(raw);
    let is1080  = /1080p?/i.test(raw);
    let isRemux = /remux/i.test(raw);

    let typeLabel = "";
    let versionNum = 0;
    let priority = 99;
    if (isRemux) {
        counts.numRemux++;
        typeLabel = "Chất lượng tự động";
        versionNum = counts.numRemux;
        priority = 1;
    } else if (is4K) {
        counts.num4k++;
        typeLabel = "Chất lượng cao (2160P)";
        versionNum = counts.num4k;
        priority = 1;
    } else if (is2K) {
        counts.num2k++;
        typeLabel = "Chất lượng cao (1440P)";
        versionNum = counts.num2k;
        priority = 2;
    } else if (is1080) {
        counts.num1080++;
        typeLabel = "Chất lượng tốt (1080P)";
        versionNum = counts.num1080;
        priority = 3;
    } else {
        counts.numOther++;
        typeLabel = "Chất lượng khác";
        versionNum = counts.numOther;
        priority = 4;
    }
    var verobj = {
      1: "🥇",
      2: "🥈",
      3: "🥉",
      4: "4️⃣",
      5: "5️⃣",
      6: "6️⃣",
      7: "7️⃣",
      8: "8️⃣",
      9: "9️⃣"
    }
    // KHÔNG còn fpsStr / hdrStr
    var vertext = verobj[versionNum];
    const formattedName = `${prefix}${typeLabel} ${vertext}`.trim();
    return { name: formattedName, priority: priority };
}


function parseMovieDetail(html, url) {
    log("parseMovieDetail url=" + url + " htmlLen=" + (html ? String(html).length : 0) + " prefix=" + logShort(html));
    // log("========== parseMovieDetail START ==========");
    // log("[URL] " + url);
    // log("[HTML length] " + (html ? html.length : 0));
    var phimApiDirect = isPhimApiUrl(url) ? phimApiSlugFromUrl(url) : "";
    if (phimApiDirect) {
        log("phimapi direct slug=" + phimApiDirect);
        var phimApiDirectOut = phimApiFallbackDetail(url);
        if (phimApiDirectOut) return phimApiDirectOut;
    }

    try {
        var $data = JSON.parse(html);
        log("phim4k detail parsed title=" + ($data && ($data.title || $data.name)) + " isTV=" + ($data && $data.is_tvseries) + " videos=" + ($data && $data.videos ? $data.videos.length : 0) + " seasons=" + ($data && $data.season ? $data.season.length : 0));
        if (phim4kDetailFatal($data)) {
            log("phim4k detail fatal/maintenance");
            if (!isPhim4kUrl(url)) {
                var phim4kEarlyFallback = phimApiFallbackDetail(url);
                if (phim4kEarlyFallback) return phim4kEarlyFallback;
            }
        }

        var posterUrl   = $data.thumbnail_url;
        var backdropUrl = $data.poster_url;
        var title       = $data.title;
        var originName  = title;
        var description = "";
        var director    = "";
        var casts       = "";

        // ====================================================================
        // HELPERS
        // ====================================================================

        function romanToInt(roman) {
            var map = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
            var s = String(roman).toUpperCase();
            var result = 0;
            for (var i = 0; i < s.length; i++) {
                var curr = map[s[i]] || 0;
                var next = map[s[i + 1]] || 0;
                if (curr < next) result -= curr;
                else result += curr;
            }
            return result;
        }

        function intToRoman(num) {
            var values  = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
            var symbols = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
            var result = "";
            for (var i = 0; i < values.length; i++) {
                while (num >= values[i]) { result += symbols[i]; num -= values[i]; }
            }
            return result;
        }

        // title -> slug phimapi
        function makeApiSlug(rawTitle) {
            if (!rawTitle) return "";
            var t = String(rawTitle);

            var yearMatch = t.match(/(.*?\(\d{4}\))/);
            if (yearMatch && yearMatch[1]) {
                t = yearMatch[1];
                // log("[slug] Bước 1: \"" + t + "\"");
            }

            t = t.replace(/\([^)]*\)/g, " ").trim();

            var romanMatch = t.match(/\s+([IVXLCDM]{1,4})$/i);
            if (romanMatch) {
                var romanStr = romanMatch[1].toUpperCase();
                var num = romanToInt(romanStr);
                var isValid = (num >= 1 && num <= 20 && intToRoman(num) === romanStr);
                if (isValid) {
                    t = t.substring(0, t.length - romanStr.length).trim();
                    if (num === 1) {
                        // log("[slug] Roman \"" + romanStr + "\" = 1 -> BỎ");
                    } else {
                        t = t + " " + num;
                        // log("[slug] Roman \"" + romanStr + "\" = " + num);
                    }
                }
            }

            t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            t = t.replace(/đ/g, "d").replace(/Đ/g, "D");
            t = t.toLowerCase();
            t = t.replace(/[^a-z0-9\s-]/g, " ");
            t = t.replace(/[\s-]+/g, "-");
            t = t.replace(/^-+|-+$/g, "");
            return t;
        }

        // Tạo danh sách slug ứng viên
        function buildCandidateSlugs(rawTitle) {
            var candidates = [];
            var slugBase = makeApiSlug(rawTitle);
            if (!slugBase) return candidates;
            candidates.push(slugBase);

            var yearMatch = rawTitle.match(/\((\d{4})\)/);
            var year = yearMatch ? yearMatch[1] : null;
            if (year) candidates.push(slugBase + "-" + year);
            if (/\b(Phần|Part)\b/i.test(rawTitle)) candidates.push(slugBase + "-phan-1");

            var unique = [];
            var seen = {};
            for (var i = 0; i < candidates.length; i++) {
                if (!seen[candidates[i]]) {
                    seen[candidates[i]] = true;
                    unique.push(candidates[i]);
                }
            }
            return unique;
        }

        // Fetch 1 slug phimapi
        function tryFetchPhimApi(slug) {
            var apiUrl = "https://phimapi.com/phim/" + slug;
            try {
                var res = httpRequest(apiUrl, {
                    method: "GET",
                    headers: {
                        "Accept":     "application/json, text/plain, */*",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                    }
                });
                if (res && res.isSuccessful && res.body) {
                    var json = JSON.parse(res.body);
                    if (json && json.status === true && json.movie) {
                        return { json: json, slug: slug };
                    }
                }
            } catch (e) {
                // log("[fetch] " + slug + " -> " + e);
            }
            return null;
        }

        // Tên tập phimapi -> "SxEy"
        function parseApiEpKey(name) {
            var s = 1, e = 0;
            var sMatch = name.match(/(?:Mùa|Season|S)\s*(\d+)/i);
            if (sMatch) s = parseInt(sMatch[1], 10);
            var eMatch = name.match(/(?:Tập|Episode|EP|Ep|E)\s*(\d+)/i);
            if (eMatch) {
                e = parseInt(eMatch[1], 10);
            } else {
                var numMatch = name.match(/(\d+)/);
                if (numMatch) e = parseInt(numMatch[1], 10);
            }
            return "S" + s + "E" + e;
        }

        // Tên tập phim4k -> {season, episode, key}
        function parseSeasonAndEpisode(epName) {
            var s = 1, e = 0;
            var seasonMatch = epName.match(/(?:Mùa|Season|S)\s*(\d+)/i);
            if (seasonMatch) s = parseInt(seasonMatch[1], 10);
            var epMatch = epName.match(/(?:Tập|Episode|EP|Ep|E)\s*(\d+)/i);
            if (epMatch) {
                e = parseInt(epMatch[1], 10);
            } else {
                var fb = epName.match(/\d+/);
                if (fb) e = parseInt(fb[0], 10);
            }
            return { season: s, episode: e, key: "S" + s + "E" + e };
        }

        // Normalize title để so sánh
        function normalizeTitle(s) {
            if (!s) return "";
            return String(s)
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d").replace(/Đ/g, "D")
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        }

        // Tách keyword search: bỏ năm, "Phần N", roman
        function extractSearchKeyword(rawTitle) {
            if (!rawTitle) return "";
            var t = String(rawTitle);

            // Bỏ "(YYYY)"
            t = t.replace(/\s*\(\d{4}\)\s*/g, " ");

            // Bỏ "Phần N", "Part N", "Chapter N", "Season N"
            t = t.replace(/\s+(Phần|Part|Chapter|Season)\s+(\d+|[IVXLCDM]+)\b/gi, " ");

            // Bỏ roman ở cuối nếu hợp lệ
            var rm = t.match(/\s+([IVXLCDM]{1,4})$/i);
            if (rm) {
                var rs = rm[1].toUpperCase();
                var n = romanToInt(rs);
                if (n >= 1 && n <= 20 && intToRoman(n) === rs) {
                    t = t.substring(0, t.length - rs.length).trim();
                }
            }

            return t.trim();
        }

        // Điểm khớp giữa 2 title (0-100)
        function scoreMatch(titleA, titleB) {
            var a = normalizeTitle(titleA);
            var b = normalizeTitle(titleB);
            if (!a || !b) return 0;
            if (a === b) return 100;

            var wa = a.split(" ").filter(function(w){ return w.length > 1; });
            var wb = b.split(" ").filter(function(w){ return w.length > 1; });
            if (wa.length === 0 || wb.length === 0) return 0;

            var setB = {};
            wb.forEach(function(w){ setB[w] = true; });

            var matched = 0;
            wa.forEach(function(w){ if (setB[w]) matched++; });

            return (matched / Math.max(wa.length, wb.length)) * 100;
        }

        // ====================================================================
        // [1] GỌI PHIMAPI
        // ====================================================================
        // log("---------- [1] GỌI PHIMAPI ----------");

        var apiData  = null;
        var apiEpMap = {};
        var apiFull  = null;

        var candidates = buildCandidateSlugs(title);
        // log("[slug] Ứng viên: " + JSON.stringify(candidates));

        var apiResult = null;

        // Bước 1: thử slug gốc
        if (candidates.length > 0) {
            // log("[HTTP] Thử slug gốc: \"" + candidates[0] + "\"");
            apiResult = tryFetchPhimApi(candidates[0]);

            if (apiResult) {
                // log("[HTTP] ✅ Slug gốc thành công!");
            } else {
                // log("[HTTP] ⚠️ Slug gốc thất bại, thử song song các slug còn lại...");

                // Bước 2: fetch song song các slug còn lại
                var remaining = candidates.slice(1);
                if (remaining.length > 0) {
                    var requests = remaining.map(function(s) {
                        return { url: "https://phimapi.com/phim/" + s, method: "GET" };
                    });

                    var responses = fetchAll(requests, {
                        headers: {
                            "Accept":     "application/json, text/plain, */*",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                        }
                    });

                    for (var i = 0; i < responses.length; i++) {
                        var r = responses[i];
                        if (r && r.isSuccessful && r.body) {
                            try {
                                var j = JSON.parse(r.body);
                                if (j && j.status === true && j.movie) {
                                    apiResult = { json: j, slug: remaining[i] };
                                    // log("[HTTP] ✅ Slug \"" + remaining[i] + "\" thành công!");
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }
            }
        }

        // Bước 3: fallback dùng API tìm kiếm
        if (!apiResult) {
            // log("[search] 3 slug fail, thử API tìm kiếm...");

            var keyword = extractSearchKeyword(title);
            // log("[search] Keyword: \"" + keyword + "\"");

            if (keyword) {
                var searchUrl = "https://phimapi.com/v1/api/tim-kiem?keyword="
                              + encodeURIComponent(keyword) + "&limit=10";
                // log("[search] GET " + searchUrl);

                try {
                    var sr = httpRequest(searchUrl, {
                        method: "GET",
                        headers: {
                            "Accept":     "application/json, text/plain, */*",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
                        }
                    });

                    if (sr && sr.isSuccessful && sr.body) {
                        var sj = JSON.parse(sr.body);

                        if (sj && sj.status === "success" && sj.data && sj.data.items && sj.data.items.length) {
                            var items = sj.data.items;
                            // log("[search] Có " + items.length + " kết quả");

                            var bestItem  = items[0];
                            var bestScore = 0;

                            for (var ii = 0; ii < items.length; ii++) {
                                var it = items[ii];
                                var sc = scoreMatch(title, it.name);
                                // log("[search]   \"" + it.name + "\" (slug=" + it.slug + ") score=" + sc.toFixed(1));
                                if (sc > bestScore) {
                                    bestScore = sc;
                                    bestItem  = it;
                                }
                            }

                            // log("[search] ✅ Chọn: \"" + bestItem.name + "\" (slug=" + bestItem.slug + ", score=" + bestScore.toFixed(1) + ")");

                            var detail = tryFetchPhimApi(bestItem.slug);
                            if (detail) {
                                apiResult = detail;
                                // log("[search] ✅ Fetch detail OK!");
                            } else {
                                // log("[search] ⚠️ Fetch detail fail cho slug " + bestItem.slug);
                            }
                        } else {
                            // log("[search] Không có item nào");
                        }
                    } else {
                        // log("[search] HTTP fail: " + (sr ? sr.status : "no response"));
                    }
                } catch (eS) {
                    // log("[search] Exception: " + eS);
                }
            }
        }

        // Xử lý kết quả cuối
        if (apiResult) {
            var aJson = apiResult.json;
            apiData = aJson.movie;
            // log("[OK] apiData: name=" + apiData.name + " | year=" + apiData.year + " | slug=" + apiResult.slug);

            if (aJson.episodes && aJson.episodes.length) {
                // log("[m3u8] Số server phimapi: " + aJson.episodes.length);

                for (var ei = 0; ei < aJson.episodes.length; ei++) {
                    var srv = aJson.episodes[ei];
                            var srvName = "Nguồn dự phòng";
                    var srvData = srv.server_data || [];
                    // log("[m3u8] Server \"" + srvName + "\" có " + srvData.length + " tập");

                    for (var si = 0; si < srvData.length; si++) {
                        var ep = srvData[si];
                        if (!ep.link_m3u8) continue;

                        if (!apiFull) {
                            apiFull = { name: srvName, url: ep.link_m3u8 };
                            // log("[m3u8] ✅ apiFull từ \"" + srvName + "/" + ep.name + "\":");
                            // log("       " + ep.link_m3u8);
                        }

                        var key = parseApiEpKey(ep.name || "");
                        if (!apiEpMap[key]) apiEpMap[key] = [];
                        apiEpMap[key].push({ name: srvName, url: ep.link_m3u8 });
                    }
                }

                var mapKeys = Object.keys(apiEpMap);
                // log("[map] Tổng key SxEy: " + mapKeys.length);
                for (var mk = 0; mk < mapKeys.length; mk++) {
                    // log("[map]   " + mapKeys[mk] + " -> " + apiEpMap[mapKeys[mk]].length + " nguồn: "
                     //   + apiEpMap[mapKeys[mk]].map(function(x){return x.name;}).join(", "));
                }
            }
        } else {
            // log("[ERROR] Không tìm thấy qua slug lẫn search.");
        }

        // log("---------- [1] KẾT THÚC ----------");
        // log("[SUMMARY-1] apiData=" + (apiData ? "OK" : "NULL")
          //  + " | apiFull=" + (apiFull ? "OK" : "EMPTY")
          //  + " | map keys=" + Object.keys(apiEpMap).length);

        // ====================================================================
        // Bảng genre
        // ====================================================================
        var genreNameByLink = {
            "/rest-api/v130/content_by_genre_id?id=1":   "Action",
            "/rest-api/v130/content_by_genre_id?id=2":   "Adventure",
            "/rest-api/v130/content_by_genre_id?id=3":   "Crime",
            "/rest-api/v130/content_by_genre_id?id=5":   "History",
            "/rest-api/v130/content_by_genre_id?id=6":   "War",
            "/rest-api/v130/content_by_genre_id?id=7":   "Music",
            "/rest-api/v130/content_by_genre_id?id=8":   "Comedy",
            "/rest-api/v130/content_by_genre_id?id=9":   "Drama",
            "/rest-api/v130/content_by_genre_id?id=11":  "Science Fiction",
            "/rest-api/v130/content_by_genre_id?id=12":  "Mystery",
            "/rest-api/v130/content_by_genre_id?id=13":  "Animation",
            "/rest-api/v130/content_by_genre_id?id=14":  "Family",
            "/rest-api/v130/content_by_genre_id?id=15":  "Horror",
            "/rest-api/v130/content_by_genre_id?id=18":  "TV Series",
            "/rest-api/v130/content_by_genre_id?id=43":  "Drama",
            "/rest-api/v130/content_by_genre_id?id=75":  "Criminal",
            "/rest-api/v130/content_by_genre_id?id=83":  "TVB",
            "/rest-api/v130/content_by_genre_id?id=130": "Action & Adventure",
            "/rest-api/v130/content_by_genre_id?id=138": "Horror"
        };

        var category = ($data.genre || []).map(function(box) {
            var link = "/rest-api/v130/content_by_genre_id?id=" + box.genre_id;
            var name = genreNameByLink[link] || box.name;
            return "[" + name + "](" + link + ")";
        }).join(", ");

        var duration        = $data.runtime;
        var status          = "";
        var episode_current = "";
        var year            = $data.release;
        var quality         = $data.video_quality;
        var rating          = "";
        var country         = "";
        var lang            = "";
        var extra           = "";
        var servers         = [];

        // ====================================================================
        // [2] BUILD SERVERS
        // ====================================================================
        if ($data.is_tvseries == 1) {
            // ----- TV -----
            var rawSeasons = $data.season || [];
            var hasMultipleSeasons = rawSeasons.length > 1;
            if (!hasMultipleSeasons) {
                rawSeasons.forEach(function(box) {
                    var sMatch = (box.seasons_name || "").match(/(?:Mùa|Season|S)\s*(\d+)/i);
                    if (sMatch && parseInt(sMatch[1], 10) > 1) hasMultipleSeasons = true;
                    (box.episodes || []).forEach(function(ep) {
                        if (/(?:Mùa|Season|S)\s*([2-9]|\d{2,})/i.test(ep.episodes_name || "")) {
                            hasMultipleSeasons = true;
                        }
                    });
                });
            }

            var allEps = [];
            rawSeasons.forEach(function(box) {
                var rawName = (box.seasons_name || "").toLowerCase();
                var tag = "Khác";
                if (rawName.indexOf("4k") !== -1 || rawName.indexOf("2160") !== -1) tag = "4K";
                else if (/1080|1080p/i.test(rawName)) tag = "1080p";

                (box.episodes || []).forEach(function(parent) {
                    var $obj = {};
                    var idurl = parent.file_url || "";
                    $obj.file_url = idurl;
                    $obj.key = idurl.replace("https://cdn.phim4k.lol/", "");
                    $obj.type = parent.file_type;
                    var nameEpi = parent.episodes_name;
                    var nameClean = fmEpi(nameEpi, hasMultipleSeasons);

                    if (!$obj.type && nameEpi.indexOf('.') !== -1) {
                        $obj.type = nameEpi.match(/\.([^.]+)$/)[1];
                    }
                    $obj.sub = parent.subtitle;

                    var encode = BASE64.encode(JSON.stringify($obj));
                    var link = BASEURL + "/stream?setData=" + encode;
                    var parsed = parseSeasonAndEpisode(nameClean);

                    allEps.push({
                        name:     nameClean,
                        id:       link,
                        _key:     parsed.key,
                        _season:  parsed.season,
                        _episode: parsed.episode,
                        _tag:     tag,
                        _hasSub:  !!(parent.subtitle && parent.subtitle.length > 0)
                    });
                });
            });

            var groupMap  = {};
            var groupKeys = [];
            allEps.forEach(function(ep) {
                if (!groupMap[ep._key]) {
                    groupMap[ep._key] = [];
                    groupKeys.push(ep._key);
                }
                groupMap[ep._key].push(ep);
            });

            groupKeys.sort(function(a, b) {
                var ma = a.match(/S(\d+)E(\d+)/);
                var mb = b.match(/S(\d+)E(\d+)/);
                if (!ma || !mb) return 0;
                var sa = parseInt(ma[1], 10), ea = parseInt(ma[2], 10);
                var sb = parseInt(mb[1], 10), eb = parseInt(mb[2], 10);
                if (sa !== sb) return sa - sb;
                return ea - eb;
            });

            var episodes = [];
            var tagOrder = { "4K": 1, "1080p": 2, "Khác": 3 };

            groupKeys.forEach(function(key, idx) {
                var group = groupMap[key].slice();
                group.sort(function(a, b) {
                    var pa = tagOrder[a._tag] || 99;
                    var pb = tagOrder[b._tag] || 99;
                    if (pa !== pb) return pa - pb;
                    if (a._hasSub !== b._hasSub) return a._hasSub ? -1 : 1;
                    return 0;
                });

                var firstEp = group[0];
                var idsArr  = [];

                // Nguồn chính lên đầu; nguồn phụ chỉ là dự phòng.
                var tagCounter = {};
                group.forEach(function(ep) {
                    tagCounter[ep._tag] = (tagCounter[ep._tag] || 0) + 1;

                    var baseLabel;
                    if (ep._tag === "4K")         baseLabel = "Chất lượng cao (2160P)";
                    else if (ep._tag === "1080p") baseLabel = "Chất lượng tốt (1080P)";
                    else                          baseLabel = "Nguồn dự phòng";

                    if (ep._hasSub) baseLabel += " Vietsub";

                    var sameTagTotal = group.filter(function(x){ return x._tag === ep._tag; }).length;
                    if (sameTagTotal > 1) baseLabel += " " + tagCounter[ep._tag];

                    idsArr.push({ name: baseLabel, url: ep.id });
                });

                var apiSources = apiEpMap[key] || [];
                apiSources.forEach(function(src) {
                    idsArr.push({
                        name: "Nguồn dự phòng (1080P)",
                        url: src.url
                    });
                });

                episodes.push({
                    name: firstEp.name,
                    slug: "tap-" + (idx + 1),
                    id:   idsArr[0].url,
                    ids:  idsArr
                });
            });

            servers.push({ name: "Danh sách tập", episodes: episodes });

        } else {
            // ----- MOVIE -----
            var movieIds = [];
            var labelCounts = { numRemux: 0, num4k: 0, num2k: 0, num1080: 0, numOther: 0 };
            var videosArr = $data.videos || [];

            videosArr.forEach(function(box, index) {
                var $obj = {};
                var idurl = box.file_url || "";
                $obj.file_url = idurl;
                $obj.key = idurl.replace("https://cdn.phim4k.lol/", "");
                $obj.type = box.file_type;
                var nameEpi = box.episodes_name || "";
                var rawLabel = box.label || nameEpi;

                if (!$obj.type && nameEpi.indexOf('.') !== -1) {
                    $obj.type = nameEpi.match(/\.([^.]+)$/)[1];
                }
                $obj.sub = box.subtitle;

                var formatted = formatLabelName(rawLabel, "", labelCounts);
                var encode = BASE64.encode(JSON.stringify($obj));
                var link = BASEURL + "/stream?setData=" + encode;

                movieIds.push({
                    name: formatted.name,
                    url: link
                });
            });

            if (apiFull) {
                movieIds.push({
                    name: "Nguồn dự phòng (1080P)",
                    url: apiFull.url
                });
            }

            servers.push({ name: "Danh sách tập", episodes: movieIds.length ? [{
                id: movieIds[0].url,
                name: "Xem ngay",
                slug: "full",
                ids: movieIds
            }] : [] });
        }

        // ====================================================================
        // [3] OVERRIDE METADATA
        // ====================================================================
        if (apiData && !isPhim4kUrl(url)) {
            if (apiData.poster_url)   posterUrl   = apiData.poster_url;
            if (apiData.thumb_url)    backdropUrl = apiData.thumb_url;
            if (apiData.content)      description = apiData.content;
            if (apiData.actor)        casts       = Array.isArray(apiData.actor) ? apiData.actor.join(", ") : apiData.actor;
            if (apiData.director)     director    = Array.isArray(apiData.director) ? apiData.director.join(", ") : apiData.director;
            if (apiData.name)         title       = apiData.name;
            if (apiData.origin_name)  originName  = apiData.origin_name;
            if (apiData.quality)      quality     = apiData.quality;
            if (apiData.year)         year        = apiData.year;
            if (apiData.lang)         lang        = apiData.lang;
            if (apiData.time)         duration    = apiData.time;
            if (apiData.episode_current) episode_current = apiData.episode_current;
            if (apiData.status)       status      = apiData.status;

            var voteAvg = 0;
            if (apiData.tmdb && apiData.tmdb.vote_average) voteAvg = apiData.tmdb.vote_average;
            else if (apiData.imdb && apiData.imdb.vote_average) voteAvg = apiData.imdb.vote_average;
            if (voteAvg) rating = String(voteAvg);

            if (Array.isArray(apiData.country) && apiData.country.length) {
                country = apiData.country.map(function(c){ return c.name; }).join(", ");
            } else if (typeof apiData.country === "string") {
                country = apiData.country;
            }

            if (Array.isArray(apiData.category) && apiData.category.length) {
                category = apiData.category.map(function(c) {
                    return "[" + c.name + "](/rest-api/v130/content_by_genre_id?id=" + (c.id || c.slug || "") + ")";
                }).join(", ");
            }
        }

        // ====================================================================
        // [4] OUTPUT
        // ====================================================================
        log("phim4k detail servers=" + servers.length + " playable=" + phimApiHasPlayable(servers));
        if (!phimApiHasPlayable(servers)) {
            if (!isPhim4kUrl(url)) {
                var phim4kNoStreams = phimApiFallbackDetail(url);
                if (phim4kNoStreams) return phim4kNoStreams;
            }
        }
        var $return = JSON.stringify({
            id:              url || "",
            title:           title || "",
            originName:      originName || "",
            posterUrl:       posterUrl || "",
            backdropUrl:     backdropUrl || "",
            description:     description || "",
            quality:         quality || "",
            year:            year || "",
            rating:          rating || "",
            status:          status || "",
            category:        category || "",
            episode_current: episode_current || "",
            servers:         servers || "",
            duration:        duration || "",
            casts:           casts || "",
            director:        director || "",
            country:         country || "",
            lang:            lang || "",
            extra:           extra || ""
        });

        // log("========== parseMovieDetail END (SUCCESS) ==========");
        return $return;

    } catch (e) {
        log("parseMovieDetail error: " + e);
        // log("[FATAL] parseMovieDetail EXCEPTION: " + e);
        // log("========== parseMovieDetail END (ERROR) ==========");
        if (!isPhim4kUrl(url)) {
            var phim4kCatchFallback = phimApiFallbackDetail(url);
            if (phim4kCatchFallback) return phim4kCatchFallback;
        }
        return JSON.stringify({
            id: "error",
            title: "error",
            description: url + "\n" + e,
            servers: []
        });
    }
}



// ===== HÀM TẠO XỬ LÝ STREAM PHIM BEGIN ======
function getStreamLink(slug, datasend) {
    try {
        var directLink = String(slug || "");
        if (/^https?:\/\/[^"']+\.(m3u8|mp4|mkv)(\?|$)/i.test(directLink) && directLink.indexOf("setData=") < 0) {
            return phimApiStreamJson(directLink);
        }
        log("getStreamLink slug: " + slug + " | datasend: " + datasend);
        var payload = {};
        var dataStr = datasend || "";
        if (!dataStr && slug && slug.indexOf("setData=") > -1) {
            var match = slug.match(/setData=([^&]*)/i);
            if (match && match[1]) dataStr = match[1];
        }
        if (dataStr) {
            var decoded = BASE64.decode(dataStr);
            payload = JSON.parse(decoded);
        }

        var streamKey = payload.key || payload.stream_key || "";
        if (!streamKey && payload.file_url) {
            streamKey = payload.file_url;
        }
        if (streamKey) {
            streamKey = streamKey.split("?")[0].split("#")[0];
            if (streamKey.indexOf("/") !== -1) {
                streamKey = streamKey.substring(streamKey.lastIndexOf("/") + 1);
            }
        }

        var cdn = CDN_BASE;
        var currentApi = BASEURL;
        try {
            if (typeof AppCrypto !== "undefined" && AppCrypto.fetchDynamicConfig) {
                var dyn = AppCrypto.fetchDynamicConfig(DYN_WORKER, DYN_SECRET);
                if (dyn) {
                    var parsedCfg = typeof dyn === "string" ? JSON.parse(dyn) : dyn;
                    if (parsedCfg.cdn) cdn = "https://" + parsedCfg.cdn;
                    if (parsedCfg.api) currentApi = "https://" + parsedCfg.api;
                    //// console.log("LINK CDN\n" + cdn);
                    //// console.log("LINK currentApi\n" + currentApi);
                }
            }
        } catch(e) {}

        var stream = "";
        if (typeof AppCrypto !== "undefined" && AppCrypto.resolveStreamUrl) {
            stream = AppCrypto.resolveStreamUrl(streamKey, cdn, HMAC_SECRET, currentApi + "/");
        }
        if (!stream && typeof AppCrypto !== "undefined" && AppCrypto.genStreamUrl) {
            stream = AppCrypto.genStreamUrl(streamKey, cdn, HMAC_SECRET);
        }
        if (!stream) {
            stream = cdn + "/" + streamKey;
        }

        var videoMimeType = "video/mp4";
        var videoType = (payload.type || "").toLowerCase();
        if (videoType === "mkv" || (stream && stream.indexOf(".mkv") !== -1)) videoMimeType = "video/x-matroska";
        else if (videoType === "m3u8" || (stream && stream.indexOf(".m3u8") !== -1)) videoMimeType = "application/x-mpegURL";

        var subtitles = [];
        if (payload.sub && payload.sub.length > 0) {
            for (var i = 0; i < payload.sub.length; i++) {
                var subItem = payload.sub[i];
                if (!subItem || !subItem.url) continue;
                var langLower = (subItem.language || "").toLowerCase();
                var isVi = langLower.indexOf("vietnam") !== -1 || (subItem.srclang || "") === "vi";
                subtitles.push({
                    lang: isVi ? "Vietsub (VIP)" : (subItem.language || "Subtitle"),
                    url: subItem.url,
                    mimeType: "text/vtt"
                });
            }
        }
        if(stream.indexOf("m3u8") > -1){
          var skip = [
       // Bỏ qua 30s quảng cáo ở phút 2:00 -> 2:30
            { start: 890, end: 935, type: "ad" }     // Bỏ qua 28s quảng cáo ở phút 15:00 -> 15:28
          ]
        }
        else{
          var skip = [];
        }
        var result = JSON.stringify({
            url: stream,
            mimeType: videoMimeType,
            isEmbed: false,
            skipTimes: skip,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Referer": cdn + "/",
                "Origin": cdn
            },
            subtitles: subtitles
        });
        log("getStreamLink result: " + result);
        return result;
    } catch (e) {
        log("getStreamLink[err]: " + e);
        return JSON.stringify({ url: "", isEmbed: false, headers: {}, subtitles: [] });
    }
}

function parseDetailResponse(html, url, datasend) {
    log("parseDetailResponse: " + url);
    return getStreamLink(url, datasend);
}

function parseEmbedResponse(html, url, datasend) {
    log("parseEmbedResponse: " + url);
    return getStreamLink(url, datasend);
}
// ===== HÀM TẠO XỬ LÝ STREAM PHIM END ======

// ==== HÀM TẠO CUSTOM SCRIPT BEGIN ====

// ==== HÀM TẠO CUSTOM SCRIPT END ====


// ==== HIDEMENU ====
// ## Hàm Hỗ Trợ. Hide function
function iframe64(url){
  var html = `
  <html><style>body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }iframe { width: 100%; height: 100%; object-fit: contain; }</style><body style='margin:0;padding:0;background:#000;'><iframe id='player' src='${url}' scrolling='no' frameborder='0' class='openloadvideo lab-pinned-child' allowfullscreen='true' webkitallowfullscreen='true' mozallowfullscreen='true' name='watch'></iframe></body></html>
  `;
  return "data:text/html;base64," + BASE64.encode(html);
  
}
  
  function getUrlDetail(slug) {
      try {
          log("getUrlDetail input=" + slug);
          if (!slug) return "";
          if (slug.indexOf('http') === 0) {
              log("getUrlDetail passthrough=" + slug);
              return slug;
          }
          var detailUrl = slug.charAt(0) === "/" ? BASEURL + slug : BASEURL + "/" + slug;
          log("getUrlDetail output=" + detailUrl);
           if (isPhim4kUrl(detailUrl)) {
               log("getUrlDetail keep primary source");
               return detailUrl;
           }
           if (!USE_PHIMAPI && phim4kProbeDetail(detailUrl)) {
              log("getUrlDetail use phim4k");
              return detailUrl;
          }
          var fallbackDetail = phimApiDetailUrlFromTitle(detailUrl);
          if (fallbackDetail) {
              log("getUrlDetail use phimapi=" + fallbackDetail);
              return fallbackDetail;
          }
          log("getUrlDetail fallback not found, keep original");
          return detailUrl;
      } catch (e) {
          //log("getUrlDetail[err]:\n " + e);
          return "";
      }
  }
  function getUrlCategories() { 
      try {
         // log("getUrlCategories[url]: \n" + BASEURL);
          return BASEURL; 
      } catch (e) {
        //  log("getUrlCategories[err]:\n " + e);
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
  }
  // Tạo thẻ chủ đè ở menu home lấy dữ liệu ben dưới
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
  // Tạo thẻ chủ đề filter..
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
  // Hàm chuyển đổi text html %20 sang text thuần
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
// ==== HIDEMENU =====


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
