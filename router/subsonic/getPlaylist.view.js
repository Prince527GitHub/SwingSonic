module.exports = async(req, res, proxy, xml) => {
    const id = req.query.id;

    let { f } = req.query;

    const playlist = await (await fetch(`${global.config.music}/playlist/${id}?no_tracks=false`)).json();

    const output = playlist.tracks.map(track => ({
        "id": track.trackhash,
        "parent": "655",
        "title": track.title,
        "album": track.album,
        "artist": track.artists[0].name,
        "isDir": "false",
        "coverArt": track.image,
        "created": new Date(track.created_date * 1000).toISOString(),
        "duration": track.duration,
        "bitRate": track.bitrate,
        "track": track.track,
        "year": new Date(track.created_date * 1000).getFullYear(),
        "size": 0,
        "suffix": "mp3",
        "contentType": "audio/mpeg",
        "isVideo": "false",
        "path": track.filepath,
        "albumId": track.albumhash,
        "artistId": track.artists[0].artisthash,
        "type": "music"
    }));

    const json = {
        "subsonic-response": {
            "playlist": {
                "id": playlist.info.id,
                "name": playlist.info.name,
                "comment": "No comment",
                "owner": "admin",
                "public": true,
                "songCount": playlist.info.count,
                "duration": playlist.info.duration,
                "created": 0, // 16 hours ago
                "coverArt": playlist.info.image,
                "entry": output
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}