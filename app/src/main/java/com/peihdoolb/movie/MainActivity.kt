package com.peihdoolb.movie

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.peihdoolb.movie.data.repository.MovieRepository
import com.peihdoolb.movie.ui.player.VideoPlayerActivity
import com.peihdoolb.movie.ui.screens.DetailScreen
import com.peihdoolb.movie.ui.screens.HomeScreen
import com.peihdoolb.movie.ui.screens.SearchScreen
import com.peihdoolb.movie.ui.screens.SettingsScreen
import com.peihdoolb.movie.ui.theme.PeihMovieTheme

class MainActivity : ComponentActivity() {
    private val repository = MovieRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PeihMovieTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: "home"

                Scaffold(
                    bottomBar = {
                        if (currentRoute in listOf("home", "search", "settings")) {
                            NavigationBar(
                                containerColor = MaterialTheme.colorScheme.surface
                            ) {
                                NavigationBarItem(
                                    icon = { Icon(Icons.Default.Home, contentDescription = "Trang chủ") },
                                    label = { Text("Trang chủ") },
                                    selected = currentRoute == "home",
                                    onClick = {
                                        navController.navigate("home") {
                                            popUpTo("home") { inclusive = true }
                                        }
                                    }
                                )
                                NavigationBarItem(
                                    icon = { Icon(Icons.Default.Search, contentDescription = "Tìm kiếm") },
                                    label = { Text("Tìm kiếm") },
                                    selected = currentRoute == "search",
                                    onClick = {
                                        navController.navigate("search") {
                                            popUpTo("home")
                                        }
                                    }
                                )
                                NavigationBarItem(
                                    icon = { Icon(Icons.Default.Settings, contentDescription = "Cài đặt") },
                                    label = { Text("Cài đặt") },
                                    selected = currentRoute == "settings",
                                    onClick = {
                                        navController.navigate("settings") {
                                            popUpTo("home")
                                        }
                                    }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "home",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("home") {
                            HomeScreen(
                                repository = repository,
                                onMovieClick = { slug ->
                                    navController.navigate("detail/$slug")
                                }
                            )
                        }
                        composable("search") {
                            SearchScreen(
                                repository = repository,
                                onMovieClick = { slug ->
                                    navController.navigate("detail/$slug")
                                }
                            )
                        }
                        composable("settings") {
                            SettingsScreen(repository = repository)
                        }
                        composable("detail/{slug}") { backStackEntry ->
                            val slug = backStackEntry.arguments?.getString("slug") ?: ""
                            DetailScreen(
                                movieSlug = slug,
                                repository = repository,
                                onBack = { navController.popBackStack() },
                                onPlay = { url, title ->
                                    val intent = Intent(this@MainActivity, VideoPlayerActivity::class.java).apply {
                                        putExtra("EXTRA_URL", url)
                                        putExtra("EXTRA_TITLE", title)
                                    }
                                    startActivity(intent)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
