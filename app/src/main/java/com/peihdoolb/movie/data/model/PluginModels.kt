package com.peihdoolb.movie.data.model

import kotlinx.serialization.Serializable

@Serializable
data class PluginInfo(
    val id: String,
    val name: String,
    val version: String = "1.0.0",
    val description: String = "",
    val entry: String = "",
    val filename: String = "",
    val author: String = "",
    val language: String = "vi",
    val isAdult: Boolean = false,
    val isEnabled: Boolean = true
)

@Serializable
data class RepositoryManifest(
    val name: String,
    val description: String = "",
    val version: String = "1.0.0",
    val scrapers: List<PluginInfo> = emptyList(),
    val plugins: List<PluginInfo> = emptyList()
)
