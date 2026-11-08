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
    val type: String = "movie"
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
    val episodes: List<EpisodeItem> = emptyList()
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
data class StreamSource(
    val name: String,
    val url: String,
    val type: String = "m3u8",
    val headers: Map<String, String> = emptyMap(),
    val subtitles: List<SubtitleItem> = emptyList()
)

@Serializable
data class SubtitleItem(
    val url: String,
    val label: String = "Tiếng Việt",
    val language: String = "vi"
)

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
    val year: Int = 0
)

@Serializable
data class ApiMovieDetail(
    val slug: String,
    val name: String,
    @SerialName("origin_name") val originName: String = "",
    val content: String = "",
    @SerialName("poster_url") val posterUrl: String = "",
    @SerialName("thumb_url") val thumbUrl: String = "",
    val year: Int = 0
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
