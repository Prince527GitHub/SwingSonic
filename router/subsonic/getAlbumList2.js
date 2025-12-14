const { createArray, shuffleArray } = require("../../packages/array");
const { get, safe } = require("../../packages/safe");

module.exports = async(req, res, proxy, xml) => {
    let { type, size, offset, f } = req.query;

    let albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset || "0"}&limit=${size || "50"}&sortby=${type === "alphabeticalByName" ? "title&reverse=" : type === "alphabeticalByArtist" ? "albumartists&reverse=" : "created_date&reverse=1"}`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    if (type === "starred") albums.items = createArray((await (await fetch(`${global.config.music}/albums/favorite?limit=0`, {
        headers: {
            "Cookie": req.user
        }
    })).json()).albums, size, offset);
    else if (type === "recent") {
        albums.items = [];

        // albums.items = createArray((await (await fetch(`${global.config.music}/home/recents/played?limit=${size + offset}`, {
        //     headers: {
        //         "Cookie": req.user
        //     }
        // })).json()).items, size, offset);
        // albums.items = albums.items.filter(item => item.type === "album");
    }

    let output = await Promise.all(await safe(() => get(albums, "items", []).map(async(item) => {
        const id = get(item, "item.albumhash") || get(item, "albumhash");

        const album = {
            id: id,
            name: get(item, "item.title") || get(item, "title"),
            coverArt: (get(item, "item.image") || get(item, "image")) ? Buffer.from(JSON.stringify({ type: "album", id: get(item, "item.image") || get(item, "image") })).toString("base64") : undefined,
            songCount: 0,
            created: (get(item, "item.date") || get(item, "date")) ? new Date((get(item, "item.date") || get(item, "date")) * 1000).toISOString() : undefined,
            duration: 0,
            artist: get(item, "item.albumartists[0].name") || get(item, "albumartists[0].name"),
            artistId: get(item, "item.albumartists[0].artisthash") || get(item, "albumartists[0].artisthash")
        }

        const favorite = await (await fetch(`${global.config.music}/favorites/check?hash=${id}&type=album`, {
            headers: {
                "Cookie": req.user
            }
        })).json();
        if (get(favorite, "is_favorite")) album.starred = true;

        return album;
    }), []));

    if (type === "random") output = shuffleArray(output);

    const json = {
        "subsonic-response": {
            albumList2: {
                album: output
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}
