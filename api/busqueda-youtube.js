import ytSearch from 'yt-search'

export const prm = 'query';
export const udf = 'gato';

export default async function (query) {
    try {
        if (!query) {
            return {
                status: false,
                message: 'Ingresa un termino de busqueda'
            };
        }
        const search = await ytSearch(query);
        const videos = search.videos.slice(0, 5);
        const results = videos.map(video => ({
            type: video.type || 'video',
            videoId: video.videoId,
            url: video.url,
            title: video.title,
            description: video.description,
            image: video.image || video.thumbnail,
            thumbnail: video.thumbnail,
            publishedAt: video.ago,
            duration: video.timestamp,
            views: video.views,
            isLive: video.live || false,
            author: {
                name: video.author.name,
                url: video.author.url
            }
        }));
        return {
            creator: 'noth',
            status: true,
            total: results.length,
            data: results
        };
    } catch (error) {
        return {
            status: false,
            message: 'Error al realizar la busqueda'
        };
    }
    }
