# Amostras de áudio

Gravadas pelo Paulo em 03/11/2026, no celular, para a tarefa
[`A0`](../../docs/tarefas/F5-som.md). **Sem elas, nenhuma tarefa de microfone tem teste automático.**

**Os arquivos versionados são `.m4a`** — a gravação original, 4,5 MB. Os `.wav` que as ferramentas leem
são **gerados**, e não versionados (seriam 26 MB):

```bash
npm run audio:prep
```

**Microfone: celular** em todas. Não há o par "notebook" que o guia previa — o que significa que
**ainda não dá para comparar microfone bom com ruim**. Isso não impede medir se o microfone *entra*; só
impede saber o quanto o aparelho influencia.

**O ruído de fundo é normal de casa**, de propósito: é nele que o app vai rodar.

## Ritmo

O padrão sincopado escolhido pelo Paulo é **semínima pontuada · semínima pontuada · semínima** —
ou seja **3 + 3 + 2** em colcheias, que é o *tresillo*. A análise confirmou as proporções (1,51 · 1,49 ·
1,00), então o que ele tocou é o que ele descreveu.

| arquivo | o que é | andamento | medido |
|---|---|---|---|
| `palmas-seminimas-60-cel` | palmas, semínimas | 60 bpm | **59,9 bpm** · 20 ataques |
| `palmas-seminimas-120-cel` | palmas, semínimas | 120 bpm | **120,1 bpm** · 32 ataques |
| `palmas-colcheias-80-cel` | palmas, colcheias | 80 bpm | **160,9 colcheias/min** (= 80 bpm) · 63 ataques |
| `palmas-sincopado-120-cel` | palmas, 3+3+2 | 120 bpm | proporções **1,51 · 1,49 · 1,00** |
| `estalos-sincopado-120-cel` | estalos de dedo, 3+3+2 | 120 bpm | proporções 1,63 · 1,58 · 1,01 |
| `mesa-sincopado-cel` | batida na mesa, 3+3+2 | 120 bpm | proporções 1,63 · 1,66 · 1,00 |
| `baixo-sincopado-continuo-cel` | baixo, 3+3+2, notas ligadas, Dó | 120 bpm | Dó2 detectado |
| `baixo-sincopado-staccato-cel` | baixo, 3+3+2, staccato | 120 bpm | Dó2 detectado |

**Falta:** palmas numa sala com eco (banheiro). O Paulo não conseguiu gravar. É o caso em que a
reverberação borra o ataque, e **é onde o detector mais erra** — então o portão da `A4` fica sem o
pior caso até essa gravação existir.

## Baixo

| arquivo | o que é | nota esperada | detectado |
|---|---|---|---|
| `baixo-mi-solta-alto-cel` | corda Mi solta, volume alto | Mi1 (28) | **Mi2 (39,8)** — erro de oitava |
| `baixo-mi-solta-medio-cel` | corda Mi solta, volume médio | Mi1 (28) | Mi2 (39,8) — erro de oitava |
| `baixo-sol-solta-cel` | corda Sol solta | Sol2 (43) | **Sol2 (43,00)** ✅ |
| `baixo-mi-casa5-cel` | corda Mi, casa 5 | Lá1 (33) | **Lá1 (32,98)** ✅ |
| `baixo-mi-desafinada-cel` | corda Mi, desafinada **para baixo** | abaixo de Mi | Mi2 −26 cents ✅ (direção certa) |
| `baixo-mi-curta-cel` | nota curta, staccato | Mi1 (28) | Mi1 (27,98), só **9 janelas** |
| `baixo-escala-do-cel` | escala de Dó maior, devagar | — | notas variando, como esperado |

## Voz

Cantadas **de ouvido**, sem afinador — então o desvio medido mistura erro do detector com o canto, e os
dois **não se separam com estes dados**. Ver a ressalva em [`docs/medidas/microfone.md`](../../docs/medidas/microfone.md).

| arquivo | o que é | detectado |
|---|---|---|
| `voz-grave-mi-afinada-cel` | voz grave, Mi, junto da corda solta | **Mi2 (40,13)** ✅ |
| `voz-grave-mi-desafinada-cel` | voz grave, Mi um pouco acima | Fá2 (40,79) — +79 cents |
| `voz-grave-sol-vibrato-cel` | voz grave, Sol, com vibrato | Sol2 (43,15) ✅ |
| `voz-grave-sol-baixinho-cel` | voz grave, Sol, quase sussurrado | Sol2 (43,46) — o menos estável |
| `voz-grave-la-ruido-cel` | voz grave, Lá, com ruído de fundo | **Lá2 (45,17)** ✅ |
| `voz-aguda-sol-afinada-cel` | voz aguda, Sol3 | **Sol3 (54,86)** ✅ |
| `voz-aguda-sol-desafinada-cel` | voz aguda, Sol3 mais agudo | Sol3 (55,32) — +32 cents |
| `voz-aguda-sol-desafinada-vibrato-cel` | voz aguda, desafinada, com vibrato | Sol3 (55,26) |
| `voz-escala-do-cel` | escala de Dó cantada, devagar | notas variando |

## O metrônomo vazou?

Sim, mas **10 a 15 dB abaixo das palmas** — com limiar de detecção normal (30% do pico) ele não é
contado. Medido baixando o limiar: o número de ataques só muda abaixo de 8%.

Isso acabou virando um **teste melhor**: um detector com limiar mal escolhido vai contar o clique, e a
amostra acusa.
