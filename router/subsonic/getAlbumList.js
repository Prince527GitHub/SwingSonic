const { createArray, shuffleArray, sortByProperty, toISOString, parseIntOr, clampedSize, encodeId, firstProperty } = require("../../packages/utils")
const codecs = require("../../packages/codecs")
const api = require("../../packages/swingmusic")

module.exports = async (req, res, proxy, respond) => {
    let { type, size, offset, genre, fromYear, toYear } = req.query

    // TODO: Cleanup these, I don't like it.
    size = clampedSize(size, 10, 500)
    offset = parseIntOr(offset)

    let albums, output = [];

    switch (type) {
        case "newest": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "created_date", reverse: 1 });
            break;
        }
        case "random": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: 0, limit: size, sortby: "created_date", reverse: 1 });

            output = shuffleArray(albums?.items || []);
            break;
        }
        case "alphabeticalByName": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "title", reverse: "" });
            break;
        }
        case "alphabeticalByArtist": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "albumartists", reverse: "" });
            break;
        }
        case "starred": {
            const favorite = await api.favorites(req.user).getFavoriteAlbums({ start: offset, limit: size });

            // TODO: Simplify this, I don't like it.
            albums = { items: (favorite?.albums || []).map(a => ({ albumhash: a?.albumhash, title: a?.title, image: a?.image, date: a?.date, duration: a?.duration, albumartists: a?.albumartists })) }

            break;
        }
        case "recent": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "lastplayed", reverse: 1 });
            break;
        }
        case "frequent": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "playcount", reverse: 1 });
            break;
        }
        case "highest": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "playduration", reverse: 1 });
            break;
        }
        case "byYear": {
            const from = parseIntOr(fromYear);
            const to = parseIntOr(toYear, 9999);

            const [minYear, maxYear] = from <= to ? [from, to] : [to, from];

            albums = await api.getAll(req.user).getAllItems("albums", { start: 0, limit: 500, sortby: "created_date", reverse: 1 });

            output = createArray(sortByProperty((albums?.items || []).filter(item => item.date && (year => year >= minYear && year <= maxYear)(new Date(item.date * 1000).getFullYear())), "date"), size, offset);
            break;
        }
        case "byGenre": {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "created_date", reverse: 1, genre: genre || "" });
            break;
        }
        default: {
            albums = await api.getAll(req.user).getAllItems("albums", { start: offset, limit: size, sortby: "created_date", reverse: 1 });
            break;
        }
    }

    if (!["random", "byYear"].includes(type)) output = albums?.items || [];

    const items = await Promise.all((output || []).map(async (item) => {
        const id = item?.albumhash;

        const album = {
            id: id,
            name: item?.title,
            title: item?.title,
            album: item?.title,
            parent: id,
            isDir: true,
            isVideo: false,
            coverArt: encodeId(item?.image, "album", codecs),
            songCount: item?.trackcount || 0,
            created: toISOString(item?.date) || toISOString(Date.now() / 1000),
            duration: item?.duration || 0,
            artist: firstProperty(item?.albumartists, "name"),
            artistId: encodeId(item?.albumartists?.[0]?.artisthash, "artist", codecs),
            artists: (item?.albumartists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) })),
            albumArtists: (item?.albumartists || []).map(a => ({ name: a?.name, id: encodeId(a?.artisthash, "artist", codecs) }))
        }

        const favorite = await api.favorites(req.user).checkFavorite({ hash: id, type: "album" });
        if (favorite?.is_favorite) album.starred = toISOString(favorite?.date) || toISOString(0);

        return album;
    }));

    const key = (req.path || req.url || "").includes("getAlbumList2") ? "albumList2" : "albumList";

    respond(res, req, {
        "subsonic-response": {
            [key]: {
                album: items
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
