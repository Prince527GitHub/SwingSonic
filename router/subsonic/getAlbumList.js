const { shuffleArray } = require("../../packages/array");

module.exports = async(req, res, proxy, xml) => {
    let { type, size, offset, f } = req.query;

    const albums = await (await fetch(`${global.config.music}/getall/albums?start=${offset || '0'}&limit=${size || '50'}&sortby=created_date&reverse=1`)).json();

    let output = albums.items.map(item => ({
        id: item.item?.albumhash || item.albumhash,
        parent: item.item?.albumhash || item.albumhash,
        title: item.item?.title || item.title,
        artist: item.item?.albumartists[0].name || item.albumartists[0].name,
        isDir: true,
        coverArt: item.item?.image || item.image,
        userRating: 0,
        averageRating: 0
    }));

    if (type === "random") output = shuffleArray(output);

    const json = {
        "subsonic-response": {
            albumList: {
                album: output
            },
            status: "ok",
            version: "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}