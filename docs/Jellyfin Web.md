# Jellyfin Web

Some Jellyfin clients do their login via the web interface, Swing Sonic does not include a web interface, so what's the solution?

Well you just need to host the [web UI](https://github.com/jellyfin/jellyfin-web), I've already [forked the UI](https://github.com/ForkPrince/jellyfin-web) to remove the version check, build a docker image and deploy it to github pages.

## Example

A client that requires this is [Fintunes](https://www.fintunes.app/).

<table>
  <tr>
    <td><img src="https://api.serversmp.xyz/upload/6a972d48f3a01ca6b2e9a721.jpg" alt="1"></td>
    <td><img src="https://api.serversmp.xyz/upload/6a972d49f3a01ca6b2e9a723.jpg" alt="2"></td>
    <td><img src="https://api.serversmp.xyz/upload/6a972d4af3a01ca6b2e9a725.jpg" alt="3"></td>
  </tr>
  <tr>
    <td><img src="https://api.serversmp.xyz/upload/6a972d4bf3a01ca6b2e9a727.jpg" alt="4"></td>
    <td><img src="https://api.serversmp.xyz/upload/6a972d4c7ca54370e568103c.jpg" alt="5"></td>
    <td></td>
  </tr>
</table>
