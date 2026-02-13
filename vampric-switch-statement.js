// ghost sounds
// minor key chords: Am Bo C Dm E F G#o

setcpm(80/4);

const drums = stack(
    s("bd").beat("0,6,8,9?", 16),
    s("sd").beat("4,12",16).gain(.6)
).bank("linndrum");

const hats = s("hh!7 [hh oh]")
    .gain("[.08 .12 .1]*2")
    .lpf("<6000 9000 7000 10000>")
    .bank("linndrum");

const melody = n("0 2 4 5 4 2 1 0")
    .degradeBy(.2)
    .scale("A:minor")
    .s("sine")
    .oct("[-1 0 1 2]")
    .lpf(520)
    .gain(.9)

const bass = n("<0 4 5 4 3 2 1 0>*2")
    .scale("A:minor")
    .s("sine")
    .oct("-1")
    .lpf("<120 220 160 260>")   // slow filter motion
    .gain("<0.85 0.95 0.8 1>*2")

const chords = `
<Am Bo C Dm
Am Bo C [Dm E Dm Bo]>*2
`;

const keys = chord(chords)
    .voicing()
    .s("tri")
    // .oct("0,1")
    .hpf(200)
    .lpf(2500)
    .gain(.35)

$: stack(
    hats,
    drums,
    bass,
    keys,
    melody.layer(
        // x => x,
        // x => x.off(1/8, y => y.scaleTranspose(2)).gain(0.45),
        // x => x.off(1/4, y => y.scaleTranspose(2)).gain(0.45).fast(2),
    )//.rev(),
);

// bass opens
// hhs then all drums
// melody comes in
// mess with melody
// add in keys
// mess with melody again
// maybe mess with keys?
// remove keys, melody, drums, bass


// unused:
// // .every(4, x => x.fast(1.5))     // occasional energy lift
// .every(4, x => x.degradeBy(.15))