# DSL for interacting with this step sequence engine

Each command starts with an index to a track followed by a slash. Should that track not exist it is created.

Following the slash is 1 or more space-seperated command parts which set aspects of 
the track: voice, pattern, gain, speed, pan, prob, etc.

## Command Parts

### `voice:[voice-name]`

Set the voice of the track.

### Voice Names

- kick
- hat
- snare

### `pulse:[hits,beats]`

Set the pattern of the track to a pulse.

`[pattern-name]:[arg1],[arg2],[arg3],etc.`


## Mods

- gain:[0 to 1] - volume control where 0 is no volume and 1 is full volume
- speed:[0 to n] - tempo multiplier
- pan:[-1 to 1] - placement in stereo field where -1 is left, 0 is center, 1 is right
- prob:[0 to 1] - probably of dropping hits to add variation


## Adding tracks

```
# = track id

#/[voice] [...pattern] [...mods]

Examples:

0/kick pulse:4,16
1/hat pulse:16,16
```

## Commands to tracks

Space seperated list of modifications.

```
# = track id


#/start - start if stopped
#/stop - stop if started
#/gain:0.5


Examples: 

0/start
1/stop
0/gain:1 start
0/speed:2 gain:.5
1/speed:.5 prob:.9 start

```
