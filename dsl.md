# DSL for interacting with this step sequence engine

Each command starts with an index to a track followed by a space. Should that track not exist it is created.

Following the track index is one or more space-seperated command parts which set aspects of
the track: voice, pattern, gain, pan, prob, etc.

## Global Commands

Global commands don't require a track number and affect all subsequent tracks.

| Command | Description | Example |
|---------|-------------|---------|
| `key:[note]` | Set global musical key | `key:C`, `key:F#`, `key:Bb` |
| `scale:[name]` | Set global scale type | `scale:major`, `scale:minor` |

## Command Parts

### Voices

| Command | Description | Available Values |
|---------|-------------|------------------|
| `voice:[name]` | Set the voice/instrument | `kick`, `hat`, `snare`, `bass` |

### Patterns

| Command | Description | Arguments |
|---------|-------------|-----------|
| `pulse:[hits]` or `pulse:[hits,beats]` | Creates a pulse pattern | `hits` = number of hits, `beats` = total steps (defaults to 16 if omitted) |
| `arp:[degrees]` | Creates an arpeggio pattern based on scale degrees | Comma-separated scale degrees (e.g., `arp:1,1,5,1` for I-I-V-I progression). Each degree gets 4 steps (one bar in 4/4 time). Uses chords built from the current key/scale. |

### Modifications

| Command | Range | Description |
|---------|-------|-------------|
| `gain:[value]` | 0 to 1 | Volume control (0 = silent, 1 = full volume) |
| `pan:[value]` | -1 to 1 | Stereo position (-1 = left, 0 = center, 1 = right) |
| `prob:[value]` | 0 to 1 | Probability of hit playing (1 = always, 0.5 = 50% chance) |
| `offset:[steps]` | 0 to n | Shift pattern forward by N steps (wraps around) |
| `oct:[octave]` or `oct:[min,max]` | 0 to 8 | Set octave for note patterns. Single value (e.g., `oct:2`) sets fixed octave. Range (e.g., `oct:1,3`) randomly picks octave per note. Defaults to 2. |

### Control Commands

| Command | Description |
|---------|-------------|
| `start` | Start playback if stopped |
| `stop` | Stop playback if started |


## Examples

### Creating Tracks
```
0 voice:kick pulse:4
1 voice:hat pulse:16
2 voice:bass pulse:8
```

### Standard Rock Beat
```
0 voice:kick pulse:8         # Bass drum on beats 1 and 3
1 voice:snare pulse:8 offset:2   # Snare on beats 2 and 4 (offset by 2 steps)
2 voice:hat pulse:16          # Hi-hat on 16th notes
```

### Experimenting with Offset
```
0 voice:kick pulse:4
0 offset:2    # Shift the kick pattern by 2 steps
0 offset:0    # Shift it back to the original position
```

### Modifying Tracks
```
0 gain:1 start
0 gain:0.5 pan:-0.5
1 prob:0.9 start
```

### Control Commands
```
0 start
1 stop
```

### Arpeggio Patterns
```
# Set global key and scale
key:C
scale:major

# Create bass line with I-I-V-I progression
0 voice:bass arp:1,1,5,1

# Try a more complex progression (I-vi-IV-V)
1 voice:bass arp:1,6,4,5 gain:0.8

# Change to minor key
key:A
scale:minor
2 voice:bass arp:1,4,5,1
```

### Octave Control
```
# Set fixed octave for bass line
0 voice:bass arp:1,1,5,1 oct:1

# Use octave range for variation (randomly picks octave 1, 2, or 3 for each note)
1 voice:bass arp:1,4,5,1 oct:1,3

# Change octave on existing track
0 oct:4
```
