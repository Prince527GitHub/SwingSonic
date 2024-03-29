<h1 align="center">Swingsonic</h1>

<p align="center"><sub><sup>Might have to find a new name...</sub></sup></p>

<p align="center">A translation layer allowing clients from <a href="#supported">other music servers</a> to work with <a href="https://github.com/swing-opensource/swingmusic">Swing Music</a>.</p>

## Supported

- [Subsonic](https://www.subsonic.org/pages/index.jsp) <sub><sup>*(75%)*</sub></sup>
- [Jellyfin](https://jellyfin.org/) <sub><sup>*(40%)*</sub></sup>
- [Euterpe](https://listen-to-euterpe.eu/) <sub><sup>*(100%)*</sub></sup>

> Note: Client compatibility varies; the percentages reflect my experience with client compatibility, not the entire API.

## Images

| ![Euterpe](https://api.serversmp.xyz/upload/66002233195e65d6b608bc1e.webp) <a href="https://github.com/ironsmile/euterpe-mobile" align="center">Euterpe</a> | ![Subtracks](https://api.serversmp.xyz/upload/66002232195e65d6b608bc1c.webp) <a href="https://github.com/austinried/subtracks" align="center">Subtracks</a> | ![Ultrasonic](https://api.serversmp.xyz/upload/6600222d195e65d6b608bc1a.webp) <a href="https://gitlab.com/ultrasonic/ultrasonic" align="center">Ultrasonic</a> | ![Finamp](https://api.serversmp.xyz/upload/6606fcd5195e65d6b608c1e6.webp) <a href="https://github.com/jmshrv/finamp" align="center">Finamp</a> |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|

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
