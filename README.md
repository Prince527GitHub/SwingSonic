> [!IMPORTANT]  
> Please read the [release notes](https://github.com/Prince527GitHub/SwingSonic/releases) for any breaking changes.

<h1 align="center">Swing Sonic</h1>

<p align="center">A translation layer allowing clients from <a href="#supported">other music servers</a> to work with <a href="https://github.com/swing-opensource/swingmusic">Swing Music</a>.</p>

## Supported

- [Subsonic](https://www.subsonic.org/pages/index.jsp) ⭐
- [Jellyfin](https://jellyfin.org/)
- [Euterpe](https://listen-to-euterpe.eu/)

> [!NOTE]
> Client compatibility varies, and not all clients are fully supported. Please submit an issue if you encounter any problems.

## Documentation

- [Clients](docs/Clients.md): List of mostly compatible music clients
- [Zero Width Hack](docs/Zero%20Width%20Hack.md): Lyrics accuracy feature
- [Jellyfin Web](docs/Jellyfin%20Web.md): Jellyfin web interface setup

## Images

| ![Euterpe](https://api.serversmp.xyz/upload/6a974fdbf3a01ca6b2e9a72f.jpg) <a href="https://github.com/ironsmile/euterpe-mobile" align="center">Euterpe</a> | ![Subtracks](https://api.serversmp.xyz/upload/6a974fdbf3a01ca6b2e9a731.jpg) <a href="https://github.com/austinried/subtracks" align="center">Subtracks</a> | ![Ultrasonic](https://api.serversmp.xyz/upload/6a9733bff3a01ca6b2e9a72b.jpg) <a href="https://gitlab.com/ultrasonic/ultrasonic" align="center">Ultrasonic</a> | ![Finamp](https://api.serversmp.xyz/upload/6a974fdbf3a01ca6b2e9a72d.jpg) <a href="https://github.com/jmshrv/finamp" align="center">Finamp</a> |
|-------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|

## Docker

To use this with docker, simply deploy the following docker-compose.

```yml
services:
  app:
    # use :dev for the development version, or :latest for the latest stable release
    image: ghcr.io/prince527github/swingsonic:latest # or git.serversmp.xyz/prince527/swingsonic:latest
    container_name: swingsonic
    restart: unless-stopped
    ports:
      - 3000:3000
    volumes: # Use a config.json file or env (see below)
      - /PATH/config.json:/app/config.json
    environment:
      - SERVER_PORT=3000 # The port to listen on
      - SERVER_URL=http://ip:port # The public URL of this API
      - SERVER_API_SUBSONIC_ENABLE=true # Enable of disable Subsonic API implementation
      - SERVER_API_SUBSONIC_OPTIONS_ZW=true # Enable of Zero Width Character Hack (check wiki for more information)
      - SERVER_API_JELLYFIN=true # Enable of disable Jellyfin API implementation
      - SERVER_API_EUTERPE=true # Enable of disable Enterpe API implementation
      - SERVER_USERS_0_USERNAME=admin # Implementations requires a list of Swing Music users's usernames
      - SERVER_USERS_0_PASSWORD=admin # Implementations requires a list of Swing Music users's passwords
      - MUSIC=http://ip:port # The URL of your Swing Music server
```
