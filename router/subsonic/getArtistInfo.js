const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

// TODO: Cleanup the entire thing, I don't like it.
module.exports = async (req, res, proxy, respond) => {
    const id = req.query.id;

    let { u, t, s } = req.query;

    const artist = await api.artist(req.user).getArtist(id);

    const artistImage = artist?.artist?.image;

    const image = artistImage ? codecs.encode({ type: "artist", id: artistImage }) : undefined;

    const link = image ? `${global?.config?.server?.url}/rest/getCoverArt.view?id=${encodeURIComponent(image)}&u=${encodeURIComponent(u || "")}&t=${encodeURIComponent(t || "")}&s=${encodeURIComponent(s || "")}` : undefined;

    const key = (req.path || req.url || "").includes("getArtistInfo2") ? "artistInfo2" : "artistInfo";

    respond(res, req, {
        "subsonic-response": {
            [key]: {
                biography: artist?.artist?.biography || "Unknown",
                musicBrainzId: artist?.artist?.musicbrainz_id || "",
                lastFmUrl: artist?.artist?.lastfm_url || "",
                smallImageUrl: link,
                mediumImageUrl: link,
                largeImageUrl: link,
            },
            status: "ok",
            version: "1.16.1",
            type: "swingsonic",
            serverVersion: "unknown",
            openSubsonic: true
        }
    });
};
