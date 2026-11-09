// Relações entre melodia e harmonia (nome do Paulo, 07/11/2026).
//
// **Uma nota fica parada e os acordes passam por baixo dela.** O desenho inteiro sai daí: o
// aprendizado é a COMPARAÇÃO — como o mesmo Dó soa sobre cada grau do campo —, então os sete
// acordes ficam lado a lado com o que a nota é sobre cada um, em vez de aparecerem um de cada vez.
//
// O app não ouve ninguém: é `tarefa`, termina em autoavaliação (decisão 5). E quando a pessoa
// desliga o som da melodia para cantá-la, continua sendo ela quem sabe se acertou.
//
// O motor mora em `theory/nota-sobre-acorde.ts` e a frase em `catalog/relacao-texto.ts`; aqui é só
// tela e som.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { drone } from '../audio/engine';
import { useGlobalParams } from '../catalog/params';
import { descreverRelacao } from '../catalog/relacao-texto';
import { harmonicField, midi, note, noteName, type ModoDoCampo, type Note } from '../theory/core';
import { intervalShort } from '../theory/names';
import { analisar, notasCromaticas, reduzir, vozear } from '../theory/nota-sobre-acorde';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useLocale, useNaming, useT, type MessageKey } from '../i18n';
import type { Ctx, SettingValue } from '../catalog/types';

const CAMPOS: ModoDoCampo[] = ['maior', 'menor', 'menor-harmonica', 'menor-melodica'];

export default function RelacoesMelodiaHarmonia({ onRunning, settings }: { onRunning?: (r: boolean) => void; settings?: Record<string, SettingValue> }) {
  const t = useT();
  const naming = useNaming();
  const conv = useLocale();
  const params = useGlobalParams();

  const [campo, setCampo] = useState<ModoDoCampo>(() => (CAMPOS.includes(settings?.campo as ModoDoCampo) ? settings!.campo as ModoDoCampo : 'maior'));
  // Padrão: só as notas da escala. Abrir para as doze é opt-in — decisão do Paulo em 07/11.
  const [cromatico, setCromatico] = useState(settings?.cromatico === true);
  const [reduzido, setReduzido] = useState(settings?.intervaloSoante !== true);
  const [soarMelodia, setSoarMelodia] = useState(settings?.soarMelodia !== false);
  const [travar, setTravar] = useState(settings?.travar === true);
  const [iNota, setINota] = useState(0);
  const [iAcorde, setIAcorde] = useState(0);

  // A tônica vem da tonalidade global quando há uma; com "livre", Dó — é preciso UMA para montar
  // o campo, e inventar uma diferente a cada render deixaria a grade instável.
  const tonica: Note = useMemo(() => note(0, 0, 4), []);
  const tonicaPc = params.key?.tonic ?? 0;
  const raiz: Note = useMemo(() => {
    const doze = notasCromaticas(tonica, 'maior');
    return { ...doze.find(d => (midi(d.nota) - midi(tonica) + 12) % 12 === tonicaPc)!.nota };
  }, [tonica, tonicaPc]);

  const campoAtual = useMemo(() => harmonicField(raiz, campo), [raiz, campo]);
  const todasAsNotas = useMemo(() => notasCromaticas(raiz, campo), [raiz, campo]);
  const notas = useMemo(() => (cromatico ? todasAsNotas : todasAsNotas.filter(n => n.noCampo)), [todasAsNotas, cromatico]);

  const melodia = notas[Math.min(iNota, notas.length - 1)];
  const grau = campoAtual[Math.min(iAcorde, campoAtual.length - 1)];

  const ctx: Ctx = useMemo(() => ({ naming, conv, t, params }), [naming, conv, t, params]);

  /** A relação da nota escolhida sobre um grau qualquer — alimenta a grade e a frase. */
  const relacaoCom = useCallback((g: typeof grau) => {
    const v = vozear(g.root, g.chord, melodia.nota);
    return { v, r: analisar(v.acorde, v.melodia, g.chord) };
  }, [melodia]);

  const atual = useMemo(() => relacaoCom(grau), [relacaoCom, grau]);

  // ---------------------------------------------------------------- som
  const pararAcorde = useRef<(() => void) | null>(null);
  const pararNota = useRef<(() => void) | null>(null);
  const [soando, setSoando] = useState(false);

  const silenciar = useCallback(() => {
    pararAcorde.current?.(); pararAcorde.current = null;
    pararNota.current?.(); pararNota.current = null;
    setSoando(false);
  }, []);
  useEffect(() => silenciar, [silenciar]);
  useEffect(() => { onRunning?.(soando); }, [soando, onRunning]);

  const tocarAcorde = useCallback(() => {
    pararAcorde.current?.();
    pararAcorde.current = drone(atual.v.acorde.map(midi), 0.7, 'fundo');
    setSoando(true);
  }, [atual]);

  const tocarNota = useCallback(() => {
    pararNota.current?.();
    pararNota.current = drone([midi(atual.v.melodia)], 0.75, 'destaque');
    setSoando(true);
  }, [atual]);

  /** Trocar de acorde com a nota travada: o acorde é refeito embaixo, a nota não para. */
  const escolherAcorde = (i: number) => {
    setIAcorde(i);
    if (pararAcorde.current) {
      const g = campoAtual[i];
      const v = vozear(g.root, g.chord, melodia.nota);
      pararAcorde.current();
      pararAcorde.current = drone(v.acorde.map(midi), 0.7, 'fundo');
    }
  };

  useToolLog('relacoes-melodia-harmonia', 'Relações entre melodia e harmonia', 'perception.harmonic', soando,
    { settings: { campo, cromatico, soarMelodia } });

  /**
   * Botão que soa **enquanto pressionado**.
   *
   * ⚠️ Não usa o `Btn` de `components/ui`, e isso não é preguiça: o `Btn` desestrutura só os props
   * que conhece (`onClick`, `tone`, `small`…) e **descarta o resto em silêncio**. Passar
   * `onPointerDown` para ele não dá erro de tipo — spread em JSX não reclama de propriedade
   * sobrando — e o manipulador simplesmente nunca chega ao DOM. Foi exatamente o que aconteceu:
   * os botões existiam, respondiam ao clique e não tocavam nada.
   */
  const Segurar = ({ liga, desliga, tone, children }: { liga: () => void; desliga: () => void; tone?: string; children: React.ReactNode }) => (
    <button
      type="button" className={`btn ${tone ?? ''}`}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); liga(); }}
      onPointerUp={desliga} onPointerCancel={desliga}
      // o teclado não tem "segurar": espaço e enter ligam, e o `blur` desliga
      onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); liga(); } }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') desliga(); }}
      onBlur={desliga}
    >
      <span>{children}</span>
    </button>
  );
  const soltarAcorde = () => { pararAcorde.current?.(); pararAcorde.current = null; if (!pararNota.current) setSoando(false); };
  const soltarNota = () => { pararNota.current?.(); pararNota.current = null; if (!pararAcorde.current) setSoando(false); };

  return (
    <div className="rmh" style={{ display: 'grid', gap: 18 }}>
      <p className="muted">{t('melodyHarmony.hint')}</p>

      <div className="field">
        <span>{t('melodyHarmony.field')}</span>
        <div className="row">
          {CAMPOS.map(c => (
            <Chip key={c} on={campo === c} onClick={() => { setCampo(c); setINota(0); }}>{t(`melodyHarmony.field_${c}` as MessageKey)}</Chip>
          ))}
        </div>
      </div>

      <div className="field">
        <span>{t('melodyHarmony.melodyNote')}</span>
        <div className="row">
          {notas.map((n, i) => (
            <Chip key={n.label} on={i === Math.min(iNota, notas.length - 1)} onClick={() => setINota(i)}>
              {n.label} · {noteName(n.nota, naming)}
            </Chip>
          ))}
        </div>
      </div>

      {/* A grade: a mesma nota contra os sete graus, de relance. É o ponto da tela. */}
      <div className="rmh-grade" role="group" aria-label={t('melodyHarmony.field')}>
        {campoAtual.map((g, i) => {
          const { r } = relacaoCom(g);
          const curto = r.grauDoAcorde !== null
            ? t(`melodyHarmony.short_${r.grauDoAcorde}` as MessageKey)
            : intervalShort(reduzido ? reduzir(r.intervalo) : r.intervalo, conv);
          return (
            <button key={g.roman} type="button" className={`rmh-cel ${i === Math.min(iAcorde, campoAtual.length - 1) ? 'on' : ''}`}
              onClick={() => escolherAcorde(i)} aria-pressed={i === iAcorde}>
              <span className="rmh-roman">{g.roman}</span>
              <span className="rmh-cifra">{g.symbol}</span>
              <span className={`rmh-rel ${r.atritos.length ? 'atrito' : ''}`}>
                {curto}{r.atritos.length ? ' !' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <p className="rmh-frase">{descreverRelacao(atual.r, { melodia: atual.v.melodia, simbolo: grau.symbol, ctx, reduzido })}</p>

      <div className="row">
        <Segurar liga={() => { tocarAcorde(); if (soarMelodia) tocarNota(); }} desliga={() => { soltarAcorde(); soltarNota(); }}>
          {t('melodyHarmony.playBoth')}
        </Segurar>
        <Segurar tone="ghost" liga={tocarAcorde} desliga={soltarAcorde}>{t('melodyHarmony.playChord')}</Segurar>
        {travar ? (
          <Btn tone="ghost" onClick={() => (pararNota.current ? soltarNota() : tocarNota())}>
            {pararNota.current ? t('melodyHarmony.stopNote') : t('melodyHarmony.holdNote')}
          </Btn>
        ) : (
          <Segurar tone="ghost" liga={tocarNota} desliga={soltarNota}>{t('melodyHarmony.playNote')}</Segurar>
        )}
        {soando && <Btn tone="mu" onClick={silenciar}>{t('melodyHarmony.silence')}</Btn>}
      </div>

      <div className="row">
        <label className="switch"><input type="checkbox" checked={cromatico} onChange={e => { setCromatico(e.target.checked); setINota(0); }} />{t('melodyHarmony.chromatic')}</label>
        <label className="switch"><input type="checkbox" checked={soarMelodia} onChange={e => setSoarMelodia(e.target.checked)} />{t('melodyHarmony.soundMelody')}</label>
        <label className="switch"><input type="checkbox" checked={travar} onChange={e => setTravar(e.target.checked)} />{t('melodyHarmony.hold')}</label>
        <label className="switch"><input type="checkbox" checked={!reduzido} onChange={e => setReduzido(!e.target.checked)} />{t('melodyHarmony.asSounds')}</label>
      </div>

      {!soarMelodia && <p className="muted">{t('melodyHarmony.singIt')}</p>}
    </div>
  );
}
