import ytSearch from 'yt-search'
import ytdl from '@distube/ytdl-core'

export const prm = 'query';
export const udf = 'bad bunny';

export default async function (query) {
    if (!query) return { status: false, message: 'Pon?query=cancion' };
    try {
        const s = await ytSearch(query);
        const video = s.videos[0];
        if (!video) return { status: false, message: 'No encontrado' };

        const info = await ytdl.getInfo(video.url);
        const videoFmt = ytdl.chooseFormat(info.formats, { quality: '18' }); // 360p

        return {
            creator: 'Damian.js',
            status: true,
            title: video.title,
            url: video.url,
            download: videoFmt.url
        };
    } catch (e) {
        return { status: false, error: e.message };
    }
}
