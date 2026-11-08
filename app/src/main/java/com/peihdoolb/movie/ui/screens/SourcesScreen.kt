package com.peihdoolb.movie.ui.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.peihdoolb.movie.data.model.MovieSource
import com.peihdoolb.movie.data.model.VaxPlugin
import com.peihdoolb.movie.data.repository.MovieRepository

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SourcesScreen(
    repository: MovieRepository
) {
    val context = LocalContext.current
    var query by remember { mutableStateOf("") }
    var plugins by remember { mutableStateOf<List<VaxPlugin>>(emptyList()) }
    val currentSource = repository.currentSource

    LaunchedEffect(Unit) {
        plugins = repository.loadVaxPluginsFromAssets(context)
    }

    val filteredPlugins = remember(query, plugins) {
        if (query.trim().isEmpty()) {
            plugins
        } else {
            val q = query.trim().lowercase()
            plugins.filter {
                it.name.lowercase().contains(q) ||
                it.id.lowercase().contains(q) ||
                it.info.lowercase().contains(q)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Kho Plugin & Nguồn Phim",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "Đang chọn: ${currentSource.name} (${plugins.size} nguồn khả dụng)",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp)
        ) {
            // Search Input
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Tìm kiếm nguồn phim trong ${plugins.size} nguồn...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                trailingIcon = {
                    if (query.isNotEmpty()) {
                        IconButton(onClick = { query = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Xóa")
                        }
                    }
                },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface
                ),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 24.dp)
            ) {
                items(filteredPlugins, key = { it.id }) { plugin ->
                    val isCurrentActive = currentSource.id == plugin.id
                    Card(
                        onClick = {
                            val target = repository.availableSources.find { it.id == plugin.id }
                                ?: MovieSource(
                                    id = plugin.id,
                                    name = plugin.name.replace("(MOVIE)", "").replace("[MOVIE]", "").trim(),
                                    description = plugin.info.ifEmpty { "Nguồn phim Vax Player" },
                                    icon = plugin.iconUrl,
                                    type = "vax"
                                )
                            repository.currentSource = target
                            Toast.makeText(context, "Đã chọn nguồn: ${target.name}", Toast.LENGTH_SHORT).show()
                        },
                        colors = CardDefaults.cardColors(
                            containerColor = if (isCurrentActive) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface
                        ),
                        border = if (isCurrentActive) BorderStroke(1.5.dp, MaterialTheme.colorScheme.primary) else null,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            if (plugin.iconUrl.isNotEmpty()) {
                                AsyncImage(
                                    model = plugin.iconUrl,
                                    contentDescription = plugin.name,
                                    modifier = Modifier.size(40.dp)
                                )
                            }
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                ) {
                                    Text(
                                        text = plugin.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = if (isCurrentActive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                                    )
                                    if (isCurrentActive) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primary,
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "ĐANG DÙNG",
                                                color = Color.White,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                            )
                                        }
                                    }
                                    if (plugin.isVip) {
                                        Surface(
                                            color = Color(0xFFFFB300),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "VIP",
                                                color = Color.Black,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                            )
                                        }
                                    }
                                }
                                if (plugin.info.isNotEmpty()) {
                                    Text(
                                        text = plugin.info.replace("\n", " "),
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f),
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                            if (isCurrentActive) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    contentDescription = "Đang kích hoạt",
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            } else {
                                Icon(
                                    Icons.Default.RadioButtonUnchecked,
                                    contentDescription = "Chưa chọn",
                                    tint = Color.Gray.copy(alpha = 0.5f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
