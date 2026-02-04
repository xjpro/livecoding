export type Beat = {
  length: number;
  note: string;
};

export type Measure = {
  beats: Array<Beat>;
  add: (beat: Beat) => Measure;
};

export type Phrase = {
  measures: Array<Measure>;
  add: (measure: Measure) => Phrase;
};

export type Loop = {
  phrases: Array<Phrase>;
  add: (phrase: Phrase) => Loop;
};

export function loop(): Loop {
  const me = { phrases: [] };
  me.add = (phrase: Phrase) => {
    me.phrases.push(phrase);
    return me;
  };
  return me;
}

export function phrase(): Phrase {
  const me = { measures: [] };
  me.add = (measure: Measure) => {
    me.measures.push(measure);
    return me;
  };
  return me;
}

export function measure(): Measure {
  const me = { beats: [] };
  me.add = (beat: Beat) => {
    me.beats.push(beat);
    return me;
  };
  return me;
}
