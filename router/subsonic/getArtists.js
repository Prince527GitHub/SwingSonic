module.exports = async(req, res, proxy, xml) => {
    const args = { headers: { "Cookie": req.user } };

    let { f } = req.query;

    const size = (await (await fetch(`${global.config.music}/getall/artists?start=0&limit=1&sortby=created_date&reverse=1`, args)).json()).total;
    const artists = await (await fetch(`${global.config.music}/getall/artists?start=0&limit=${size}&sortby=created_date&reverse=1`, args)).json();

    const output = artists.items.map(item => ({
        id: item.artisthash,
        name: item.name,
        coverArt: Buffer.from(JSON.stringify({ type: "artist", id: item.image })).toString("base64"),
        albumCount: 0
    }));

    const groupe = output.reduce((acc, artist) => {
        const first = artist.name.charAt(0).toUpperCase();

        acc[first] = acc[first] || [];
        acc[first].push(artist);

        return acc;
    }, {});

    const organize = Object.keys(groupe).map(letter => ({
        name: letter,
        artist: groupe[letter]
    }));

    const json = {
        "subsonic-response": {
            artists: {
                index: organize
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
