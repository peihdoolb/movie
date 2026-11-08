package com.peihdoolb.movie.data.repository

import com.peihdoolb.movie.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
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
    private val imageUrl = "https://phimimg.com/"

    suspend fun getHomeMovies(page: Int = 1): List<MovieItem> = withContext(Dispatchers.IO) {
        try {
            val url = "$baseUrl/danh-sach/phim-moi-cap-nhat?page=$page"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val apiResponse = json.decodeFromString<ApiResponse>(body)
                return@withContext apiResponse.items.map {
                    val p = if (it.posterUrl.startsWith("http")) it.posterUrl else imageUrl + it.posterUrl
                    val t = if (it.thumbUrl.startsWith("http")) it.thumbUrl else imageUrl + it.thumbUrl
                    MovieItem(
                        id = it.slug,
                        name = it.name,
                        originName = it.originName,
                        poster = p,
                        thumb = t,
                        year = it.year
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
            val url = "$baseUrl/v1/api/tim-kiem?keyword=${java.net.URLEncoder.encode(keyword, "UTF-8")}&limit=20"
            val request = Request.Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext emptyList()
                val body = response.body?.string() ?: return@withContext emptyList()
                val apiResponse = json.decodeFromString<ApiResponse>(body)
                return@withContext apiResponse.items.map {
                    val p = if (it.posterUrl.startsWith("http")) it.posterUrl else imageUrl + it.posterUrl
                    val t = if (it.thumbUrl.startsWith("http")) it.thumbUrl else imageUrl + it.thumbUrl
                    MovieItem(
                        id = it.slug,
                        name = it.name,
                        originName = it.originName,
                        poster = p,
                        thumb = t,
                        year = it.year
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
                .header("User-Agent", "Mozilla/5.0")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body?.string() ?: return@withContext null
                val apiResponse = json.decodeFromString<ApiResponse>(body)
                val m = apiResponse.movie ?: return@withContext null

                val episodes = mutableListOf<EpisodeItem>()
                apiResponse.episodes.forEach { s ->
                    val sName = s.serverName.ifEmpty { "Server VIP" }
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

                val p = if (m.posterUrl.startsWith("http")) m.posterUrl else imageUrl + m.posterUrl
                val t = if (m.thumbUrl.startsWith("http")) m.thumbUrl else imageUrl + m.thumbUrl

                return@withContext MovieDetail(
                    id = m.slug,
                    name = m.name,
                    originName = m.originName,
                    description = m.content,
                    poster = p,
                    thumb = t,
                    year = m.year,
                    episodes = episodes
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun getCustomRepository(repoUrl: String): RepositoryManifest? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url(repoUrl)
                .header("User-Agent", "Mozilla/5.0")
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) return@withContext null
                val body = response.body?.string() ?: return@withContext null
                return@withContext json.decodeFromString<RepositoryManifest>(body)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}
