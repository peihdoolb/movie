// Plugin KKPhim cho JKHX Player / Peih Movie
const BASE_URL = "https://phimapi.com";
const IMAGE_URL = "https://phimimg.com/";

module.exports = {
    getHome: async function(filter, page = 1) {
        try {
            const url = `${BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`;
            const res = await globalThis.fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            const data = await res.json();
            const items = (data.items || []).map(item => ({
                id: item.slug,
                name: item.name,
                originName: item.origin_name,
                poster: item.poster_url ? (item.poster_url.startsWith("http") ? item.poster_url : IMAGE_URL + item.poster_url) : "",
                thumb: item.thumb_url ? (item.thumb_url.startsWith("http") ? item.thumb_url : IMAGE_URL + item.thumb_url) : "",
                year: item.year,
                type: "movie"
            }));
            return {
                items: items,
                hasMore: page < (data.pagination?.totalPages || 1)
            };
        } catch (e) {
            console.error("[KKPhim] getHome error:", e);
            return { items: [], hasMore: false };
        }
    },

    getDetail: async function(slug) {
        try {
            const url = `${BASE_URL}/phim/${slug}`;
            const res = await globalThis.fetch(url, {
                headers: { "User-Agent": "Mozilla/5.0" }
            });
            const data = await res.json();
            const movie = data.movie || {};
            const episodes = [];

            (data.episodes || []).forEach(server => {
                const serverName = server.server_name || "Server VIP";
                (server.server_data || []).forEach(ep => {
                    episodes.push({
                        id: `${slug}|${ep.slug}|${ep.name}`,
                        name: ep.name,
                        slug: ep.slug,
                        server: serverName,
                        m3u8: ep.link_m3u8,
                        embed: ep.link_embed
                    });
                });
            });

            return {
                id: movie.slug,
                name: movie.name,
                originName: movie.origin_name,
                description: movie.content,
                poster: movie.poster_url ? (movie.poster_url.startsWith("http") ? movie.poster_url : IMAGE_URL + movie.poster_url) : "",
                thumb: movie.thumb_url ? (movie.thumb_url.startsWith("http") ? movie.thumb_url : IMAGE_URL + movie.thumb_url) : "",
                year: movie.year,
                episodes: episodes
            };
        } catch (e) {
            console.error("[KKPhim] getDetail error:", e);
            throw e;
        }
    },

    getStreams: async function(id, type, season, episode, context) {
        try {
            // id có thể là slug hoặc slug|epSlug|epName
            let slug = id;
            let epTarget = null;
            if (id.includes("|")) {
                const parts = id.split("|");
                slug = parts[0];
                epTarget = parts[1];
            }

            const detail = await this.getDetail(slug);
            let ep = null;
            if (epTarget) {
                ep = detail.episodes.find(e => e.slug === epTarget || e.name === epTarget);
            }
            if (!ep && detail.episodes.length > 0) {
                // lấy tập theo số thứ tự hoặc tập đầu
                const epIndex = (episode > 0) ? episode - 1 : 0;
                ep = detail.episodes[epIndex] || detail.episodes[0];
            }

            if (!ep || !ep.m3u8) {
                throw new Error("Không tìm thấy link phát cho tập này");
            }

            return [
                {
                    name: `${detail.name} - ${ep.name} (${ep.server})`,
                    type: "m3u8",
                    url: ep.m3u8,
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Referer": "https://phimapi.com/"
                    },
                    subtitles: []
                }
            ];
        } catch (e) {
            console.error("[KKPhim] getStreams error:", e);
            throw e;
        }
    }
};
