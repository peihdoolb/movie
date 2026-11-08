package com.peihdoolb.movie.ui.player

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.annotation.OptIn
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.ui.PlayerView
import com.peihdoolb.movie.R

class VideoPlayerActivity : ComponentActivity() {

    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null

    @OptIn(UnstableApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        val streamUrl = intent.getStringExtra("EXTRA_URL") ?: ""
        val title = intent.getStringExtra("EXTRA_TITLE") ?: ""

        val httpDataSourceFactory = DefaultHttpDataSource.Factory()
            .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
            .setAllowCrossProtocolRedirects(true)

        val mediaSourceFactory = DefaultMediaSourceFactory(httpDataSourceFactory)

        player = ExoPlayer.Builder(this)
            .setMediaSourceFactory(mediaSourceFactory)
            .build()

        playerView = PlayerView(this).apply {
            this.player = this@VideoPlayerActivity.player
            setShowNextButton(false)
            setShowPreviousButton(false)
        }
        setContentView(playerView)

        if (streamUrl.isNotEmpty()) {
            val mediaItemBuilder = MediaItem.Builder().setUri(streamUrl)
            if (streamUrl.contains(".m3u8", ignoreCase = true)) {
                mediaItemBuilder.setMimeType(MimeTypes.APPLICATION_M3U8)
            }
            player?.setMediaItem(mediaItemBuilder.build())
            player?.prepare()
            player?.playWhenReady = true
        }
    }

    override fun onPause() {
        super.onPause()
        player?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }
}
