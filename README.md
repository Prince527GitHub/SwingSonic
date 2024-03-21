<h1 align="center">Swingsonic</h1>

<p align="center"><small>Might have to find a new name...</small></p>

<p align="center">A translation layer allowing clients from <a href="#supported">other music servers</a> to work with <a href="[#supported](https://github.com/swing-opensource/swingmusic)">Swing Music</a>.</p>

## Supported

- [Subsonic](https://www.subsonic.org/pages/index.jsp) <sub><sup>*(75%)*</sub></sup>
- [Jellyfin](https://jellyfin.org/) [^jellyfin]
- [Euterpe](https://listen-to-euterpe.eu/) <sub><sup>*(100%)*</sub></sup>

[^jellyfin]: Jellyfin support is under heavy development and should not be used at the current moment.

## Docker

To use this with docker, simply deploy the following docker-compose.

Ensure that your config.json file is properly configured within your volume beforehand.

```yml
version: '3'

services:
  app:
    image: ghcr.io/prince527github/swingsonic:main
    container_name: swingsonic
    ports:
      - 3000:3000
    volumes:
      - /PATH/config.json:/app/config.json
```
