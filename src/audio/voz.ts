// Dizer a resposta em voz alta.
//
// Existe por causa do ciclo sem tela (F6-1): quem está no ônibus com o fone não vai olhar o celular
// para ver qual era o intervalo. **A resposta precisa ser dita.**
//
// Usa a síntese de fala do próprio navegador (`speechSynthesis`), que é a única forma de fazer isso
// sem gravação — e gravação é o que a decisão 59 diz que não temos. **Não é música de IA**: é o nome
// de uma nota lido em voz alta, como um leitor de tela faria.
//
// **A voz varia muito entre aparelhos**, e isso é limitação conhecida, não defeito a corrigir: em
// alguns Android a voz portuguesa não vem instalada. Por isso `disponivel()` existe, e por isso a
// tela oferece "repetir o som" como alternativa.
import type { Locale } from '../i18n';

const TAGS: Record<Locale, string> = { pt: 'pt-BR', en: 'en-US' };

/** A síntese de fala existe neste navegador? */
export const disponivel = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Diz o texto. Devolve quanto tempo estimado ele leva, em segundos — a estimativa serve ao ciclo,
 * que precisa saber quando agendar o passo seguinte sem esperar um evento que pode não chegar.
 *
 * Fala **devagar** (`rate: 0.9`): nome de nota e de intervalo são curtos e se perdem na velocidade
 * padrão, sobretudo em português com a voz errada instalada.
 */
export function falar(texto: string, locale: Locale): number {
  const estimativa = Math.max(1, Math.min(6, texto.length / 9));
  if (!disponivel() || !texto.trim()) return estimativa;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = TAGS[locale];
    u.rate = 0.9;
    const voz = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(TAGS[locale].slice(0, 2)));
    if (voz) u.voice = voz;
    window.speechSynthesis.speak(u);
  } catch {
    /* sem permissão ou sem voz: o ciclo segue, e quem quiser confere repetindo o som */
  }
  return estimativa;
}

export function calar() {
  if (disponivel()) { try { window.speechSynthesis.cancel(); } catch { /* nada a cancelar */ } }
}

/** Uma voz do idioma está instalada? Serve para a tela avisar antes de a pessoa contar com isso. */
export function vozDoIdioma(locale: Locale): boolean {
  if (!disponivel()) return false;
  try {
    return window.speechSynthesis.getVoices().some(v => v.lang.startsWith(TAGS[locale].slice(0, 2)));
  } catch { return false; }
}
