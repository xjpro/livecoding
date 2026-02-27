// "Infernal Engine" @by xjpro

const base = {
    bpm: 90,
};

const mix = {
    bass_attack: slider(0, 0, 2, 0.1),
    bass_decay: slider(0.3, 0, 2, 0.1),
    bass_sustain: slider(0.5, 0, 1, 0.1),
    bass_release: slider(0.1, 0, 2, 0.1),
    bass_lpf: slider(1150, 250, 3000, 150),

    synth_attack: slider(0, 0, 2, 0.1),
    synth_decay: slider(1.2, 0, 2, 0.1),
    synth_sustain: slider(0.6, 0, 1, 0.1),
    synth_release: slider(0.3, 0, 2, 0.1),
    synth_lpf: slider(1450, 250, 3000, 150),
};

const verse = chord("<C D-7 G7 E->").dict("ireal");
const chorus = verse;

const patterns = {
    bd: {
        sound: "tr505_bd",
        structure: "<[x ~]!3 [x x]>",
    },
    sd: {
        sound: "tr606_sd",
        structure: "<~ x>",
    },
    hh: {
        sound: "tr606_hh",
        structure: "x*2",
        rarely: fast(2),
    },
    oh: {
        sound: "tr808_cp",
        structure: "[~ x]/4",
    },
    bass: {
        structure: "<x [~ x] x x>",
    },
    synth: {
        structure: "<x x*2 x [~ ~ x ~]>",
    },
    pad: {},
};

setcpm(base.bpm);

$: stack(
    s(patterns.bd?.sound || "~").struct(patterns.bd?.structure || "~"),
    s(patterns.sd?.sound || "~").struct(patterns.sd?.structure || "~"),
    s(patterns.hh?.sound || "~")
        .struct(patterns.hh?.structure || "~")
        .rarely(patterns.hh?.rarely)
        .gain(rand.range(0.05, 0.25)),

    s(patterns.oh?.sound || "~").struct(patterns.oh?.structure || "~"),

    // bass
    n(irand(3))
        .set(verse)
        .mode("root")
        .voicing()
        .struct(patterns.bass?.structure || "~")
        .layer(
            (x) => x.s("saw").gain(0.5),
            (x) => x.s("tri"),
        )
        .detune(".03")
        .attack(mix.bass_attack)
        .decay(mix.bass_decay)
        .sustain(mix.bass_sustain)
        .release(mix.bass_release)
        .lpf(mix.bass_lpf)
        .lpa(0.01)
        .lpd(0.25)
        .lps(0.5)
        .lpr(0.15)
        .lpenv(2)
        .oct(-2),

    // synth
    n(irand("<4 6 8>"))
        .set(verse)
        .mode("root")
        .voicing()
        .struct(patterns.synth?.structure || "~")
        .s("tri")
        .attack(mix.synth_attack)
        .decay(mix.synth_decay)
        .sustain(mix.synth_sustain)
        .release(mix.synth_release)
        .lpf(mix.synth_lpf)
        .lpa(0.01)
        .lpd(0.25)
        .lps(0.5)
        .lpr(0.15)
        .lpenv(2)
        .oct(0)
)