# Guia · gravar as amostras de áudio

Para a tarefa [`A0`](../tarefas/F5-som.md#a0--👤💻-espigão-medir-antes-de-prometer). **Sem estes
arquivos, nenhuma tarefa de microfone tem teste automático** — e sem teste automático a IA de quem
pegar a tarefa não tem como saber se acertou.

É cerca de **uma hora**. Faça de uma vez, num dia normal, no lugar onde você realmente estuda.

---

## O que você precisa

- O celular (microfone ruim, de propósito).
- Um notebook, ou um microfone melhor se tiver.
- O baixo.
- Um afinador ou app de referência, para saber a altura certa do que você gravou.

**Não** precisa de estúdio, nem de silêncio artificial. **O ruído de fundo normal da sua casa é
parte do teste** — é nele que o app vai rodar.

---

## Como gravar

Formato: **WAV ou FLAC, 48 kHz**. Se o app do celular só salvar em m4a ou mp3, tudo bem — anote o
formato no `README.md`. MP3 de 128 kbps já atrapalha a detecção de altura, e isso em si é um
resultado que vale medir.

**Um arquivo por item da lista.** Arquivo curto é melhor: 10 a 20 segundos basta.

Nomeie assim, tudo minúsculo e sem acento:

```
<fonte>-<o-que-e>-<microfone>-<condicao>.wav

voz-grave-sustentada-cel-afinada.wav
voz-grave-sustentada-note-ruido.wav
baixo-corda-mi-cel-afinada.wav
palmas-sincopado-120-cel-afinada.wav
```

- **fonte:** `voz-grave`, `voz-aguda`, `baixo`, `palmas`, `estalos`, `mesa`
- **microfone:** `cel` (celular) ou `note` (notebook/microfone melhor)
- **condição:** `afinada`, `desafinada`, `vibrato`, `ruido`, `baixinho`

---

## A lista

Marque conforme for gravando. **Cada linha é gravada duas vezes: celular e notebook.**

### Voz — é o caso mais importante, porque é o mais fácil de medir e o primeiro a entrar

- [x] **Voz grave, nota sustentada e afinada.** Segure uma nota confortável por ~5 s. Anote qual é.
- [x] **Voz grave, a mesma nota ~30 cents desafinada.** Afine pelo app, depois suba *um
      pouquinho* de propósito — menos de um semitom. Anote para que lado.
- [x] **Voz grave, com vibrato.** Oscilando como se estivesse cantando de verdade.
- [x] **Voz grave, cantando baixinho.** Quase sussurrado, para testar o limiar de volume.
- [x] **Voz aguda, nota sustentada e afinada.** Peça para alguém, ou cante em falsete.
- [x] **Voz aguda, desafinada e com vibrato** — mesmas duas variações de cima.
- [x] **Voz grave, com ruído de fundo.** Televisão ou conversa noutro cômodo, volume normal.
- [x] **Uma escala cantada, devagar.** Dó ré mi fá sol lá si dó, uma nota por segundo, dizendo o
      nome. É o caso real de "solfejar escalas".

### Baixo — para o afinador e para "notas isoladas no instrumento"

- [ ] **Corda Mi solta, sustentada.**
- [ ] **Corda Sol solta, sustentada.**
- [ ] **Corda Mi, nota pisada na casa 5, sustentada.**
- [ ] **Corda Mi solta, desafinada** meio tom abaixo. É o caso de uso do afinador.
- [ ] **Nota curta, staccato**, na corda Mi. É o caso que a detecção **não** deve aguentar — e
      medir isso é tão útil quanto medir o que funciona.
- [ ] **Escala de uma oitava, devagar**, uma nota por segundo.

### Ritmo — para o ritmo relativo

Para estes, **use metrônomo** e anote o andamento. O que interessa é o intervalo entre as batidas,
não o alinhamento com o clique — mas sem referência não dá para conferir.

- [ ] **Palmas, semínimas a 60 bpm**, uns 8 compassos.
- [ ] **Palmas, semínimas a 120 bpm.**
- [ ] **Palmas, colcheias a 80 bpm.**
- [ ] **Palmas, um ritmo sincopado** — por exemplo `1 e _ a 2 _ e _`. Anote qual, em palavras.
- [ ] **Estalos de dedo**, o mesmo sincopado. Som mais fraco, ataque mais difícil de detectar.
- [ ] **Batida na mesa**, o mesmo sincopado. Som mais grave e abafado.
- [ ] **Palmas numa sala com eco** — banheiro, cozinha, escada. A reverberação borra o ataque, e é
      aqui que o detector mais erra.
- [ ] **Baixo tocando o mesmo sincopado**, uma nota só.

---

## O `README.md` ao lado dos arquivos

Em `test-fixtures/audio/README.md`, uma linha por arquivo:

```md
| arquivo | o que é | nota/andamento | microfone | observação |
|---|---|---|---|---|
| voz-grave-sustentada-cel-afinada.wav | Lá2 sustentado, 5 s | A2 (110 Hz) | celular | — |
| voz-grave-sustentada-cel-desafinada.wav | o mesmo, ~30 cents acima | A2 +30c | celular | subi de propósito |
| palmas-sincopado-120-cel-afinada.wav | 1 e _ a 2 _ e _ | 120 bpm | celular | 8 compassos |
```

**A nota e o andamento são obrigatórios.** Sem eles o arquivo não serve de teste — não há com o que
comparar o que o algoritmo detectou.

---

## O que acontece depois

A tarefa `A0` mede estes arquivos e escreve `docs/medidas/microfone.md` com erro em cents, taxa de
erro de oitava e ataques detectados, no Chrome e no Safari do iPhone.

**O portão sugerido é ±15 cents na mediana da voz.** Se der pior, o microfone sai do beta — e isso
é um resultado de sucesso da tarefa, não um fracasso. Melhor descobrir numa tarde do que depois de
três semanas de código.
