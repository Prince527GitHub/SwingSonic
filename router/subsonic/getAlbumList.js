const { shuffleArray } = require("../../packages/array");

module.exports = async(req, res, proxy, respond) => {
    let { type, size, offset, genre, fromYear, toYear } = req.query;

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
        case "highest": {
            albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset}&limit=${size}&sortby=playduration&reverse=1`, { headers: { "Cookie": req.user } })).json();
            break;
        }
        case "byYear": {
            const from = parseInt(fromYear) || 0;
            const to = parseInt(toYear) || 9999;

            const [minYear, maxYear] = from <= to ? [from, to] : [to, from];

            albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=500&sortby=created_date&reverse=1`, { headers: { "Cookie": req.user } })).json();

            output = (albums?.items || [])
                .filter(item => item.date && (year => year >= minYear && year <= maxYear)(new Date(item.date * 1000).getFullYear()))
                .sort((a, b) => a.date - b.date)
                .slice(offset, offset + size);
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

    if (!["random", "byYear"].includes(type)) output = albums?.items || [];

    const items = output.map(item => ({
        id: item?.albumhash,
        parent: item?.albumhash,
        title: item?.title,
        album: item?.title,
        artist: item?.albumartists?.[0]?.name,
        isDir: true,
        isVideo: false,
        coverArt: item?.image ? Buffer.from(JSON.stringify({ type: "album", id: item.image })).toString("base64") : undefined,
        created: item?.date ? new Date(item.date * 1000).toISOString() : new Date().toISOString(),
        duration: item?.duration || 0,
        userRating: 0,
        averageRating: 0
    }));

    respond(res, req, {
        "subsonic-response": {
            albumList: {
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
