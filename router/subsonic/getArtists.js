const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    const size = (await api.getAll(req.user).getAllItems("artists", { start: 0, limit: 1, sortby: "created_date", reverse: 1 }))?.total ?? 50;
    const artists = await api.getAll(req.user).getAllItems("artists", { start: 0, limit: size, sortby: "created_date", reverse: 1 });

    // TODO: Simplify this, I don't like it.
    const output = await Promise.all((artists?.items || []).map(async(item) => {
        const node = {
            id: item?.artisthash ? codecs.encode({ type: "artist", id: item.artisthash }) : undefined,
            name: item?.name,
            coverArt: item?.image ? codecs.encode({ type: "artist", id: item.image }) : undefined,
            albumCount: item?.albumcount || 0
        }

        const favorite = await api.favorites(req.user).checkFavorite({ hash: item?.artisthash, type: "artist" });
        if (favorite?.is_favorite) node.starred = favorite?.date ? new Date(favorite.date * 1000).toISOString() : new Date(0).toISOString();

        return node;
    }));

    const groupe = output.reduce((acc, artist) => {
        const first = (artist.name || "")?.charAt(0)?.toUpperCase() || "#";

        acc[first] = acc[first] || [];
        acc[first].push(artist);

        return acc;
    }, {});

    const organize = Object
        .keys(groupe)
        .sort()
        .map(letter => ({ name: letter, artist: groupe[letter] }));

    respond(res, req, {
        "subsonic-response": {
            artists: {
                ignoredArticles: "",
                index: organize
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
