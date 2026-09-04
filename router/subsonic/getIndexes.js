const { encodeId, groupByFirstLetter } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = async(req, res, proxy, respond) => {
    const size = (await api.getAll(req.user).getAllItems("artists", { start: 0, limit: 1, sortby: "created_date", reverse: 1 }))?.total ?? 50;
    const artists = await api.getAll(req.user).getAllItems("artists", { start: 0, limit: size, sortby: "created_date", reverse: 1 });

    const output = (artists?.items || []).map(item => ({
        id: encodeId(item?.artisthash, "artist", codecs),
        name: item?.name,
        artistImageUrl: item?.image ? `${global?.config?.server?.url}/rest/getCoverArt.view?id=${encodeURIComponent(encodeId(item.image, "artist", codecs))}` : undefined
    }));

    const children = (artists?.items || []).map(item => ({
        id: encodeId(item?.artisthash, "artist", codecs),
        title: item?.name,
        isDir: true,
        parent: "0"
    }));

    const organize = groupByFirstLetter(output);

    respond(res, req, {
        "subsonic-response": {
            indexes: {
                ignoredArticles: "",
                lastModified: Date.now(),
                index: organize,
                child: children
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
