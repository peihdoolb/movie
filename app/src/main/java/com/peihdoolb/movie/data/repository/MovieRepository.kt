package com.peihdoolb.movie.data.repository

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.peihdoolb.movie.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.net.URLEncoder
import java.util.concurrent.TimeUnit
import java.util.regex.Pattern

class MovieRepository {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
    }

    private val baseUrl = "https://phimapi.com"
    private val defaultCdn = "https://phimimg.com/"

    var availableSources by mutableStateOf<List<MovieSource>>(listOf(
        MovieSource(
            id = "kkphim",
            name = "KKPhim VIP",
            description = "Kho phim số 1, cập nhật liên tục, server m3u8 siêu tốc",
            type = "api",
            isDefault = true
        ),
        MovieSource(
            id = "hh3d",
            name = "Hoạt Hình 3D",
            description = "Chuyên hoạt hình 3D Donghua Trung Quốc vietsub / thuyết minh",
            icon = "https://vaxplugin.alokillgtv.workers.dev/img/icon/hh3d.png",
            type = "vax"
        ),
        MovieSource(
            id = "nguoncnew",
            name = "Nguồn C Phim",
            description = "Kho phim NguonC m3u8 tốc độ cao, đa dạng thể loại",
            icon = "https://vaxplugin.alokillgtv.workers.dev/img/icon/nguoncnew.png",
            type = "api"
        )
    ))

    var currentSource by mutableStateOf<MovieSource>(availableSources[0])

    fun init(context: Context) {
        val plugins = loadVaxPluginsFromAssets(context)
        if (plugins.isNotEmpty()) {
            val list = mutableListOf<MovieSource>()

            // 1. KKPhim VIP (Top / Default)
            list.add(
                MovieSource(
                    id = "kkphim",
                    name = "KKPhim VIP",
                    description = "Kho phim số 1, cập nhật liên tục, server m3u8 siêu tốc",
                    type = "api",
                    isDefault = true
                )
            )

            // 2. HH3D (Hoạt Hình 3D)
            list.add(
                MovieSource(
                    id = "hh3d",
                    name = "Hoạt Hình 3D",
                    description = "Chuyên hoạt hình 3D Donghua Trung Quốc vietsub / thuyết minh",
                    icon = "https://vaxplugin.alokillgtv.workers.dev/img/icon/hh3d.png",
                    type = "vax"
                )
            )

            // 3. Nguồn C Phim
            list.add(
                MovieSource(
                    id = "nguoncnew",
                    name = "Nguồn C Phim",
                    description = "Kho phim NguonC m3u8 tốc độ cao, đa dạng thể loại",
                    icon = "https://vaxplugin.alokillgtv.workers.dev/img/icon/nguoncnew.png",
                    type = "api"
                )
            )

            // 4. Add all other 88 sources from moviex.json
            plugins.forEach { plugin ->
                if (plugin.id != "kkphim" && plugin.id != "hh3d" && plugin.id != "nguoncnew") {
                    val cleanName = plugin.name
                        .replace("(MOVIE)", "")
                        .replace("[MOVIE]", "")
                        .replace("(ANIME)", "")
                        .replace("[ANIME]", "")
                        .trim()
                    list.add(
                        MovieSource(
                            id = plugin.id,
                            name = cleanName,
                            description = plugin.info.ifEmpty { "Nguồn phim Vax Player" },
                            icon = plugin.iconUrl,
                            type = "vax"
                        )
                    )
                }
            }

            availableSources = list
            currentSource = list.find { it.id == currentSource.id } ?: list.first()
        }
    }

    fun getCategoriesForCurrentSource(): List<Pair<String, String>> {
        return when (currentSource.id) {
            "hh3d" -> listOf(
                "all" to "Tất cả",
                "ongoing" to "Đang Chiếu",
                "movies" to "Phim Lẻ / OVA",
                "completed" to "Hoàn Thành"
            )
            "nguoncnew", "nguonc" -> listOf(
                "all" to "Tất cả",
                "newest" to "Phim Mới",
                "phim-bo" to "Phim Bộ",
                "phim-le" to "Phim Lẻ",
                "hoat-hinh" to "Hoạt Hình"
            )
            "animevv", "anidoki", "animehay", "anime47", "animet", "cartoon" -> listOf(
                "all" to "Tất cả",
                "newest" to "Anime Mới",
                "hoat-hinh" to "Anime Hot",
                "phim-bo" to "Anime Bộ",
                "phim-le" to "Anime Chiếu Rạp"
            )
            "dramabox", "pinedrama", "shorthot", "minidrama", "flextv", "shortmax", "allshort", "shortanywhere", "netshort", "shortflix" -> listOf(
                "all" to "Tất cả",
                "phim-bo" to "Drama Hot",
                "newest" to "Tập Mới",
                "phim-le" to "Phim Ngắn"
            )
            else -> listOf(
                "all" to "Tất cả",
                "newest" to "Phim Mới",
                "phim-bo" to "Phim Bộ",
                "phim-le" to "Phim Lẻ",
                "hoat-hinh" to "Hoạt Hình",
                "tv-shows" to "TV Shows"
            )
        }
    }

    suspend fun getHomeBanners(): List<MovieItem> = withContext(Dispatchers.IO) {
        when (currentSource.id) {
            "hh3d" -> {
                val list = getHh3dList("ongoing", 1)
                list.take(5)
            }
            "nguoncnew", "nguonc" -> {
                val list = getNguonCList("phim-moi-cap-nhat", 1)
                list.take(5)
            }
            "animevv", "anidoki", "animehay", "anime47", "animet", "cartoon" -> {
                val list = getKkphimCategory("hoat-hinh", 1)
                list.take(5)
            }
            "dramabox", "pinedrama", "shorthot", "minidrama", "flextv", "shortmax" -> {
                val list = getKkphimCategory("phim-bo", 1)
                list.take(5)
            }
            else -> {
                val movies = getNewestMovies(1)
                movies.take(5)
            }
        }
    }

    suspend fun getHomeSections(): List<HomeSection> = withContext(Dispatchers.IO) {
        coroutineScope {
            when (currentSource.id) {
                "hh3d" -> {
                    val ongoingDeferred = async { getHh3dList("ongoing", 1) }
                    val moviesDeferred = async { getHh3dList("movies", 1) }
                    val completedDeferred = async { getHh3dList("completed", 1) }

                    listOf(
                        HomeSection("ongoing", "🔥 Hoạt Hình 3D Đang Chiếu", ongoingDeferred.await()),
                        HomeSection("movies", "🎬 3D Chiếu Rạp & OVA", moviesDeferred.await()),
                        HomeSection("completed", "🏆 Hoạt Hình 3D Hoàn Thành", completedDeferred.await())
                    ).filter { it.movies.isNotEmpty() }
                }
                "nguoncnew", "nguonc" -> {
                    val newestDeferred = async { getNguonCList("phim-moi-cap-nhat", 1) }
                    val seriesDeferred = async { getNguonCList("the-loai/phim-bo", 1) }
                    val singleDeferred = async { getNguonCList("the-loai/phim-le", 1) }
                    val animeDeferred = async { getNguonCList("the-loai/hoat-hinh", 1) }

                    listOf(
                        HomeSection("newest", "🌟 Nguồn C: Mới Cập Nhật", newestDeferred.await()),
                        HomeSection("phim-bo", "📺 Nguồn C: Phim Bộ Đang Hot", seriesDeferred.await()),
                        HomeSection("phim-le", "🎬 Nguồn C: Phim Lẻ Chiếu Rạp", singleDeferred.await()),
                        HomeSection("hoat-hinh", "🧸 Nguồn C: Hoạt Hình & Anime", animeDeferred.await())
                    ).filter { it.movies.isNotEmpty() }
                }
                "animevv", "anidoki", "animehay", "anime47", "animet", "cartoon" -> {
                    val animeDeferred = async { getKkphimCategory("hoat-hinh", 1) }
                    val seriesDeferred = async { getKkphimCategory("phim-bo", 1) }
                    val newestDeferred = async { getNewestMovies(1) }

                    listOf(
                        HomeSection("hoat-hinh", "🌟 [${currentSource.name}] Anime Thịnh Hành", animeDeferred.await()),
                        HomeSection("newest", "🔥 [${currentSource.name}] Anime Mới Cập Nhật", newestDeferred.await()),
                        HomeSection("phim-bo", "🎌 [${currentSource.name}] Anime Bộ Tuyển Chọn", seriesDeferred.await())
                    ).filter { it.movies.isNotEmpty() }
                }
                "dramabox", "pinedrama", "shorthot", "minidrama", "flextv", "shortmax", "allshort", "shortanywhere", "netshort", "shortflix" -> {
                    val seriesDeferred = async { getKkphimCategory("phim-bo", 1) }
                    val singleDeferred = async { getKkphimCategory("phim-le", 1) }
                    val newestDeferred = async { getNewestMovies(1) }

                    listOf(
                        HomeSection("phim-bo", "🌟 [${currentSource.name}] Drama & Phim Ngắn Hot", seriesDeferred.await()),
                        HomeSection("newest", "🔥 [${currentSource.name}] Tập Mới Phát Sóng", newestDeferred.await()),
                        HomeSection("phim-le", "🎬 [${currentSource.name}] Mini Series Hoàn Chỉnh", singleDeferred.await())
                    ).filter { it.movies.isNotEmpty() }
                }
                "kkphim" -> {
                    val newestDeferred = async { getNewestMovies(1) }
                    val seriesDeferred = async { getKkphimCategory("phim-bo", 1) }
                    val singleDeferred = async { getKkphimCategory("phim-le", 1) }
                    val animeDeferred = async { getKkphimCategory("hoat-hinh", 1) }
                    val tvShowsDeferred = async { getKkphimCategory("tv-shows", 1) }

                    listOf(
                        HomeSection("newest", "🌟 KKPhim: Phim Mới Cập Nhật", newestDeferred.await()),
                        HomeSection("phim-bo", "📺 KKPhim: Phim Bộ Đang Hot", seriesDeferred.await()),
                        HomeSection("phim-le", "🎬 KKPhim: Phim Lẻ Chiếu Rạp", singleDeferred.await()),
                        HomeSection("hoat-hinh", "🧸 KKPhim: Hoạt Hình & Anime", animeDeferred.await()),
                        HomeSection("tv-shows", "🎭 KKPhim: TV Shows & Gameshow", tvShowsDeferred.await())
                    ).filter { it.movies.isNotEmpty() }
                }
                else -> {
                    val newestDeferred = async { getNewestMovies(1) }
                    val seriesDeferred = async { getKkphimCategory("phim-bo", 1) }
                    val singleDeferred = async { getKkphimCategory("phim-le", 1) }
                    val animeDeferred = async { getKkphimCategory("hoat-hinh", 1) }

                    listOf(
                        HomeSection("newest", "🌟 [${currentSource.name}] Tuyển Chọn Nổi Bật", newestDeferred.await()),
                        HomeSection("phim-bo", "📺 [${currentSource.name}] Series Dài Tập Hấp Dẫn", seriesDeferred.await()),
                        HomeSection("phim-le", "🎬 [${currentSource.name}] Bom Tấn Điện Ảnh Mới", singleDeferred.await()),
                        HomeSection("hoat-hinh", "🧸 [${currentSource.name}] Hoạt Hình Đặc Sắc", animeDeferred.await())
                    ).filter { it.movies.isNotEmpty() }
                }
            }
        }
    }

    suspend fun getCategoryList(category: String, page: Int): List<MovieItem> = withContext(Dispatchers.IO) {
        when (currentSource.id) {
            "hh3d" -> {
                when (category) {
                    "movies" -> getHh3dList("movies", page)
                    "completed" -> getHh3dList("completed", page)
                    else -> getHh3dList("ongoing", page)
                }
            }
            "nguoncnew", "nguonc" -> {
                when (category) {
                    "phim-bo" -> getNguonCList("the-loai/phim-bo", page)
                    "phim-le" -> getNguonCList("the-loai/phim-le", page)
                    "hoat-hinh" -> getNguonCList("the-loai/hoat-hinh", page)
                    else -> getNguonCList("phim-moi-cap-nhat", page)
                }
            }
            else -> {
                if (category == "newest" || category == "all") {
                    getNewestMovies(page)
                } else {
                    getKkphimCategory(category, page)
                }
            }
        }
    }

    suspend fun getHh3dList(type: String, page: Int): List<MovieItem> = withContext(Dispatchers.IO) {
        try {
            val endpoint = when (type) {
                "movies" -> "movies"
                "completed" -> "completed"
                else -> "ongoing"
            }
            val url = "https://hoathinh3d.pw/wp-json/halim/v1/$endpoint?page=$page&per_page=20"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val parsed = json.decodeFromString<HalimResponse>(body)
                return@withContext parsed.items.map { item ->
                    val slug = if (item.permalink.isNotEmpty()) {
                        item.permalink.trimEnd('/').substringAfterLast('/')
                    } else "hh3d-${item.id}"

                    MovieItem(
                        id = slug,
                        name = item.title,
                        originName = "Hoạt Hình 3D",
                        poster = item.posterUrl,
                        thumb = item.posterUrl,
                        year = 2024,
                        quality = "3D",
                        episodeCurrent = item.latestEpisode.ifEmpty { "Tập mới" },
                        lang = "Vietsub",
                        type = "anime"
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getNguonCList(path: String, page: Int): List<MovieItem> = withContext(Dispatchers.IO) {
        try {
            val url = "https://phim.nguonc.com/api/films/$path?page=$page"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val parsed = json.decodeFromString<NguonCListResponse>(body)
                return@withContext parsed.items.map { item ->
                    MovieItem(
                        id = item.slug,
                        name = item.name,
                        originName = item.originalName,
                        poster = item.posterUrl.ifEmpty { item.thumbUrl },
                        thumb = item.thumbUrl.ifEmpty { item.posterUrl },
                        year = 2024,
                        quality = item.quality.ifEmpty { "HD" },
                        episodeCurrent = item.currentEpisode,
                        lang = item.language.ifEmpty { "Vietsub" }
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getKkphimCategory(category: String, page: Int): List<MovieItem> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/v1/api/danh-sach/$category?page=$page"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Android; Mobile)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val parsed = json.decodeFromString<CategoryApiResponse>(body)
                val cdn = parsed.data?.cdnImage ?: defaultCdn
                val cdnNormalized = if (cdn.endsWith("/")) cdn else "$cdn/"

                return@withContext (parsed.data?.items ?: emptyList()).map { item ->
                    val poster = when {
                        item.posterUrl.startsWith("http") -> item.posterUrl
                        item.posterUrl.isNotEmpty() -> cdnNormalized + item.posterUrl
                        item.thumbUrl.startsWith("http") -> item.thumbUrl
                        else -> cdnNormalized + item.thumbUrl
                    }
                    val thumb = when {
                        item.thumbUrl.startsWith("http") -> item.thumbUrl
                        item.thumbUrl.isNotEmpty() -> cdnNormalized + item.thumbUrl
                        else -> poster
                    }
                    MovieItem(
                        id = item.slug,
                        name = item.name,
                        originName = item.originName,
                        poster = poster,
                        thumb = thumb,
                        year = item.year,
                        quality = item.quality.ifEmpty { "HD" },
                        episodeCurrent = item.episodeCurrent,
                        lang = item.lang.ifEmpty { "Vietsub" }
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    private suspend fun getNewestMovies(page: Int): List<MovieItem> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/danh-sach/phim-moi-cap-nhat?page=$page"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Android; Mobile)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val apiResponse = json.decodeFromString<ApiResponse>(body)
                return@withContext apiResponse.items.map {
                    val p = if (it.posterUrl.startsWith("http")) it.posterUrl else defaultCdn + it.posterUrl
                    val t = if (it.thumbUrl.startsWith("http")) it.thumbUrl else defaultCdn + it.thumbUrl
                    MovieItem(
                        id = it.slug,
                        name = it.name,
                        originName = it.originName,
                        poster = p,
                        thumb = t,
                        year = it.year,
                        quality = it.quality.ifEmpty { "HD" },
                        lang = it.lang.ifEmpty { "Vietsub" }
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun searchMovies(keyword: String): List<MovieItem> = withContext(Dispatchers.IO) {
        try {
            val encoded = URLEncoder.encode(keyword, "UTF-8")
            val url = "$baseUrl/v1/api/tim-kiem?keyword=$encoded&limit=24"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Android; Mobile)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val parsed = json.decodeFromString<CategoryApiResponse>(body)
                val cdn = parsed.data?.cdnImage ?: defaultCdn
                val cdnNormalized = if (cdn.endsWith("/")) cdn else "$cdn/"

                return@withContext (parsed.data?.items ?: emptyList()).map { item ->
                    val poster = when {
                        item.posterUrl.startsWith("http") -> item.posterUrl
                        item.posterUrl.isNotEmpty() -> cdnNormalized + item.posterUrl
                        item.thumbUrl.startsWith("http") -> item.thumbUrl
                        else -> cdnNormalized + item.thumbUrl
                    }
                    val thumb = when {
                        item.thumbUrl.startsWith("http") -> item.thumbUrl
                        item.thumbUrl.isNotEmpty() -> cdnNormalized + item.thumbUrl
                        else -> poster
                    }
                    MovieItem(
                        id = item.slug,
                        name = item.name,
                        originName = item.originName,
                        poster = poster,
                        thumb = thumb,
                        year = item.year,
                        quality = item.quality.ifEmpty { "HD" },
                        episodeCurrent = item.episodeCurrent,
                        lang = item.lang.ifEmpty { "Vietsub" }
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun getMovieDetail(slug: String): MovieDetail? = withContext(Dispatchers.IO) {
        // 1. Try KKPhim first (fastest m3u8 direct streams)
        val kkDetail = getKkphimDetail(slug)
        if (kkDetail != null && kkDetail.episodes.isNotEmpty()) {
            return@withContext kkDetail
        }

        // 2. If HH3D or KKPhim failed, try HH3D
        if (currentSource.id == "hh3d" || slug.contains("hh3d") || slug.contains("tien-nghich")) {
            val hhDetail = getHh3dDetail(slug)
            if (hhDetail != null && hhDetail.episodes.isNotEmpty()) {
                return@withContext hhDetail
            }
        }

        // 3. Try NguonC
        val ncDetail = getNguonCDetail(slug)
        if (ncDetail != null && ncDetail.episodes.isNotEmpty()) {
            return@withContext ncDetail
        }

        kkDetail
    }

    suspend fun getKkphimDetail(slug: String): MovieDetail? = withContext(Dispatchers.IO) {
        try {
            val cleanSlug = slug.trimEnd('/').substringAfterLast('/')
            val url = "$baseUrl/phim/$cleanSlug"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0 (Android; Mobile)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body?.string() ?: return@withContext null
                val apiResponse = json.decodeFromString<ApiResponse>(body)
                val m = apiResponse.movie ?: return@withContext null

                val episodes = mutableListOf<EpisodeItem>()
                val serverNames = mutableListOf<String>()

                apiResponse.episodes.forEach { s ->
                    val sName = s.serverName.ifEmpty { "Server VIP" }
                    if (!serverNames.contains(sName)) serverNames.add(sName)

                    s.serverData.forEach { ep ->
                        episodes.add(
                            EpisodeItem(
                                id = "${m.slug}|${ep.slug}|${ep.name}",
                                name = ep.name,
                                slug = ep.slug,
                                server = sName,
                                m3u8 = ep.linkM3u8,
                                embed = ep.linkEmbed
                            )
                        )
                    }
                }

                val p = if (m.posterUrl.startsWith("http")) m.posterUrl else defaultCdn + m.posterUrl
                val t = if (m.thumbUrl.startsWith("http")) m.thumbUrl else defaultCdn + m.thumbUrl

                return@withContext MovieDetail(
                    id = m.slug,
                    name = m.name,
                    originName = m.originName,
                    description = m.content,
                    poster = p,
                    thumb = t,
                    year = m.year,
                    time = m.time,
                    quality = m.quality.ifEmpty { "HD" },
                    lang = m.lang.ifEmpty { "Vietsub" },
                    episodeCurrent = m.episodeCurrent,
                    episodes = episodes,
                    servers = serverNames
                )
            }
        } catch (e: Exception) {
            null
        }
    }

    suspend fun getHh3dDetail(slug: String): MovieDetail? = withContext(Dispatchers.IO) {
        try {
            val cleanSlug = slug.trimEnd('/').substringAfterLast('/')
            val targetUrl = if (slug.startsWith("http")) slug else "https://hoathinh3d.pw/$cleanSlug"
            val request = Request.Builder()
                .url(targetUrl)
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val html = response.body?.string() ?: return@withContext null

                val titleM = Pattern.compile("<meta[^>]+property=[\"']og:title[\"'][^>]+content=[\"']([^\"']+)[\"']").matcher(html)
                val title = if (titleM.find()) titleM.group(1).replace(" | HH3D", "").trim() else cleanSlug

                val imgM = Pattern.compile("<meta[^>]+property=[\"']og:image[\"'][^>]+content=[\"']([^\"']+)[\"']").matcher(html)
                val poster = if (imgM.find()) imgM.group(1).trim() else ""

                val descM = Pattern.compile("<meta[^>]+property=[\"']og:description[\"'][^>]+content=[\"']([^\"']+)[\"']").matcher(html)
                val desc = if (descM.find()) descM.group(1).trim() else ""

                val episodes = mutableListOf<EpisodeItem>()
                val epPattern = Pattern.compile("<a[^>]*href=[\"']([^\"']+)[\"'][^>]*>[\\s\\S]*?<span[^>]*class=[\"'][^\"']*halim-btn[^\"']*[\"'][^>]*data-post-id=[\"'](\\d+)[\"'][^>]*data-server=[\"'](\\d+)[\"'][^>]*data-episode-slug=[\"']([^\"']+)[\"'][^>]*>([\\s\\S]*?)</span>")
                val epMatcher = epPattern.matcher(html)

                while (epMatcher.find()) {
                    val epName = epMatcher.group(5).trim()
                    val epSlug = epMatcher.group(4)
                    val postId = epMatcher.group(2)
                    val serverId = epMatcher.group(3)

                    // Provide player link or proxy embed
                    val playerUrl = "https://hoathinh3d.pw/wp-content/themes/halimmovies/player.php?episode_slug=$epSlug&server_id=$serverId&subsv_id=&post_id=$postId&pe=embed"
                    episodes.add(
                        EpisodeItem(
                            id = "$cleanSlug|$epSlug|$epName",
                            name = "Tập $epName",
                            slug = epSlug,
                            server = "Server HH3D",
                            m3u8 = playerUrl,
                            embed = playerUrl
                        )
                    )
                }

                return@withContext MovieDetail(
                    id = cleanSlug,
                    name = title,
                    originName = "Hoạt Hình 3D",
                    description = desc,
                    poster = poster,
                    thumb = poster,
                    year = 2024,
                    quality = "3D",
                    lang = "Vietsub",
                    episodes = episodes,
                    servers = listOf("Server HH3D")
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getNguonCDetail(slug: String): MovieDetail? = withContext(Dispatchers.IO) {
        try {
            val cleanSlug = slug.trimEnd('/').substringAfterLast('/')
            val url = "https://phim.nguonc.com/api/film/$cleanSlug"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body?.string() ?: return@withContext null
                val parsed = json.decodeFromString<NguonCDetailResponse>(body)
                val m = parsed.movie ?: return@withContext null

                val episodes = mutableListOf<EpisodeItem>()
                val serverNames = mutableListOf<String>()

                m.episodes.forEach { s ->
                    val sName = s.serverName.ifEmpty { "Server VIP" }
                    if (!serverNames.contains(sName)) serverNames.add(sName)

                    s.items.forEach { ep ->
                        val stream = ep.m3u8.ifEmpty { ep.embed }
                        episodes.add(
                            EpisodeItem(
                                id = "${m.slug}|${ep.slug}|${ep.name}",
                                name = ep.name,
                                slug = ep.slug,
                                server = sName,
                                m3u8 = stream,
                                embed = ep.embed
                            )
                        )
                    }
                }

                return@withContext MovieDetail(
                    id = m.slug,
                    name = m.name,
                    originName = m.originalName,
                    description = m.description,
                    poster = m.posterUrl.ifEmpty { m.thumbUrl },
                    thumb = m.thumbUrl.ifEmpty { m.posterUrl },
                    year = 2024,
                    time = m.time,
                    quality = m.quality.ifEmpty { "HD" },
                    lang = m.language.ifEmpty { "Vietsub" },
                    episodeCurrent = m.currentEpisode,
                    episodes = episodes,
                    servers = serverNames
                )
            }
        } catch (e: Exception) {
            null
        }
    }

    fun loadVaxPluginsFromAssets(context: Context): List<VaxPlugin> {
        return try {
            val stream = context.assets.open("moviex.json")
            val content = stream.bufferedReader().use { it.readText() }
            val response = json.decodeFromString<VaxStoreResponse>(content)
            response.plugins
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }
}
