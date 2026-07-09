module.exports = async(req, res, proxy, respond) => {
    const args = { headers: { "Cookie": req.user } };

    const size = (await (await fetch(`${global.config.music}/getall/artists?start=0&limit=1&sortby=created_date&reverse=1`, args)).json())?.total ?? 50;
    const artists = await (await fetch(`${global.config.music}/getall/artists?start=0&limit=${size}&sortby=created_date&reverse=1`, args)).json();

    const output = await Promise.all((artists?.items || []).map(async(item) => {
        const node = {
            id: item?.artisthash,
            name: item?.name,
            coverArt: item?.image ? Buffer.from(JSON.stringify({ type: "artist", id: item.image })).toString("base64") : undefined,
            albumCount: item?.albumcount || 0
        };

        const favorite = await (await fetch(`${global.config.music}/favorites/check?hash=${item?.artisthash}&type=artist`, args)).json();
        if (favorite?.is_favorite) node.starred = favorite?.date ? new Date(favorite.date * 1000).toISOString() : new Date(0).toISOString();

        return node;
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
}
