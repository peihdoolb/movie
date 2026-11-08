package com.peihdoolb.movie.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MovieItem(
    val id: String,
    val name: String,
    val originName: String = "",
    val poster: String = "",
    val thumb: String = "",
    val year: Int = 0,
    val quality: String = "HD",
    val episodeCurrent: String = "",
    val lang: String = "Vietsub",
    val type: String = "movie"
)

@Serializable
data class HomeSection(
    val id: String,
    val title: String,
    val movies: List<MovieItem>
)

@Serializable
data class MovieDetail(
    val id: String,
    val name: String,
    val originName: String = "",
    val description: String = "",
    val poster: String = "",
    val thumb: String = "",
    val year: Int = 0,
    val time: String = "",
    val quality: String = "HD",
    val lang: String = "Vietsub",
    val episodeCurrent: String = "",
    val episodes: List<EpisodeItem> = emptyList(),
    val servers: List<String> = emptyList()
)

@Serializable
data class EpisodeItem(
    val id: String,
    val name: String,
    val slug: String,
    val server: String,
    val m3u8: String,
    val embed: String = ""
)

@Serializable
data class MovieSource(
    val id: String,
    val name: String,
    val description: String,
    val icon: String = "",
    val type: String = "api",
    val isDefault: Boolean = false
)

@Serializable
data class VaxPlugin(
    val id: String,
    val name: String,
    val version: String = "1.0.0",
    val scriptUrl: String = "",
    val iconUrl: String = "",
    val info: String = "",
    val isVip: Boolean = false,
    val openvax: Boolean = false
)

@Serializable
data class VaxStoreResponse(
    val version: Int = 1,
    val plugins: List<VaxPlugin> = emptyList()
)

// DTOs for KKPhim Newest API (/danh-sach/phim-moi-cap-nhat)
@Serializable
data class ApiResponse(
    val status: Boolean = true,
    val items: List<ApiMovieItem> = emptyList(),
    val movie: ApiMovieDetail? = null,
    val episodes: List<ApiEpisodeServer> = emptyList()
)

@Serializable
data class ApiMovieItem(
    val slug: String,
    val name: String,
    @SerialName("origin_name") val originName: String = "",
    @SerialName("poster_url") val posterUrl: String = "",
    @SerialName("thumb_url") val thumbUrl: String = "",
    val year: Int = 0,
    val quality: String = "HD",
    val lang: String = "Vietsub"
)

// DTOs for Category APIs (/v1/api/danh-sach/{type})
@Serializable
data class CategoryApiResponse(
    val status: String = "success",
    val data: CategoryData? = null
)

@Serializable
data class CategoryData(
    val items: List<CategoryMovieItem> = emptyList(),
    val params: CategoryParams? = null,
    @SerialName("APP_DOMAIN_CDN_IMAGE") val cdnImage: String = "https://phimimg.com"
)

@Serializable
data class CategoryParams(
    val pagination: CategoryPagination? = null
)

@Serializable
data class CategoryPagination(
    val totalItems: Int = 0,
    val totalItemsPerPage: Int = 24,
    val currentPage: Int = 1,
    val totalPages: Int = 1
)

@Serializable
data class CategoryMovieItem(
    val slug: String,
    val name: String,
    @SerialName("origin_name") val originName: String = "",
    @SerialName("poster_url") val posterUrl: String = "",
    @SerialName("thumb_url") val thumbUrl: String = "",
    val year: Int = 0,
    val time: String = "",
    val quality: String = "HD",
    val lang: String = "Vietsub",
    @SerialName("episode_current") val episodeCurrent: String = ""
)

@Serializable
data class ApiMovieDetail(
    val slug: String,
    val name: String,
    @SerialName("origin_name") val originName: String = "",
    val content: String = "",
    @SerialName("poster_url") val posterUrl: String = "",
    @SerialName("thumb_url") val thumbUrl: String = "",
    val year: Int = 0,
    val time: String = "",
    val quality: String = "HD",
    val lang: String = "Vietsub",
    @SerialName("episode_current") val episodeCurrent: String = ""
)

@Serializable
data class ApiEpisodeServer(
    @SerialName("server_name") val serverName: String = "",
    @SerialName("server_data") val serverData: List<ApiEpisodeData> = emptyList()
)

@Serializable
data class ApiEpisodeData(
    val name: String = "",
    val slug: String = "",
    val filename: String = "",
    @SerialName("link_embed") val linkEmbed: String = "",
    @SerialName("link_m3u8") val linkM3u8: String = ""
)
