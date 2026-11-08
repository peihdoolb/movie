package com.peihdoolb.movie.data.repository

import android.content.Context
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

    val availableSources = listOf(
        MovieSource(
            id = "kkphim",
            name = "KKPhim VIP",
            description = "Kho phim số 1, cập nhật liên tục, server m3u8 siêu tốc",
            type = "api",
            isDefault = true
        ),
        MovieSource(
            id = "bluphim",
            name = "Blu Phim [Vax]",
            description = "Nguồn phim Bluphim chất lượng cao từ Vax Player",
            type = "vax"
        ),
        MovieSource(
            id = "hh3d",
            name = "Hoạt Hình 3D",
            description = "Chuyên hoạt hình 3D Donghua Trung Quốc vietsub / thuyết minh",
            type = "vax"
        ),
        MovieSource(
            id = "animevv",
            name = "AnimeVV",
            description = "Kho Anime Nhật Bản phong phú, server riêng mượt mà",
            type = "vax"
        ),
        MovieSource(
            id = "vax_all",
            name = "Kho Plugin Vax (88 Nguồn)",
            description = "Duyệt toàn bộ 88 nguồn phim từ hệ thống Vax Player",
            type = "catalog"
        )
    )

    var currentSource: MovieSource = availableSources[0]

    suspend fun getHomeBanners(): List<MovieItem> = withContext(Dispatchers.IO) {
        val movies = getNewestMovies(1)
        movies.take(5)
    }

    suspend fun getHomeSections(): List<HomeSection> = withContext(Dispatchers.IO) {
        coroutineScope {
            val newestDeferred = async { getNewestMovies(1) }
            val seriesDeferred = async { getCategoryList("phim-bo", 1) }
            val singleDeferred = async { getCategoryList("phim-le", 1) }
            val animeDeferred = async { getCategoryList("hoat-hinh", 1) }
            val tvShowsDeferred = async { getCategoryList("tv-shows", 1) }

            listOf(
                HomeSection("newest", "🌟 Phim Mới Cập Nhật", newestDeferred.await()),
                HomeSection("phim-bo", "📺 Phim Bộ Đang Hot", seriesDeferred.await()),
                HomeSection("phim-le", "🎬 Phim Lẻ Chiếu Rạp", singleDeferred.await()),
                HomeSection("hoat-hinh", "🧸 Hoạt Hình & Anime", animeDeferred.await()),
                HomeSection("tv-shows", "🎭 TV Shows & Gameshow", tvShowsDeferred.await())
            ).filter { it.movies.isNotEmpty() }
        }
    }

    suspend fun getCategoryList(category: String, page: Int): List<MovieItem> = withContext(Dispatchers.IO) {
        if (category == "newest") {
            return@withContext getNewestMovies(page)
        }
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
        try {
            val url = "$baseUrl/phim/$slug"
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
            e.printStackTrace()
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
