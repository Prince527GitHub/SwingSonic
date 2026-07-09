const { shuffleArray } = require("../../packages/array");
const path = require("path");

module.exports = async(req, res, proxy, xml) => {
    let { size, genre, fromYear, toYear, musicFolderId } = req.query;
    let f = [].concat(req.query.f).filter(Boolean)[0];

    size = Math.min(parseInt(size) || 10, 500);

    const total = (await (await fetch(`${global.config.music}/getall/albums?start=0&limit=1&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json())?.total ?? 50;

    const albums = await (await fetch(`${global.config.music}/getall/albums?start=0&limit=${total}&sortby=created_date&reverse=1`, {
        headers: {
            "Cookie": req.user
        }
    })).json();

    let output = [];
    const albumItems = albums?.items || [];
    for (let index = 0; index < albumItems.length; index++) {
        const album = albumItems[index];

        const tracks = await (await fetch(`${global.config.music}/album`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cookie": req.user
            },
            body: JSON.stringify({ albumhash: album?.albumhash })
        })).json();

        output.push(...(tracks?.tracks || []).map(track => {
            const extension = track?.filepath ? path.extname(track.filepath).slice(1) : undefined;
            return {
                id: track?.trackhash && track?.filepath ? encodeURIComponent(Buffer.from(JSON.stringify({ id: track.trackhash, path: track.filepath })).toString("base64")) : undefined,
                parent: track?.albumhash,
                title: track?.title,
                isDir: false,
                album: track?.album,
                artist: track?.artists?.[0]?.name,
                track: track?.track || 0,
                year: tracks?.info?.date ? new Date(tracks.info.date * 1000).getFullYear() : new Date().getFullYear(),
                coverArt: track?.image ? Buffer.from(JSON.stringify({ type: "album", id: track.image })).toString("base64") : undefined,
                suffix: extension || "mp3",
                contentType: `audio/${extension || "mpeg"}`,
                duration: track?.duration || 0,
                bitRate: track?.bitrate || 0,
                path: track?.filepath,
                isVideo: false,
                discNumber: track?.disc || 1,
                created: new Date().toISOString(),
                size: track?.size || 1048576,
                albumId: track?.albumhash,
                artistId: track?.artists?.[0]?.artisthash,
                albumArtists: (track?.albumartists || track?.artists || []).map(a => ({ name: a?.name, id: a?.artisthash })),
                type: "music"
            };
        }));
    }

    output = shuffleArray(output);

    output = output.slice(0, size);

    const json = {
        "subsonic-response": {
            randomSongs: {
                song: output
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
