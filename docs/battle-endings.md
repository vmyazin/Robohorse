# Arcade battle endings

Boss victory and player death during the boss fight run a 360-tick (six-second)
cinematic before the existing score/retry screen. Gameplay and input freeze;
Escape pauses the sequence and its music. Mute and page visibility are respected.
Restart clears the sequence and audio. Reduced-motion mode keeps the typography
steady and omits moving rays, explosions, and confetti.

## ElevenLabs music

Generated with ElevenLabs Music v2.5, instrumental, one variant, six-second
custom duration. Both files contain stereo AAC at 44.1 kHz, approximately
128 kbps, with 5.989 seconds of valid audio. Original provider audio is retained
without re-encoding in the `.m4a` files.

- `frontend/audio/boss-victory.m4a`: “Victory Fanfare”, song
  `nu2mtFQEaXGzgo7BV6gy`, project `TiMlR9RypP1VdWcbgqHL`.
- `frontend/audio/player-defeat.m4a`: “Mission Failed”, song
  `YaoGGZcA9fiXPf3eMAUd`, project `rM8Z09ofQ9zvo6TirtRk`.

### Victory prompt

Exactly six seconds: an epic original boss victory fanfare for a late-1990s
arcade action game. Explosive opening orchestral hit, triumphant ascending
16-bit chiptune brass melody, sparkling arpeggios, punchy gated snare and tom
fill, heroic major-key final chord. Immediate start, fully resolved ending with
short reverb tail within six seconds. Instrumental, no vocals, no speech,
no copyrighted melody.

### Defeat prompt

Exactly six seconds: original dramatic game-over sting for a late-1990s arcade
robot action game. Heavy impact, descending 16-bit synth brass in a tragic minor
key, slowing tom hits, distorted power-down bass slide and a haunting final
chord fading completely by six seconds. Immediate start, memorable short
melody, epic but defeated. Instrumental, no vocals, no speech, no copyrighted
melody.
