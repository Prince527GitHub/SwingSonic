module.exports = async(req, res, proxy, xml) => {
    let { f, musicFolderId } = req.query;

    const size = (await (await fetch(`${global.config.music}/getall/artists?start=0&limit=1&sortby=created_date&reverse=1`, {
        headers: { "Cookie": req.user }
    })).json())?.total ?? 50;

    const artists = await (await fetch(`${global.config.music}/getall/artists?start=0&limit=${size}&sortby=created_date&reverse=1`, {
        headers: { "Cookie": req.user }
    })).json();

    const output = (artists?.items || []).map(item => ({
        id: item?.artisthash,
        name: item?.name,
        artistImageUrl: item?.image ? `${global?.config?.server?.url}/rest/getCoverArt.view?id=${Buffer.from(JSON.stringify({ type: "artist", id: item.image })).toString("base64")}` : undefined
    }));

    const children = (artists?.items || []).map(item => ({
        id: item?.artisthash,
        title: item?.name,
        isDir: true,
        parent: "0"
    }));

    const groupe = output.reduce((acc, artist) => {
        const first = (artist.name || "")?.charAt(0)?.toUpperCase() || "#";

        acc[first] = acc[first] || [];
        acc[first].push(artist);

        return acc;
    }, {});

    const organize = Object.keys(groupe).sort().map(letter => ({
        name: letter,
        artist: groupe[letter]
    }));

    const json = {
        "subsonic-response": {
            indexes: {
                ignoredArticles: "",
                lastModified: new Date().getTime(),
                index: organize,
                child: children
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
