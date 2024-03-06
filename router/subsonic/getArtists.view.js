module.exports = async(req, res, proxy, xml) => {
    let { f } = req.query;

    const size = (await (await fetch(`${global.config.music}/getall/artists?start=0&limit=1&sortby=created_date&reverse=1`)).json()).total;

    const artists = await (await fetch(`${global.config.music}/getall/artists?start=0&limit=${size}&sortby=created_date&reverse=1`)).json();

    const output = artists.items.map(item => ({
        id: item.artisthash,
        name: item.name,
        coverArt: item.image,
        albumCount: 0
    }));

    const groupedByLetter = output.reduce((acc, artist) => {
        const firstLetter = artist.name.charAt(0).toUpperCase();
        acc[firstLetter] = acc[firstLetter] || [];
        acc[firstLetter].push(artist);
        return acc;
    }, {});

    const organizedArtists = Object.keys(groupedByLetter).map(letter => ({
        name: letter,
        artist: groupedByLetter[letter]
    }));

    const json = {
        "subsonic-response": {
            "artists": {
                "index": organizedArtists
            },
            "status": "ok",
            "version": "1.16.1"
        }
    }

    if (f === "json") res.json(json);
    else res.send(xml(json));
}