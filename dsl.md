# DSL for interacting with this step sequence engine

Each command starts with an index to a track followed by a slash. Should that track not exist it is created.

Following the slash is 1 or more space-seperated command parts which set aspects of 
the track: voice, pattern, gain, speed, pan, prob, etc.

## Command Parts

### Voices

| Command | Description | Available Values |
|---------|-------------|------------------|
| `voice:[name]` | Set the voice/instrument | `kick`, `hat`, `snare` |

### Patterns

| Command | Description | Arguments |
|---------|-------------|-----------|
| `pulse:[hits]` or `pulse:[hits,beats]` | Creates a pulse pattern | `hits` = number of hits, `beats` = total steps (defaults to 16 if omitted) |

### Modifications

| Command | Range | Description |
|---------|-------|-------------|
| `gain:[value]` | 0 to 1 | Volume control (0 = silent, 1 = full volume) |
| `speed:[value]` | 0 to n | Tempo multiplier (1 = normal, 2 = double speed, 0.5 = half speed) |
| `pan:[value]` | -1 to 1 | Stereo position (-1 = left, 0 = center, 1 = right) |
| `prob:[value]` | 0 to 1 | Probability of hit playing (1 = always, 0.5 = 50% chance) |

### Control Commands

| Command | Description |
|---------|-------------|
| `start` | Start playback if stopped |
| `stop` | Stop playback if started |


## Examples

### Creating Tracks
```
0/voice:kick pulse:4
1/voice:hat pulse:16
```

### Modifying Tracks
```
0/gain:1 start
0/speed:2 gain:0.5
1/speed:0.5 prob:0.9 start
```

### Control Commands
```
0/start
1/stop
```
