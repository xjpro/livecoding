// "Jane"

setcpm(90);

// samples('github:xjpro/livecoding');
samples('http://localhost:5432/')

$:s("hh").postgain(0)._punchcard();


const drums = stack(
    s("<bd ~ bd [~ bd]>"),
    s("<~ sd>").every(8, _ => s("<~ sd [~ sd]>")),
    s("hh*2").sometimesBy(0.2, x => x.fast(2)).gain(.12)
).bank("tr606")._punchcard()

const ch = chord("<Dm7 G7 C^7 A7>").dict("ireal")

const melody = n(irand("<4 6 8>"))
    .set(ch)
    .mode("root:C2")
    .voicing()
    .struct("<x*4 x*2 x*2 [x ~]*4>")
    .degradeBy(0.25)
    .layer(
        x => x.s("saw").gain(.4),
        x => x.s("tri")
    )
    .detune(".03")
    .adsr("0.01:0.18:.6:.12")
    .lpf(330).lpa(0.01).lpd(.18).lps(.1).lpr(0.12)


const vocals =
    note(ch)
        .s("jane-goodall")
        .n(irand(10))
        .splice(4, "<0 ~ 1 1 2 ~ 3 ~>")
        // .rib("<1 2 3 4>", 1)
        .degradeBy(.5)
        .lpf(2200)
        .hpf(120)
        .room(.25)
        .size(.8)
        .adsr("0:.25:.75:1")
        .delay(.15)
        .gain(.8)

$: stack(
    // drums,
    // melody,
    // vocals
)