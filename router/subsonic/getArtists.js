const { toISOString, encodeId, groupByFirstLetter } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    const size = (await api.getAll(req.user).getAllItems("artists", { start: 0, limit: 1, sortby: "created_date", reverse: 1 }))?.total ?? 50;
    const artists = await api.getAll(req.user).getAllItems("artists", { start: 0, limit: size, sortby: "created_date", reverse: 1 });

    // TODO: Simplify this, I don't like it.
    const output = await Promise.all((artists?.items || []).map(async(item) => {
        const node = {
            id: encodeId(item?.artisthash, "artist", codecs),
            name: item?.name,
            coverArt: encodeId(item?.image, "artist", codecs),
            albumCount: item?.albumcount || 0
        }

        const favorite = await api.favorites(req.user).checkFavorite({ hash: item?.artisthash, type: "artist" });
        if (favorite?.is_favorite) node.starred = toISOString(favorite?.date) || toISOString(0);

        return node;
    }));

    const organize = groupByFirstLetter(output);

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
