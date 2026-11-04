// Mãos livres (F6-1): a tela que não precisa ser olhada.
//
// O ciclo é: **toca a pergunta → espera → diz a resposta → segue.** A pessoa nunca responde nada, e é
// isso que a torna possível de fazer no bolso, no ônibus ou dirigindo.
//
// **A tela existe para configurar e para começar**, não para acompanhar. Depois do "começar" ela só
// mostra o que está acontecendo para quem quiser olhar — e nada no ciclo depende de olhar.
//
// O conteúdo vem dos exercícios de ouvido que já existem (`catalog/maos-livres.ts`): `make()` dá o som
// **e a resposta por extenso**, que é o par de que um ciclo sem tela precisa.
import { useCallback, useEffect, useRef, useState } from 'react';
import { exerciseById } from '../catalog/catalog';
import { globalPresentation, useGlobalParams } from '../catalog/params';
import { duracaoDoPasso, OBJETOS_DE_BOLSO, PENSAR, proximoPasso, type Anuncio, type Passo } from '../catalog/maos-livres';
import { isSeries, type Ctx, type SettingValue } from '../catalog/types';
import { pararTudo } from '../audio/engine';
import { playContent, resolvePresentation } from '../audio/presentation';
import { calar, falar, vozDoIdioma } from '../audio/voz';
import { Btn, Chip } from '../components/ui';
import { useToolLog } from './common';
import { useLocale, useNaming, useT, type MessageKey } from '../i18n';

const ANUNCIOS: { id: Anuncio; label: MessageKey }[] = [
  { id: 'voz', label: 'handsfree.anuncioVoz' },
  { id: 'repetir', label: 'handsfree.anuncioRepetir' },
  { id: 'ambos', label: 'handsfree.anuncioAmbos' },
];

export default function MaosLivres({ onRunning, settings }: { onRunning?: (r: boolean) => void; settings?: Record<string, SettingValue> }) {
  const t = useT();
  const naming = useNaming();
  const locale = useLocale();
  const params = useGlobalParams();

  // A configuração da etapa, quando o item vem de uma rotina. É o que faz a "De bolso" ser quatro
  // variações deste mesmo ciclo em vez de quatro cópias iguais.
  const [objetos, setObjetos] = useState<string[]>(() => {
    const v = settings?.objetos;
    return Array.isArray(v) && v.length ? v.map(String).filter(x => OBJETOS_DE_BOLSO.includes(x)) : ['intervalos'];
  });
  const [pensar, setPensar] = useState(() => (typeof settings?.pensar === 'number' ? settings.pensar : PENSAR.padrao));
  const [anuncio, setAnuncio] = useState<Anuncio>(() => {
    const v = settings?.anuncio;
    return v === 'repetir' || v === 'ambos' || v === 'voz' ? v : 'voz';
  });
  const [rodando, setRodando] = useState(false);
  const [passo, setPasso] = useState<Passo | null>(null);
  const [revelado, setRevelado] = useState(false);
  const [feitas, setFeitas] = useState(0);

  // sem voz do idioma instalada, prometer "dita em voz alta" seria mentira: a tela avisa e repete o som
  const [temVoz] = useState(() => vozDoIdioma(locale));
  const anuncioReal: Anuncio = anuncio === 'voz' && !temVoz ? 'repetir' : anuncio;

  useToolLog('maos-livres', 'Mãos livres', 'perception.melodic', rodando, { settings: { objetos, pensar, anuncio } });
  useEffect(() => { onRunning?.(rodando); }, [rodando, onRunning]);

  /** Os temporizadores do ciclo, para parar na hora de parar. */
  const relogios = useRef<number[]>([]);
  const limpar = useCallback(() => { relogios.current.forEach(window.clearTimeout); relogios.current = []; }, []);
  const depois = (ms: number, fn: () => void) => { relogios.current.push(window.setTimeout(fn, ms)); };

  useEffect(() => () => { limpar(); pararTudo(); calar(); }, [limpar]);

  const ctx: Ctx = { naming, conv: locale, t, params };

  /**
   * Um ciclo. Agendado com `setTimeout` de propósito — e isso **não** contraria a regra do relógio de
   * áudio: as notas de cada pergunta são agendadas pelo relógio do áudio, dentro de `playContent`. O
   * que o `setTimeout` marca é "quando começa a próxima pergunta", que é uma pausa de segundos para a
   * pessoa pensar, não um evento musical.
   */
  const ciclo = useCallback(() => {
    const p = proximoPasso(objetos, (itemId, settings) => {
      const item = exerciseById[itemId];
      if (!item || !isSeries(item)) throw new Error(`fonte sem exercício: ${itemId}`);
      return item.make({ ...item.defaults, ...settings } as Record<string, SettingValue>, ctx);
    }, ctx);
    if (!p) { setRodando(false); return; }

    setPasso(p);
    setRevelado(false);
    const item = exerciseById[p.itemId]!;
    const apresentacao = resolvePresentation([globalPresentation(params, p.pergunta.sound?.instrument), item.presentation]);
    const dur = p.pergunta.sound ? playContent(p.pergunta.sound, apresentacao) : 0;

    depois((dur + pensar) * 1000, () => {
      setRevelado(true);
      let extra = 2;
      if (anuncioReal === 'repetir' || anuncioReal === 'ambos') {
        if (p.pergunta.sound) extra = playContent(p.pergunta.sound, apresentacao) + 0.5;
      }
      if (anuncioReal === 'voz' || anuncioReal === 'ambos') {
        extra = Math.max(extra, falar(p.resposta, locale));
      }
      setFeitas(n => n + 1);
      depois(extra * 1000 + 600, ciclo);
    });
  }, [objetos, pensar, anuncioReal, locale, params, ctx]);

  const comecar = () => {
    if (objetos.length === 0) return;
    setFeitas(0);
    setRodando(true);
    ciclo();
  };
  const parar = () => { limpar(); pararTudo(); calar(); setRodando(false); setPasso(null); };

  const alternar = (id: string) => setObjetos(o => (o.includes(id) ? o.filter(x => x !== id) : [...o, id]));
  const duracao = Math.round(duracaoDoPasso(2.5, pensar, anuncioReal));

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <p className="muted">{t('handsfree.hint')}</p>

      {!rodando && (
        <>
          <div style={{ display: 'grid', gap: 6 }}>
            <span className="eyebrow">{t('handsfree.objetos')}</span>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {OBJETOS_DE_BOLSO.map(id => (
                <Chip key={id} on={objetos.includes(id)} onClick={() => alternar(id)}>{t(`handsfree.obj_${id}` as MessageKey)}</Chip>
              ))}
            </div>
            {objetos.length === 0 && <p className="muted" style={{ margin: 0 }}>{t('handsfree.noObjects')}</p>}
          </div>

          <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
            <span className="eyebrow">{t('handsfree.pensar')} · {pensar}s</span>
            <input type="range" min={PENSAR.min} max={PENSAR.max} step={1} value={pensar}
              onChange={e => setPensar(Number(e.target.value))} />
          </label>

          <div style={{ display: 'grid', gap: 6 }}>
            <span className="eyebrow">{t('handsfree.anuncio')}</span>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {ANUNCIOS.map(a => <Chip key={a.id} on={anuncio === a.id} onClick={() => setAnuncio(a.id)}>{t(a.label)}</Chip>)}
            </div>
            {anuncio === 'voz' && !temVoz && <p className="muted" style={{ margin: 0 }}>{t('handsfree.noVoice')}</p>}
          </div>
        </>
      )}

      <div className="row">
        {rodando
          ? <Btn onClick={parar}>{t('handsfree.stop')}</Btn>
          : <Btn onClick={comecar} disabled={objetos.length === 0}>{t('handsfree.start')}</Btn>}
        {rodando && <span className="muted">{t('handsfree.running')} · {t('handsfree.count', { n: feitas })}</span>}
      </div>

      {/* Daqui para baixo é só para quem quiser olhar. O ciclo não depende de nada disto. */}
      {rodando && passo && (
        <div className="panel" style={{ display: 'grid', gap: 8 }}>
          <span className="eyebrow">{t(`handsfree.obj_${passo.fonte}` as MessageKey)} · ~{duracao}s</span>
          <b style={{ fontSize: 22 }}>{revelado ? passo.resposta : t('handsfree.thinking')}</b>
          {revelado && <span className="muted">{t('handsfree.answer')}</span>}
        </div>
      )}
    </div>
  );
}
