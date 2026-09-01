# Zero Width Hack

The "Zero Width" hack is a feature that allows Subsonic clients to get the exact lyrics of a song.

## Problem

When a Subsonic client wants to get the lyrics of a song it will search for it by the title but what happens if I have 2 songs with the same name, it might get the wrong lyrics.

![problem](https://api.serversmp.xyz/upload/6a972fe180f3291c305ed1fe.jpg)

## "Solution"

How would we fix this? Well my solution is zero width characters which are characters that are pretty much invisible using those I can inject data into the title.

| Before | After |
| :----------- | :--------------: |
| ![before](https://github.com/user-attachments/assets/f2053880-930f-4586-b416-045ed0d6d38f) | ![after](https://github.com/user-attachments/assets/3f045e47-1d4f-41b6-bbb7-1436c6b2374b) |

As you see you cant spot the difference but there is an extra 100+ characters which embeds a JSON string including the album and track id.

Then when you go to get the lyrics I extract the extra data and use it to get a more accurate result.

![solution](https://api.serversmp.xyz/upload/6a972fe180f3291c305ed1fc.jpg)
