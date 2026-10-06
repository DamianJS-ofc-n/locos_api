import ytSearch from 'yt-search'
import play from 'play-dl'

export const prm = 'query';
export const udf = 'bad bunny';

export default async function (query) {
    if (!query) return { status: false, message: 'Falta?query=' };
    try {
        const s = await ytSearch(query);
        const video = s.videos[0];
        if (!video) return { status: false, message: 'No encontrado' };

        // play-dl soporta youtube sin bloqueos en Render
        const info = await play.video_info(video.url);
        const formats = info.format.filter(f => f.mimeType?.includes('audio'));
        const best = formats[0];

        return {
            status: true,
            creator: 'Damian.js',
            type: 'mp3',
            title: video.title,
            thumbnail: video.thumbnail,
            url: video.url,
            duration: video.timestamp,
            download: best.url
        };
    } catch (e) {
        return { status: false, message: 'Error mp3: ' + e.message, error: e.stack };
    }
}
