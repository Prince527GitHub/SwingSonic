const { shuffleArray } = require("../../packages/array");

module.exports = async(req, res, proxy, respond) => {
    let { type, size, offset, genre } = req.query;

    size = Math.min(parseInt(size) || 10, 500);
    offset = parseInt(offset) || 0;

    let albums;
    let output = [];

    switch (type) {
        case "newest": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=created_date&reverse=1`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "random": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${size}&sortby=created_date&reverse=1`, { headers: { "Cookie": req.user } })).json();
            output = shuffleArray(albums?.items || []);
            break;
        }
        case "alphabeticalByName": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=title&reverse=`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "alphabeticalByArtist": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=albumartists&reverse=`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "starred": {
            const favs = await (await fetch(`${global.config.music}/favorites/albums?start=${offset}&limit=${size}`, { headers: { "Cookie": req.user } })).json();
            albums = { items: (favs?.albums || []).map(a => ({
                albumhash: a?.albumhash,
                title: a?.title,
                image: a?.image,
                date: a?.date,
                duration: a?.duration,
                albumartists: a?.albumartists
            }))};
            break;
        }
        case "recent": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=lastplayed&reverse=1`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "frequent": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=playcount&reverse=1`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "byYear": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=created_date&reverse=1`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "byGenre": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=created_date&reverse=1&genre=${encodeURIComponent(genre || "")}`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        default: {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=created_date&reverse=1`, { headers: { "Cookie": req.user } })).json();
            break;
        }
    }

    if (type !== "random") output = albums?.items || [];

    const items = await Promise.all((output || []).map(async(item) => {
        const id = item?.albumhash;

        const album = {
            id: id,
            name: item?.title,
            title: item?.title,
            album: item?.title,
            parent: id,
            isDir: true,
            isVideo: false,
            coverArt: item?.image ? Buffer.from(JSON.stringify({ type: "album", id: item.image })).toString("base64") : undefined,
            songCount: item?.trackcount || 0,
            created: item?.date ? new Date(item.date * 1000).toISOString() : new Date().toISOString(),
            duration: item?.duration || 0,
            artist: item?.albumartists?.[0]?.name,
            artistId: item?.albumartists?.[0]?.artisthash,
            artists: (item?.albumartists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
            albumArtists: (item?.albumartists || []).map(a => ({ name: a?.name, id: a?.artisthash }))
        }

        const favorite = await (await fetch(`${global.config.music}/favorites/check?hash=${id}&type=album`, { headers: { "Cookie": req.user } })).json();
        if (favorite?.is_favorite) album.starred = favorite?.date ? new Date(favorite.date * 1000).toISOString() : new Date(0).toISOString();

        return album;
    }));

    respond(res, req, {
        "subsonic-response": {
            albumList2: {
                album: items
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
}
