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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { drone, pararDrones } from '../audio/engine';
import { useGlobalParams } from '../catalog/params';
import { descreverRelacao } from '../catalog/relacao-texto';
import { buildChord, harmonicField, majorTonic, midi, noteName, pc, type ModoDoCampo, type Note } from '../theory/core';
import { intervalShort } from '../theory/names';
import { analisar, melodiaAcimaDe, notasCromaticas, reduzir } from '../theory/nota-sobre-acorde';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useLocale, useNaming, useT, type MessageKey } from '../i18n';
import type { Ctx, SettingValue } from '../catalog/types';

const CAMPOS: ModoDoCampo[] = ['maior', 'menor', 'menor-harmonica', 'menor-melodica'];
/** A roda das quintas, de 6 bemóis a 6 sustenidos — as treze grafias de tonalidade que existem. */
const QUINTAS = Array.from({ length: 13 }, (_, i) => i - 6);

export default function RelacoesMelodiaHarmonia({ onRunning, settings }: { onRunning?: (r: boolean) => void; settings?: Record<string, SettingValue> }) {
  const t = useT();
  const naming = useNaming();
  const conv = useLocale();
  const params = useGlobalParams();

  const [campo, setCampo] = useState<ModoDoCampo>(() => (CAMPOS.includes(settings?.campo as ModoDoCampo) ? settings!.campo as ModoDoCampo : 'maior'));
  // Padrão: só as notas da escala. Abrir para as doze é opt-in — decisão do Paulo em 07/11.
  const [cromatico, setCromatico] = useState(settings?.cromatico === true);
  const [soarMelodia, setSoarMelodia] = useState(settings?.soarMelodia !== false);
  const [tetrade, setTetrade] = useState(settings?.tetrade === true);
  const [iNota, setINota] = useState(0);
  const [iAcorde, setIAcorde] = useState(0);

  // A tonalidade vale pela RODA DAS QUINTAS, como no Harmonia: é o que garante Si♭ e não Lá♯.
  // Começa na tonalidade global quando há uma, e daí em diante quem manda é o seletor da tela.
  const [quintas, setQuintas] = useState(() => {
    const doPerfil = params.key?.tonic;
    if (doPerfil === undefined) return 0;
    const achada = QUINTAS.find(f => pc(majorTonic(f)) === doPerfil);
    return achada ?? 0;
  });
  const raiz: Note = useMemo(() => ({ ...majorTonic(quintas), oct: 4 }), [quintas]);

  const campoAtual = useMemo(() => harmonicField(raiz, campo, tetrade), [raiz, campo, tetrade]);
  const todasAsNotas = useMemo(() => notasCromaticas(raiz, campo), [raiz, campo]);
  const notas = useMemo(() => (cromatico ? todasAsNotas : todasAsNotas.filter(n => n.noCampo)), [todasAsNotas, cromatico]);

  const melodia = notas[Math.min(iNota, notas.length - 1)];
  const grau = campoAtual[Math.min(iAcorde, campoAtual.length - 1)];

  const ctx: Ctx = useMemo(() => ({ naming, conv, t, params }), [naming, conv, t, params]);

  // Os acordes do campo e a melodia numa oitava SÓ, acima de todos eles. É o que faz a nota ficar
  // mesmo parada quando o acorde troca: posicioná-la acima de cada acorde a fazia pular de oitava.
  const acordes = useMemo(() => campoAtual.map(g => buildChord(g.root, g.chord)), [campoAtual]);
  const melodiaFixa = useMemo(() => melodiaAcimaDe(acordes, melodia.nota, raiz), [acordes, melodia, raiz]);

  /** A relação da nota escolhida sobre um grau qualquer — alimenta a grade e a frase. */
  const relacaoCom = useCallback((i: number) =>
    analisar(acordes[i], melodiaFixa, campoAtual[i].chord), [acordes, melodiaFixa, campoAtual]);

  const iGrau = Math.min(iAcorde, campoAtual.length - 1);
  const atual = useMemo(() => relacaoCom(iGrau), [relacaoCom, iGrau]);

  // ---------------------------------------------------------------- som
  //
  // **Modos que sustentam, e não botões de segurar** (09/11). Segurar tinha um defeito que só
  // aparece usando: o ponteiro fica preso no botão, e aí **não dá para clicar na grade enquanto a
  // nota soa** — justamente o gesto que a tela existe para permitir. Com modo, aperta-se uma vez,
  // o som fica, e as duas mãos ficam livres para passear pelos acordes.
  const [modo, setModo] = useState<'nada' | 'ambos' | 'acorde' | 'nota'>('nada');

  // Dois efeitos separados, de propósito: assim trocar de ACORDE não reinicia a melodia. Num só,
  // qualquer mudança derrubaria os dois sons, e a nota "parada" daria um salto a cada clique.
  useEffect(() => {
    if (modo === 'nada' || modo === 'nota') return;
    const parar = drone(acordes[iGrau].map(midi), 0.7, 'acorde');
    return parar;
  }, [modo, acordes, iGrau]);

  useEffect(() => {
    if (modo === 'nada' || modo === 'acorde') return;
    const parar = drone([midi(melodiaFixa)], 0.75, 'destaque');
    return parar;
  }, [modo, melodiaFixa]);

  useEffect(() => { onRunning?.(modo !== 'nada'); }, [modo, onRunning]);

  // Rede de segurança: cala qualquer drone órfão ao entrar E ao sair. A limpeza dos efeitos acima
  // já cobre o caminho normal; isto cobre o caminho que der errado, para nunca mais ficar um som
  // tocando depois que a tela trocou.
  useEffect(() => { pararDrones(); return pararDrones; }, []);

  /** Aperta o modo que já está ligado para silenciar. */
  const alternar = (m: typeof modo) => setModo(atualModo => (atualModo === m ? 'nada' : m));

  useToolLog('relacoes-melodia-harmonia', 'Relações entre melodia e harmonia', 'perception.harmonic', modo !== 'nada',
    { settings: { campo, cromatico, soarMelodia, tetrade } });

  return (
    <div className="rmh" style={{ display: 'grid', gap: 18 }}>
      <p className="muted">{t('melodyHarmony.hint')}</p>
      {soarMelodia && <p className="rmh-dica">{t('melodyHarmony.tip')}</p>}

      <div className="field">
        <span>{t('melodyHarmony.key')}</span>
        <div className="row">
          <select className="sel" value={quintas} onChange={e => { setQuintas(Number(e.target.value)); setINota(0); }}
            aria-label={t('melodyHarmony.key')} id="rmh-tom">
            {QUINTAS.map(f => <option key={f} value={f}>{noteName(majorTonic(f), naming)}</option>)}
          </select>
        </div>
      </div>

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
          const r = relacaoCom(i);
          const curto = r.grauDoAcorde !== null
            ? t(`melodyHarmony.short_${r.grauDoAcorde}` as MessageKey)
            : intervalShort(reduzir(r.intervalo), conv);
          return (
            <button key={g.roman} type="button" className={`rmh-cel ${i === iGrau ? 'on' : ''}`}
              onClick={() => setIAcorde(i)} aria-pressed={i === iGrau}>
              <span className="rmh-roman">{g.roman}</span>
              <span className="rmh-cifra">{g.symbol}</span>
              <span className={`rmh-rel ${r.atritos.length ? 'atrito' : ''}`}>
                {curto}{r.atritos.length ? ' !' : ''}
              </span>
            </button>
          );
        })}
      </div>

      <p className="rmh-frase">{descreverRelacao(atual, { melodia: melodiaFixa, simbolo: grau.symbol, ctx })}</p>

      <div className="row">
        <Btn tone={modo === 'ambos' ? undefined : 'ghost'} onClick={() => alternar(soarMelodia ? 'ambos' : 'acorde')}>
          {t('melodyHarmony.playBoth')}
        </Btn>
        <Btn tone={modo === 'acorde' ? undefined : 'ghost'} onClick={() => alternar('acorde')}>{t('melodyHarmony.playChord')}</Btn>
        <Btn tone={modo === 'nota' ? undefined : 'ghost'} onClick={() => alternar('nota')}>{t('melodyHarmony.playNote')}</Btn>
        {/* Volta por pedido do Paulo: apertar o modo ligado já silencia, mas isso não é óbvio, e
            quem não descobrir fica sem saída. Estética própria de propósito — é escape, não modo. */}
        <button type="button" className="rmh-silenciar" onClick={() => setModo('nada')} disabled={modo === 'nada'}>
          {t('melodyHarmony.silence')}
        </button>
      </div>

      <div className="row">
        <label className="switch"><input type="checkbox" checked={cromatico} onChange={e => { setCromatico(e.target.checked); setINota(0); }} />{t('melodyHarmony.chromatic')}</label>
        <label className="switch"><input type="checkbox" checked={soarMelodia} onChange={e => setSoarMelodia(e.target.checked)} />{t('melodyHarmony.soundMelody')}</label>
        <label className="switch"><input type="checkbox" checked={tetrade} onChange={e => setTetrade(e.target.checked)} />{t('melodyHarmony.tetrad')}</label>
      </div>

      {!soarMelodia && <p className="muted">{t('melodyHarmony.singIt')}</p>}
    </div>
  );
}
