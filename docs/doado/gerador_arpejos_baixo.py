#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gerador de desenhos de acordes e digitações de arpejos para baixo.

O programa separa três problemas:
1. Construir uma escala/modo (maior, menor natural, harmônica ou melódica;
   qualquer uma das sete rotações).
2. Construir um acorde a partir de graus da escala (ex.: 1-3-5-6, 1-2-4-7)
   ou de uma fórmula intervalar em semitons (ex.: 0-3-6-9 para diminuto).
3. Encontrar posições no braço para tocar esses sons como acorde (voicing) ou
   como sequência (arpejo).

Afinação padrão: E1-A1-D2-G2 (baixo de quatro cordas).
"""

from __future__ import annotations

from dataclasses import dataclass
from itertools import product
import re
from typing import Iterator, List, Optional, Sequence, Tuple


# ---------------------------------------------------------------------------
# CONFIGURAÇÃO MUSICAL
# ---------------------------------------------------------------------------

NOTE_TO_PC = {
    "C": 0, "B#": 0,
    "C#": 1, "Db": 1,
    "D": 2,
    "D#": 3, "Eb": 3,
    "E": 4, "Fb": 4,
    "E#": 5, "F": 5,
    "F#": 6, "Gb": 6,
    "G": 7,
    "G#": 8, "Ab": 8,
    "A": 9,
    "A#": 10, "Bb": 10,
    "B": 11, "Cb": 11,
}

PC_TO_NOTE_SHARP = ["C", "C#", "D", "D#", "E", "F",
                    "F#", "G", "G#", "A", "A#", "B"]
PC_TO_NOTE_FLAT = ["C", "Db", "D", "Eb", "E", "F",
                   "Gb", "G", "Ab", "A", "Bb", "B"]
LETTERS = "CDEFGAB"
NATURAL_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}

# Cada escala é representada pelos semitons a partir de sua própria tônica.
BASE_SCALES = {
    "major":         (0, 2, 4, 5, 7, 9, 11),
    "natural_minor": (0, 2, 3, 5, 7, 8, 10),
    "harmonic_minor":(0, 2, 3, 5, 7, 8, 11),
    "melodic_minor": (0, 2, 3, 5, 7, 9, 11),
}

# Nomes usuais das rotações. Para harmônica/melódica há variações de nomenclatura
# entre fontes; o código também identifica cada rotação por família e grau.
MODE_NAMES = {
    "major": (
        "Jônio", "Dórico", "Frígio", "Lídio", "Mixolídio", "Eólio", "Lócrio"
    ),
    "natural_minor": (
        "Eólio", "Lócrio", "Jônio", "Dórico", "Frígio", "Lídio", "Mixolídio"
    ),
    "harmonic_minor": (
        "Menor harmônico", "Lócrio 6 natural", "Jônio aumentado",
        "Dórico 4 aumentado", "Frígio dominante", "Lídio 2 aumentado",
        "Superlócrio diminuto"
    ),
    "melodic_minor": (
        "Menor melódico", "Dórico 2 bemol", "Lídio aumentado",
        "Lídio dominante", "Mixolídio 6 bemol", "Lócrio 2 natural",
        "Alterado"
    ),
}

# Receitas cromáticas comuns. Os números são semitons acima da fundamental.
# Também é possível passar qualquer outra receita à função tones_from_intervals().
CHORD_RECIPES = {
    # Tríades
    "triade_maior": [("1", 0), ("3", 4), ("5", 7)],
    "triade_menor": [("1", 0), ("b3", 3), ("5", 7)],
    "triade_diminuta": [("1", 0), ("b3", 3), ("b5", 6)],
    "triade_aumentada": [("1", 0), ("3", 4), ("#5", 8)],
    "sus2": [("1", 0), ("2", 2), ("5", 7)],
    "sus4": [("1", 0), ("4", 5), ("5", 7)],

    # Tétrades
    "maj7": [("1", 0), ("3", 4), ("5", 7), ("7", 11)],
    "7_dominante": [("1", 0), ("3", 4), ("5", 7), ("b7", 10)],
    "m7": [("1", 0), ("b3", 3), ("5", 7), ("b7", 10)],
    "meio_diminuto_m7b5": [("1", 0), ("b3", 3), ("b5", 6), ("b7", 10)],
    "diminuto_dim7": [("1", 0), ("b3", 3), ("b5", 6), ("bb7", 9)],
    "menor_maior7": [("1", 0), ("b3", 3), ("5", 7), ("7", 11)],
    "maj7_aumentado": [("1", 0), ("3", 4), ("#5", 8), ("7", 11)],
    "7_b5": [("1", 0), ("3", 4), ("b5", 6), ("b7", 10)],
    "7_sus4": [("1", 0), ("4", 5), ("5", 7), ("b7", 10)],
}

# MIDI das cordas soltas. E1=28, A1=33, D2=38, G2=43.
# A ordem interna é da corda mais grave para a mais aguda.
STANDARD_BASS_TUNING = (
    ("E", 28),
    ("A", 33),
    ("D", 38),
    ("G", 43),
)


# ---------------------------------------------------------------------------
# MODELOS E FUNÇÕES AUXILIARES
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Tone:
    """Uma nota do acorde.

    role: grau/etiqueta (ex.: '1', '3', '5', 'b7').
    pitch_class: classe de altura entre 0 e 11.
    semitones_from_root: distância em semitons da fundamental do acorde.
    """
    role: str
    pitch_class: int
    semitones_from_root: int
    spelling: Optional[str] = None


@dataclass(frozen=True)
class FretPosition:
    string: str
    string_index: int  # 0 = corda mais grave
    fret: int
    midi: int
    pitch_class: int
    note_name: str


@dataclass(frozen=True)
class Mode:
    tonic: str
    tonic_pc: int
    scale_family: str
    mode_degree: int
    mode_name: str
    intervals: Tuple[int, ...]  # sete graus do modo, em semitons desde a tônica

    @property
    def notes(self) -> List[str]:
        return [
            spell_scale_degree(self.tonic, (self.tonic_pc + interval) % 12, degree)
            for degree, interval in enumerate(self.intervals, start=1)
        ]


def normalize_note(note: str) -> str:
    """Normaliza nomes como 'c#', 'Db' e símbolos ♯/♭."""
    if not isinstance(note, str):
        raise TypeError("A nota deve ser uma string, por exemplo 'C' ou 'Bb'.")
    value = note.strip().replace("♯", "#").replace("♭", "b")
    if not value:
        raise ValueError("Nome de nota vazio.")
    value = value[0].upper() + value[1:]
    if value not in NOTE_TO_PC:
        raise ValueError(
            f"Nota {note!r} não reconhecida. Use nomes como C, C#, Db, D, Eb..."
        )
    return value


def note_to_pc(note: str) -> int:
    return NOTE_TO_PC[normalize_note(note)]


def note_name(pitch_class: int, prefer_flats: bool = False) -> str:
    names = PC_TO_NOTE_FLAT if prefer_flats else PC_TO_NOTE_SHARP
    return names[pitch_class % 12]


def spell_scale_degree(tonic: str, pitch_class: int, degree: int) -> str:
    """Escreve uma nota usando a letra diatônica esperada para o grau.

    Ex.: em C dórico, o terceiro grau é Eb (não D#).
    """
    tonic = normalize_note(tonic)
    tonic_letter = tonic[0]
    letter_index = LETTERS.index(tonic_letter)
    target_letter = LETTERS[(letter_index + degree - 1) % 7]
    difference = (pitch_class - NATURAL_PC[target_letter]) % 12
    if difference > 6:
        difference -= 12
    accidental = { -2: "bb", -1: "b", 0: "", 1: "#", 2: "##" }.get(difference)
    if accidental is None:
        return note_name(pitch_class)
    return target_letter + accidental


def spell_chord_role(root_note: str, role: str, pitch_class: int) -> str:
    """Tenta grafar uma nota de acorde a partir de rótulos como b3, #5 e bb7."""
    match = re.fullmatch(r"([b#]{0,2})([1-9][0-9]*)", role)
    if not match:
        return note_name(pitch_class)
    _accidental_text, degree_text = match.groups()
    degree = int(degree_text)
    normalized_root = normalize_note(root_note)
    if degree == 1 and _accidental_text == "":
        return normalized_root
    root_letter = normalized_root[0]
    letter = LETTERS[(LETTERS.index(root_letter) + degree - 1) % 7]
    difference = (pitch_class - NATURAL_PC[letter]) % 12
    if difference > 6:
        difference -= 12
    accidental = {-2: "bb", -1: "b", 0: "", 1: "#", 2: "##"}.get(difference)
    if accidental is None:
        return note_name(pitch_class)
    return letter + accidental


def get_mode(
    tonic: str,
    scale_family: str = "major",
    mode_degree: int = 1,
) -> Mode:
    """Constrói um modo a partir de uma escala-base e de uma rotação.

    tonic é a tônica DO MODO resultante. Ex.: get_mode('C','major',2)
    produz C dórico (C D Eb F G A Bb), não D dórico.

    scale_family: major, natural_minor, harmonic_minor ou melodic_minor.
    mode_degree: grau da escala-base que inicia a rotação (1 a 7).
    """
    if scale_family not in BASE_SCALES:
        raise ValueError(f"Família inválida: {scale_family}. Opções: {list(BASE_SCALES)}")
    if not 1 <= mode_degree <= 7:
        raise ValueError("mode_degree deve estar entre 1 e 7.")

    base = BASE_SCALES[scale_family]
    start = mode_degree - 1
    start_interval = base[start]
    rotated = []
    for step in range(7):
        index = (start + step) % 7
        octave = (start + step) // 7
        rotated.append(base[index] + 12 * octave - start_interval)

    tonic_normalized = normalize_note(tonic)
    return Mode(
        tonic=tonic_normalized,
        tonic_pc=note_to_pc(tonic_normalized),
        scale_family=scale_family,
        mode_degree=mode_degree,
        mode_name=MODE_NAMES[scale_family][start],
        intervals=tuple(rotated),
    )


def mode_summary(mode: Mode) -> str:
    notes = " – ".join(mode.notes)
    return (
        f"{mode.tonic} {mode.mode_name} "
        f"(base={mode.scale_family}, rotação={mode.mode_degree}): {notes}"
    )


# ---------------------------------------------------------------------------
# CONSTRUÇÃO DO ACORDE
# ---------------------------------------------------------------------------

def tones_from_scale_degrees(
    mode: Mode,
    root_degree: int,
    chord_degrees: Sequence[int],
) -> List[Tone]:
    """Constrói um acorde usando graus diatônicos relativos à sua fundamental.

    Ex.: modo C dórico, root_degree=1, chord_degrees=[1,3,5,6]
    -> C, Eb, G, A (menor com sexta maior).

    [1,3,5,7] gera tétrades por empilhamento de terças.
    [1,2,4,7] gera outra combinação, sem pressupor empilhamento de terças.
    Graus acima de 7 também são aceitos (9, 11, 13 etc.).
    """
    if (
        not isinstance(root_degree, int)
        or isinstance(root_degree, bool)
        or not 1 <= root_degree <= 7
    ):
        raise ValueError("root_degree deve ser um inteiro entre 1 e 7.")
    if not chord_degrees:
        raise ValueError("Informe pelo menos um grau para o acorde.")
    if any(
        not isinstance(d, int) or isinstance(d, bool) or d < 1
        for d in chord_degrees
    ):
        raise ValueError("Os graus do acorde devem ser inteiros positivos: 1, 3, 5...")

    root_step = root_degree - 1
    root_octave, root_index = divmod(root_step, 7)
    root_absolute = mode.intervals[root_index] + 12 * root_octave

    tones: List[Tone] = []
    for degree in chord_degrees:
        absolute_step = root_step + degree - 1
        octave, scale_index = divmod(absolute_step, 7)
        absolute_interval = mode.intervals[scale_index] + 12 * octave
        relative_interval = absolute_interval - root_absolute
        pc = (mode.tonic_pc + absolute_interval) % 12
        spelling = spell_scale_degree(mode.tonic, pc, scale_index + 1)
        tones.append(Tone(str(degree), pc, relative_interval, spelling))
    return tones


def tones_from_intervals(
    root_note: str,
    intervals: Sequence[Tuple[str, int] | int],
) -> List[Tone]:
    """Constrói um acorde por intervalos cromáticos, sem depender de uma escala.

    Exemplos:
      [('1',0), ('b3',3), ('b5',6)] -> tríade diminuta.
      [('1',0), ('b3',3), ('b5',6), ('bb7',9)] -> tétrade diminuta.
      [0, 3, 6, 10] -> meio-diminuto (as etiquetas serão 1,2,3,4).
    """
    root_pc = note_to_pc(root_note)
    if not intervals:
        raise ValueError("Informe pelo menos um intervalo.")

    tones: List[Tone] = []
    for i, item in enumerate(intervals, start=1):
        if isinstance(item, tuple):
            role, semitones = item
        else:
            role, semitones = str(i), item
        if not isinstance(semitones, int) or semitones < 0:
            raise ValueError("Os intervalos devem ser inteiros não negativos.")
        pc = (root_pc + semitones) % 12
        spelling = spell_chord_role(root_note, str(role), pc)
        tones.append(Tone(str(role), pc, semitones, spelling))
    return tones


def tones_from_recipe(root_note: str, recipe_name: str) -> List[Tone]:
    """Constrói um acorde usando uma das receitas de CHORD_RECIPES."""
    if recipe_name not in CHORD_RECIPES:
        raise KeyError(f"Receita {recipe_name!r} não encontrada. Opções: {list(CHORD_RECIPES)}")
    return tones_from_intervals(root_note, CHORD_RECIPES[recipe_name])


def generate_diatonic_chords(
    mode: Mode,
    chord_degrees: Sequence[int] = (1, 3, 5, 7),
) -> Iterator[Tuple[int, str, List[Tone]]]:
    """Gera o acorde solicitado sobre cada um dos sete graus do modo.

    Retorna (grau_da_fundamental, nome_da_fundamental, notas_do_acorde).
    """
    for root_degree in range(1, 8):
        tones = tones_from_scale_degrees(mode, root_degree, chord_degrees)
        root_tone = tones_from_scale_degrees(mode, root_degree, [1])[0]
        # Preserve the diatonic spelling (e.g. Eb, not D# in C harmonic minor).
        root_name = root_tone.spelling or note_name(root_tone.pitch_class)
        yield root_degree, root_name, tones


# ---------------------------------------------------------------------------
# MAPA DO BRAÇO E BUSCA DE DIGITAÇÕES
# ---------------------------------------------------------------------------

def build_fretboard(
    tuning: Sequence[Tuple[str, int]] = STANDARD_BASS_TUNING,
    max_fret: int = 12,
    prefer_flats: bool = False,
) -> List[FretPosition]:
    """Lista todas as posições do braço até max_fret, incluindo cordas soltas."""
    if not isinstance(max_fret, int) or isinstance(max_fret, bool) or max_fret < 0:
        raise ValueError("max_fret deve ser um inteiro não negativo.")
    if not tuning:
        raise ValueError("tuning deve conter pelo menos uma corda.")
    if any(not isinstance(name, str) or not name.strip() for name, _ in tuning):
        raise ValueError("Cada corda em tuning deve ter um nome não vazio.")
    names = [name for name, _ in tuning]
    if len(set(names)) != len(names):
        raise ValueError("Os nomes das cordas em tuning devem ser únicos.")
    if any(not isinstance(midi, int) or isinstance(midi, bool) for _, midi in tuning):
        raise ValueError("A nota MIDI de cada corda deve ser um inteiro.")
    positions: List[FretPosition] = []
    for string_index, (string_name, open_midi) in enumerate(tuning):
        for fret in range(max_fret + 1):
            midi = open_midi + fret
            pc = midi % 12
            positions.append(FretPosition(
                string=string_name,
                string_index=string_index,
                fret=fret,
                midi=midi,
                pitch_class=pc,
                note_name=note_name(pc, prefer_flats),
            ))
    return positions


def _fret_span_ok(
    chosen: Sequence[FretPosition],
    max_fret_span: Optional[int],
) -> bool:
    """Verifica extensão da mão; cordas soltas não contam como dedos."""
    if max_fret_span is None:
        return True
    fretted = [p.fret for p in chosen if p.fret > 0]
    return len(fretted) < 2 or (max(fretted) - min(fretted) <= max_fret_span)


def generate_fingerings(
    tones: Sequence[Tone],
    kind: str = "chord",
    tuning: Sequence[Tuple[str, int]] = STANDARD_BASS_TUNING,
    max_fret: int = 12,
    max_fret_span: Optional[int] = 4,
    distinct_strings: Optional[bool] = None,
    direction: str = "any",
    max_midi_span: Optional[int] = None,
    limit: Optional[int] = None,
) -> Iterator[List[dict]]:
    """Gera voicings de acordes ou sequências de arpejo no braço.

    kind='chord': por padrão, exige uma corda diferente para cada nota.
    kind='arpeggio': permite repetir cordas e respeita a ordem de `tones`.

    Para arpejos, direction='descending' inverte automaticamente a ordem
    recebida em `tones`; 'ascending' mantém a ordem; 'any' aceita qualquer
    contorno. A busca é lazy e `limit` interrompe a geração após N resultados.

    As posições são escolhidas por classe de altura (pitch class), não por
    oitava fixa. Isso permite encontrar inversões e registros diferentes.
    Use max_midi_span para limitar a extensão sonora total.
    """
    if not tones:
        return
    if kind not in {"chord", "arpeggio"}:
        raise ValueError("kind deve ser 'chord' ou 'arpeggio'.")
    if direction not in {"any", "ascending", "descending"}:
        raise ValueError("direction deve ser 'any', 'ascending' ou 'descending'.")
    if kind == "chord" and direction != "any":
        raise ValueError("direction é aplicável apenas a arpejos.")
    if not isinstance(max_fret, int) or isinstance(max_fret, bool) or max_fret < 0:
        raise ValueError("max_fret deve ser um inteiro não negativo.")
    if max_fret_span is not None and (
        not isinstance(max_fret_span, int)
        or isinstance(max_fret_span, bool)
        or max_fret_span < 0
    ):
        raise ValueError("max_fret_span deve ser None ou um inteiro não negativo.")
    if max_midi_span is not None and (
        not isinstance(max_midi_span, int)
        or isinstance(max_midi_span, bool)
        or max_midi_span < 0
    ):
        raise ValueError("max_midi_span deve ser None ou um inteiro não negativo.")
    if limit is not None and (
        not isinstance(limit, int) or isinstance(limit, bool) or limit < 0
    ):
        raise ValueError("limit deve ser None ou um inteiro não negativo.")

    if distinct_strings is None:
        distinct_strings = (kind == "chord")
    if distinct_strings and kind == "chord" and len(tones) > len(tuning):
        return

    ordered_tones = list(tones)
    if kind == "arpeggio" and direction == "descending":
        ordered_tones.reverse()

    # Indexa as posições por classe de altura uma única vez. Isso evita
    # percorrer todo o braço separadamente para cada nota do acorde.
    positions_by_pc: dict[int, List[FretPosition]] = {pc: [] for pc in range(12)}
    for position in build_fretboard(tuning, max_fret):
        positions_by_pc[position.pitch_class].append(position)
    for positions in positions_by_pc.values():
        positions.sort(key=lambda p: p.midi, reverse=(direction == "descending"))

    candidates = [positions_by_pc[tone.pitch_class] for tone in ordered_tones]
    if any(not choices for choices in candidates):
        return

    selected: List[FretPosition] = []
    used_strings: set[str] = set()
    yielded = 0

    def backtrack(index: int) -> Iterator[List[dict]]:
        nonlocal yielded
        if limit is not None and yielded >= limit:
            return

        if index == len(ordered_tones):
            yielded += 1
            result = []
            for tone, position in zip(ordered_tones, selected):
                result.append({
                    "role": tone.role,
                    "string": position.string,
                    "string_index": position.string_index,
                    "fret": position.fret,
                    "midi": position.midi,
                    "note": tone.spelling or position.note_name,
                    "pitch_class": position.pitch_class,
                    "semitones_from_root": tone.semitones_from_root,
                })
            yield result
            return

        for position in candidates[index]:
            if distinct_strings and position.string in used_strings:
                continue
            # Uma mesma posição física não pode representar duas notas distintas.
            if any(
                previous.string == position.string and previous.fret == position.fret
                for previous in selected
            ):
                continue

            if kind == "arpeggio" and selected:
                previous_midi = selected[-1].midi
                if direction == "ascending" and position.midi <= previous_midi:
                    continue
                if direction == "descending" and position.midi >= previous_midi:
                    continue

            selected.append(position)
            if distinct_strings:
                used_strings.add(position.string)

            fret_span_ok = _fret_span_ok(selected, max_fret_span)
            midi_span_ok = True
            if max_midi_span is not None:
                selected_midis = [p.midi for p in selected]
                midi_span_ok = (
                    max(selected_midis) - min(selected_midis) <= max_midi_span
                )

            if fret_span_ok and midi_span_ok:
                yield from backtrack(index + 1)

            selected.pop()
            if distinct_strings:
                used_strings.remove(position.string)

            if limit is not None and yielded >= limit:
                return

    yield from backtrack(0)


def generate_mode_fingerings(
    mode: Mode,
    chord_degrees: Sequence[int] = (1, 3, 5, 7),
    kind: str = "chord",
    max_fret: int = 12,
    max_fret_span: Optional[int] = 4,
    direction: str = "any",
    limit_per_chord: Optional[int] = None,
    tuning: Sequence[Tuple[str, int]] = STANDARD_BASS_TUNING,
    max_midi_span: Optional[int] = None,
) -> Iterator[dict]:
    """Gera digitações para o acorde especificado em cada grau de um modo."""
    for root_degree, root_name, tones in generate_diatonic_chords(mode, chord_degrees):
        for fingering in generate_fingerings(
            tones=tones,
            kind=kind,
            max_fret=max_fret,
            max_fret_span=max_fret_span,
            direction=direction,
            tuning=tuning,
            max_midi_span=max_midi_span,
            limit=limit_per_chord,
        ):
            yield {
                "mode": mode_summary(mode),
                "root_degree": root_degree,
                "chord_root": root_name,
                "chord_degrees": list(chord_degrees),
                "kind": kind,
                "tones": [
                    {"role": t.role, "note": t.spelling or note_name(t.pitch_class),
                     "pitch_class": t.pitch_class,
                     "semitones_from_root": t.semitones_from_root}
                    for t in tones
                ],
                "fingering": fingering,
            }


# ---------------------------------------------------------------------------
# VISUALIZAÇÃO TEXTUAL DOS DESENHOS
# ---------------------------------------------------------------------------

def generate_recipe_fingerings(
    root_note: str,
    recipe_name: str,
    kind: str = "chord",
    max_fret: int = 12,
    max_fret_span: Optional[int] = 4,
    direction: str = "any",
    limit: Optional[int] = None,
    tuning: Sequence[Tuple[str, int]] = STANDARD_BASS_TUNING,
    max_midi_span: Optional[int] = None,
) -> Iterator[List[dict]]:
    """Atalho: gera diretamente os desenhos de uma receita de acorde."""
    tones = tones_from_recipe(root_note, recipe_name)
    yield from generate_fingerings(
        tones, kind=kind, tuning=tuning, max_fret=max_fret,
        max_fret_span=max_fret_span, direction=direction,
        max_midi_span=max_midi_span, limit=limit
    )


def print_diagram(
    fingering: Sequence[dict],
    max_fret: int = 7,
    tuning: Sequence[Tuple[str, int]] = STANDARD_BASS_TUNING,
    show_note_names: bool = False,
) -> None:
    """Imprime uma tabela semelhante aos diagramas enviados na pergunta."""
    headings = ["Solta"] + [f"{f}" for f in range(1, max_fret + 1)]
    print("Corda | " + " | ".join(f"{h:^6}" for h in headings))
    for string_name, _ in reversed(tuning):
        cells = []
        for fret in range(0, max_fret + 1):
            matches = [x for x in fingering
                       if x["string"] == string_name and x["fret"] == fret]
            if show_note_names:
                label = ",".join(f"{x['role']}:{x['note']}" for x in matches)
            else:
                label = ",".join(x["role"] for x in matches)
            cells.append(f"{label:^6}")
        print(f"{string_name:5} | " + " | ".join(cells))


def describe_tones(tones: Sequence[Tone]) -> str:
    return " – ".join(
        f"{tone.role}:{tone.spelling or note_name(tone.pitch_class)}"
        for tone in tones
    )


# ---------------------------------------------------------------------------
# EXEMPLOS PRONTOS
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # 1) C dórico: acorde 1-3-5-6 = C-Eb-G-A.
    c_dorian = get_mode("C", "major", 2)
    print("\nEXEMPLO 1 — C dórico")
    print(mode_summary(c_dorian))
    dorian_1356 = tones_from_scale_degrees(c_dorian, 1, [1, 3, 5, 6])
    print("Acorde 1-3-5-6:", describe_tones(dorian_1356))
    first_shapes = list(generate_fingerings(
        dorian_1356, kind="chord", max_fret=7, max_fret_span=4, limit=5
    ))
    for i, shape in enumerate(first_shapes, start=1):
        print(f"\nVoicing {i}")
        print_diagram(shape, max_fret=7)

    # 2) C menor harmônica: tétrades diatônicas em cada grau (1-3-5-7).
    c_harmonic_minor = get_mode("C", "harmonic_minor", 1)
    print("\nEXEMPLO 2 — Campo harmônico de C menor harmônica")
    print(mode_summary(c_harmonic_minor))
    for degree, root, tones in generate_diatonic_chords(
        c_harmonic_minor, [1, 3, 5, 7]
    ):
        print(f"Grau {degree} ({root}): {describe_tones(tones)}")

    # 3) Procurar desenhos de tétrade meio-diminuta de D, por fórmula cromática.
    half_diminished = tones_from_recipe("D", "meio_diminuto_m7b5")
    print("\nEXEMPLO 3 — D meio-diminuto (D-F-Ab-C)")
    print("Notas:", describe_tones(half_diminished))
    half_shapes = generate_fingerings(
        half_diminished, kind="chord", max_fret=12,
        max_fret_span=4, limit=5
    )
    for i, shape in enumerate(half_shapes, start=1):
        print(f"\nVoicing {i}")
        print_diagram(shape, max_fret=12, show_note_names=True)

    # 4) Digitações ascendentes de arpejo 1-3-5-7 em C dórico.
    print("\nEXEMPLO 4 — Arpejo ascendente 1-3-5-7 de C dórico")
    arpeggio_tones = tones_from_scale_degrees(c_dorian, 1, [1, 3, 5, 7])
    arpeggio_shapes = generate_fingerings(
        arpeggio_tones, kind="arpeggio", direction="ascending",
        max_fret=12, max_fret_span=5, limit=5
    )
    for i, shape in enumerate(arpeggio_shapes, start=1):
        print(f"\nDigitação {i}: " + " → ".join(
            f"{x['note']} ({x['string']}, casa {x['fret']})" for x in shape
        ))
