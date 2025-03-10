const { createArray, shuffleArray } = require("../../packages/array");

module.exports = async(req, res, proxy, xml) => {
    let { type, size, offset, f } = req.query;

    let albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset || '0'}&limit=${size || '50'}&sortby=${type === "alphabeticalByName" ? "title&reverse=" : type === "alphabeticalByArtist" ? "albumartists&reverse=" : "created_date&reverse=1"}`, {
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

    let output = await Promise.all(await albums.items.map(async(item) => {
        const id = item.item?.albumhash || item.albumhash;

        const album = {
            id: id,
            name: item.item?.title || item.title,
            coverArt: Buffer.from(JSON.stringify({ type: "album", id: item.item?.image || item.image })).toString("base64"),
            songCount: 0,
            created: new Date(item.item?.date || item.date * 1000).toISOString(),
            duration: 0,
            artist: item.item?.albumartists[0].name || item.albumartists[0].name,
            artistId: item.item?.albumartists[0].artisthash || item.albumartists[0].artisthash
        }

        const favorite = await (await fetch(`${global.config.music}/favorites/check?hash=${id}&type=album`, {
            headers: {
                "Cookie": req.user
            }
        })).json();
        if (favorite.is_favorite) album.starred = true;

        return album;
    }));

    if (type === "random") output = shuffleArray(output);

    const json = {
        "subsonic-response": {
            albumList2: {
                album: output
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}