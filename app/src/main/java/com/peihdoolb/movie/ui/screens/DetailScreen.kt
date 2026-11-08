package com.peihdoolb.movie.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.peihdoolb.movie.data.model.EpisodeItem
import com.peihdoolb.movie.data.model.MovieDetail
import com.peihdoolb.movie.data.repository.MovieRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailScreen(
    movieSlug: String,
    repository: MovieRepository,
    onBack: () -> Unit,
    onPlay: (url: String, title: String) -> Unit
) {
    var detail by remember { mutableStateOf<MovieDetail?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(movieSlug) {
        scope.launch {
            isLoading = true
            detail = repository.getMovieDetail(movieSlug)
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(detail?.name ?: "Chi tiết phim", maxLines = 1) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Quay lại")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground,
                    navigationIconContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = MaterialTheme.colorScheme.primary
                )
            } else if (detail != null) {
                val movie = detail!!
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            AsyncImage(
                                model = movie.poster.ifEmpty { movie.thumb },
                                contentDescription = movie.name,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .width(130.dp)
                                    .aspectRatio(0.67f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surface)
                            )
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = movie.name,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onBackground
                                )
                                if (movie.originName.isNotEmpty()) {
                                    Text(
                                        text = movie.originName,
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                }
                                if (movie.year > 0) {
                                    Text(
                                        text = "Năm: ${movie.year}",
                                        fontSize = 13.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                                if (movie.episodes.isNotEmpty()) {
                                    Button(
                                        onClick = {
                                            val firstEp = movie.episodes.first()
                                            onPlay(firstEp.m3u8, "${movie.name} - ${firstEp.name}")
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.primary
                                        ),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Xem ngay")
                                    }
                                }
                            }
                        }
                    }

                    if (movie.description.isNotEmpty()) {
                        item {
                            Text(
                                text = "Nội dung phim",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = movie.description.replace(Regex("<[^>]*>"), ""),
                                fontSize = 13.sp,
                                lineHeight = 20.sp,
                                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
                            )
                        }
                    }

                    if (movie.episodes.isNotEmpty()) {
                        item {
                            Text(
                                text = "Danh sách tập (${movie.episodes.size} tập)",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onBackground
                            )
                        }

                        item {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                items(movie.episodes) { ep ->
                                    EpisodeChip(
                                        episode = ep,
                                        onClick = {
                                            onPlay(ep.m3u8, "${movie.name} - ${ep.name}")
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            } else {
                Text(
                    text = "Không tìm thấy thông tin phim",
                    modifier = Modifier.align(Alignment.Center),
                    color = MaterialTheme.colorScheme.onBackground
                )
            }
        }
    }
}

@Composable
fun EpisodeChip(
    episode: EpisodeItem,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier.clickable { onClick() },
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(6.dp),
        tonalElevation = 2.dp
    ) {
        Text(
            text = episode.name,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface
        )
    }
}
