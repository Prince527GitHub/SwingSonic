const { encodeId } = require("../../packages/utils");
const api = require("../../packages/swingmusic");
const codecs = require("../../packages/codecs");

module.exports = {
    aliases: ["getArtistInfo2"],
    handler: async (req, res, proxy, respond) => {
        const { id, u, t, s } = req.query;

        const artist = await api.artist(req.user).getArtist(id);

        const image = encodeId(artist?.artist?.image, "artist", codecs);

        const link = image ? `${global?.config?.server?.url}/rest/getCoverArt.view?${new URLSearchParams({ id: image, u: u || "", t: t || "", s: s || "" })}` : undefined;

        const key = (req.path || req.url || "").includes("getArtistInfo2") ? "artistInfo2" : "artistInfo";

        respond(res, req, {
            "subsonic-response": {
                [key]: {
                    biography: artist?.artist?.biography || "Unknown",
                    musicBrainzId: artist?.artist?.musicbrainz_id || "",
                    lastFmUrl: artist?.artist?.lastfm_url || "",
                    smallImageUrl: link,
                    mediumImageUrl: link,
                    largeImageUrl: link
                },
                status: "ok",
                version: "1.16.1",
                type: "swingsonic",
                serverVersion: "unknown",
                openSubsonic: true
            }
        });
    }
};
