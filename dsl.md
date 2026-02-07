# DSL for interacting with this step sequence engine

Each command starts with a track reference (t0, t1, t2, etc.) followed by chained method calls. If the track doesn't exist, it is created.

Methods are chained using dot notation and commands end with a semicolon. For example: `t0.voice('kick').pulse(4);`

## Global Commands

Global commands don't require a track number and affect all subsequent tracks.

| Command | Description | Example |
|---------|-------------|---------|
| `key([note])` | Set global musical key | `key('C');`, `key('F#');`, `key('Bb');` |
| `scale([name])` | Set global scale type | `scale('major');`, `scale('minor');` |

## Command Parts

### Voices

| Command | Description | Available Values |
|---------|-------------|------------------|
| `voice([name])` | Set the voice/instrument | `'kick'`, `'hat'`, `'snare'`, `'bass'` |

### Patterns

| Command | Description | Arguments |
|---------|-------------|-----------|
| `pulse(hits)` or `pulse(hits, beats)` | Creates a pulse pattern | `hits` = number of hits, `beats` = total steps (defaults to 16 if omitted) |
| `on(steps...)` | Adds hits on specific steps (additive) | Comma-separated step numbers (1-indexed). Can be used standalone (e.g., `on(1,5,9,13)`) or chained after `pulse()` to add additional hits (e.g., `pulse(4).on(3,7)`). Only works with rhythm patterns, not arpeggio patterns. |
| `arp(degrees)` | Creates an arpeggio pattern based on scale degrees | Comma-separated scale degrees (e.g., `arp(1,1,5,1)` for I-I-V-I progression). Each degree gets 4 steps (one bar in 4/4 time). Uses chords built from the current key/scale. |

### Modifications

| Command | Range | Description |
|---------|-------|-------------|
| `gain(value)` | 0 to 1 | Volume control (0 = silent, 1 = full volume). Can be changed smoothly while playing. |
| `pan(value)` | -1 to 1 | Stereo position (-1 = left, 0 = center, 1 = right). Can be changed smoothly while playing. |
| `prob(value)` | 0 to 1 | Probability of hit playing (1 = always, 0.5 = 50% chance). Can be changed smoothly while playing. |
| `offset(steps)` | 0 to n | Shift pattern forward by N steps (wraps around) |
| `oct(octave)` or `oct(min, max)` | 0 to 8 | Set octave for note patterns. Single value (e.g., `oct(2)`) sets fixed octave. Range (e.g., `oct(1,3)`) randomly picks octave per note. Defaults to 2. Can be changed smoothly while playing. |

### Control Commands

| Command | Description |
|---------|-------------|
| `start()` | Start playback if stopped |
| `stop()` | Stop playback if started |


## Examples

### Creating Tracks
```
t0.voice('kick').pulse(4);
t1.voice('hat').pulse(16);
t2.voice('bass').pulse(8);
```

### Standard Rock Beat
```
t0.voice('kick').pulse(8);         // Bass drum on beats 1 and 3
t1.voice('snare').pulse(8).offset(2);   // Snare on beats 2 and 4 (offset by 2 steps)
t2.voice('hat').pulse(16);          // Hi-hat on 16th notes
```

### Using the On Pattern
```
// Standalone - creates pattern with hits on specific steps
t0.voice('kick').on(1,5,9,13);     // Hits on steps 1, 5, 9, and 13
t1.voice('snare').on(5,13);        // Snare on steps 5 and 13 only

// Additive - adds hits to a pulse pattern
t2.voice('kick').pulse(4);         // Creates base pulse pattern
t2.on(3,7);                        // Adds additional hits on steps 3 and 7

// Or chain them together
t3.voice('hat').pulse(8).on(2,6,10,14);  // Pulse pattern plus extra hits
```

### Experimenting with Offset
```
t0.voice('kick').pulse(4);
t0.offset(2);    // Shift the kick pattern by 2 steps
t0.offset(0);    // Shift it back to the original position
```

### Modifying Tracks
```
t0.gain(1).start();
t0.gain(0.5).pan(-0.5);
t1.prob(0.9).start();
```

### Control Commands
```
t0.start();
t1.stop();
```

### Arpeggio Patterns
```
// Set global key and scale
key('C');
scale('major');

// Create bass line with I-I-V-I progression
t0.voice('bass').arp(1,1,5,1);

// Try a more complex progression (I-vi-IV-V)
t1.voice('bass').arp(1,6,4,5).gain(0.8);

// Change to minor key
key('A');
scale('minor');
t2.voice('bass').arp(1,4,5,1);
```

### Octave Control
```
// Set fixed octave for bass line
t0.voice('bass').arp(1,1,5,1).oct(1);

// Use octave range for variation (randomly picks octave 1, 2, or 3 for each note)
t1.voice('bass').arp(1,4,5,1).oct(1,3);

// Change octave on existing track
t0.oct(4);
```
