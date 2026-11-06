"""Testes automatizados do gerador_arpejos_baixo.py.

Execute com:
    python -m unittest -v test_gerador_arpejos_baixo.py
"""

import unittest

import gerador_arpejos_baixo as g


class TestModes(unittest.TestCase):
    def test_all_scale_families_and_rotations(self):
        for family in g.BASE_SCALES:
            for degree in range(1, 8):
                with self.subTest(family=family, degree=degree):
                    mode = g.get_mode("C", family, degree)
                    self.assertEqual(len(mode.intervals), 7)
                    self.assertEqual(mode.intervals[0], 0)
                    self.assertTrue(
                        all(a < b for a, b in zip(mode.intervals, mode.intervals[1:]))
                    )
                    self.assertEqual(len(set(mode.intervals)), 7)

    def test_c_dorian(self):
        mode = g.get_mode("C", "major", 2)
        self.assertEqual(mode.notes, ["C", "D", "Eb", "F", "G", "A", "Bb"])

    def test_c_harmonic_minor(self):
        mode = g.get_mode("C", "harmonic_minor", 1)
        self.assertEqual(mode.notes, ["C", "D", "Eb", "F", "G", "Ab", "B"])

    def test_c_melodic_minor(self):
        mode = g.get_mode("C", "melodic_minor", 1)
        self.assertEqual(mode.notes, ["C", "D", "Eb", "F", "G", "A", "B"])

    def test_invalid_mode(self):
        with self.assertRaises(ValueError):
            g.get_mode("C", "unknown_scale", 1)
        with self.assertRaises(ValueError):
            g.get_mode("C", "major", 8)


class TestChordConstruction(unittest.TestCase):
    def test_dorian_1356(self):
        mode = g.get_mode("C", "major", 2)
        tones = g.tones_from_scale_degrees(mode, 1, [1, 3, 5, 6])
        self.assertEqual(g.describe_tones(tones), "1:C – 3:Eb – 5:G – 6:A")
        self.assertEqual([tone.pitch_class for tone in tones], [0, 3, 7, 9])

    def test_non_tertian_1247(self):
        mode = g.get_mode("C", "major", 2)
        tones = g.tones_from_scale_degrees(mode, 1, [1, 2, 4, 7])
        self.assertEqual(g.describe_tones(tones), "1:C – 2:D – 4:F – 7:Bb")

    def test_chromatic_recipes(self):
        expected = {
            "triade_maior": [0, 4, 7],
            "triade_menor": [0, 3, 7],
            "triade_diminuta": [0, 3, 6],
            "triade_aumentada": [0, 4, 8],
            "maj7": [0, 4, 7, 11],
            "7_dominante": [0, 4, 7, 10],
            "m7": [0, 3, 7, 10],
            "meio_diminuto_m7b5": [0, 3, 6, 10],
            "diminuto_dim7": [0, 3, 6, 9],
            "menor_maior7": [0, 3, 7, 11],
        }
        for recipe, pitch_classes in expected.items():
            with self.subTest(recipe=recipe):
                tones = g.tones_from_recipe("C", recipe)
                self.assertEqual([tone.pitch_class for tone in tones], pitch_classes)

    def test_diminished_seventh_spelling(self):
        tones = g.tones_from_recipe("C", "diminuto_dim7")
        self.assertEqual([tone.spelling for tone in tones], ["C", "Eb", "Gb", "Bbb"])

    def test_diatonic_chords_preserve_enharmonic_spelling(self):
        mode = g.get_mode("C", "harmonic_minor", 1)
        chords = list(g.generate_diatonic_chords(mode, [1, 3, 5, 7]))
        self.assertEqual(
            [root for _, root, _ in chords],
            ["C", "D", "Eb", "F", "G", "Ab", "B"],
        )
        self.assertEqual(
            g.describe_tones(chords[2][2]),
            "1:Eb – 3:G – 5:B – 7:D",
        )

    def test_invalid_degrees(self):
        mode = g.get_mode("C", "major", 1)
        with self.assertRaises(ValueError):
            g.tones_from_scale_degrees(mode, 1.5, [1, 3, 5])
        with self.assertRaises(ValueError):
            g.tones_from_scale_degrees(mode, 1, [1, 0, 5])


class TestFingeringSearch(unittest.TestCase):
    def setUp(self):
        self.tones = g.tones_from_recipe("C", "triade_maior")

    def test_chord_uses_distinct_strings_by_default(self):
        shapes = list(g.generate_fingerings(
            self.tones, kind="chord", max_fret=7, max_fret_span=4, limit=100
        ))
        self.assertTrue(shapes)
        for shape in shapes:
            self.assertEqual(len(shape), 3)
            self.assertEqual(len({item["string"] for item in shape}), 3)
            for tone, item in zip(self.tones, shape):
                self.assertEqual(tone.pitch_class, item["pitch_class"])

    def test_arpeggio_ascending(self):
        shapes = list(g.generate_fingerings(
            self.tones, kind="arpeggio", direction="ascending",
            max_fret=12, max_fret_span=5, limit=100,
        ))
        self.assertTrue(shapes)
        for shape in shapes:
            self.assertTrue(all(
                shape[i]["midi"] < shape[i + 1]["midi"]
                for i in range(len(shape) - 1)
            ))

    def test_arpeggio_descending_reverses_tone_order(self):
        shapes = list(g.generate_fingerings(
            self.tones, kind="arpeggio", direction="descending",
            max_fret=12, max_fret_span=5, limit=100,
        ))
        self.assertTrue(shapes)
        reversed_tones = list(reversed(self.tones))
        for shape in shapes:
            self.assertTrue(all(
                shape[i]["midi"] > shape[i + 1]["midi"]
                for i in range(len(shape) - 1)
            ))
            for tone, item in zip(reversed_tones, shape):
                self.assertEqual(tone.pitch_class, item["pitch_class"])

    def test_fret_span_constraint(self):
        shapes = list(g.generate_fingerings(
            self.tones, kind="chord", max_fret=12,
            max_fret_span=3, limit=200,
        ))
        for shape in shapes:
            frets = [item["fret"] for item in shape if item["fret"] > 0]
            self.assertLessEqual(max(frets) - min(frets), 3)

    def test_limit_is_respected(self):
        shapes = list(g.generate_fingerings(
            self.tones, kind="arpeggio", max_fret=24,
            max_fret_span=None, limit=7,
        ))
        self.assertEqual(len(shapes), 7)

    def test_max_midi_span_is_respected(self):
        shapes = list(g.generate_fingerings(
            self.tones, kind="chord", max_fret=12,
            max_fret_span=None, max_midi_span=12, limit=500,
        ))
        for shape in shapes:
            midis = [item["midi"] for item in shape]
            self.assertLessEqual(max(midis) - min(midis), 12)

    def test_custom_five_string_tuning(self):
        five_string = (
            ("B", 23), ("E", 28), ("A", 33), ("D", 38), ("G", 43)
        )
        shapes = list(g.generate_fingerings(
            self.tones, kind="chord", tuning=five_string,
            max_fret=7, max_fret_span=4, limit=100,
        ))
        self.assertTrue(shapes)
        self.assertTrue(all(
            len({item["string"] for item in shape}) == 3
            for shape in shapes
        ))

    def test_more_chord_tones_than_strings_returns_no_voicing(self):
        seven_tone = g.tones_from_scale_degrees(
            g.get_mode("C", "major", 1), 1, [1, 2, 3, 4, 5]
        )
        self.assertEqual(list(g.generate_fingerings(seven_tone, kind="chord")), [])

    def test_mode_fingerings_helper(self):
        mode = g.get_mode("C", "harmonic_minor", 1)
        results = list(g.generate_mode_fingerings(
            mode, chord_degrees=[1, 3, 5, 7], kind="chord",
            max_fret=12, max_fret_span=4, limit_per_chord=2,
        ))
        self.assertTrue(results)
        self.assertTrue(all(item["mode"].startswith("C Menor harmônico") for item in results))
        self.assertEqual({item["chord_root"] for item in results}, {"C", "D", "Eb", "F", "G", "Ab", "B"})
        for item in results:
            self.assertEqual(item["chord_degrees"], [1, 3, 5, 7])
            self.assertEqual(len(item["fingering"]), 4)

    def test_recipe_fingerings_helper(self):
        results = list(g.generate_recipe_fingerings(
            "D", "meio_diminuto_m7b5", kind="chord",
            max_fret=12, max_fret_span=4, limit=1,
        ))
        self.assertEqual(len(results), 1)
        self.assertEqual([item["pitch_class"] for item in results[0]], [2, 5, 8, 0])

    def test_invalid_search_parameters(self):
        for kwargs in (
            {"max_fret": -1},
            {"max_fret": 2.5},
            {"max_fret_span": -1},
            {"max_midi_span": -1},
            {"limit": -1},
        ):
            with self.subTest(kwargs=kwargs):
                with self.assertRaises(ValueError):
                    list(g.generate_fingerings(self.tones, **kwargs))


if __name__ == "__main__":
    unittest.main(verbosity=2)
