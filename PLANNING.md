# NOLImpiadi Manager V2 — Planning

## Obiettivo

Modernizzare il sistema mantenendo l’idea di base:
- 4 discipline in parallelo (1 match per disciplina per turno)
- 12 atleti totali
- per ogni turno: 10 atleti giocano, 2 atleti riposano
- classifica generale permanente 1–12, con finali per i qualificati

## Parametri disciplina (proposta “standard”)

### Calcio-balilla (Doppio)
- Target vittoria: 5 (fisso)
- Peso: 21
- Team size: 2
- Validazione: una squadra deve arrivare a 5; il perdente 0–4

### Ping-pong (Singolo)
- Target vittoria: 11 (fisso)
- Peso: 15
- Team size: 1

### Freccette (Singolo)
- Target vittoria: 220 (fisso)
- Peso: 1
- Team size: 1

admincalendar

## Punteggio (efficienza + peso)

### Efficienza match

eff = (Fatti - (Subiti / P)) / Target

Dove:
- Fatti = punti segnati dal lato dell’atleta
- Subiti = punti segnati dagli avversari nel match
- Target = target vittoria della disciplina
- P = divisore malus (proposta: 1000)

### Punteggio pesato in classifica

weighted = eff * coefficiente_disciplina

## Equità: quote e riposi

### Principio
Per evitare vantaggi da “numero match giocati”, in qualificazione ogni atleta deve avere:
- riposi bilanciati (differenza max 1)
- numero match per disciplina il più possibile bilanciato (differenza max 1)

### Turni qualificazione (scelta)
Scelta consigliata: 6 turni di qualificazione.
- Ogni turno produce 4 match: basket + ping-pong + freccette + calcio-balilla
- Totale atleti coinvolti a turno = 2+2+2+4 = 10 (2 riposo)

Nota: sul calcio-balilla (doppio) la simmetria perfetta richiede più turni oppure una quota esplicita (es. “min 3, max 4 match a testa”) rispettata dal generatore.

## Generazione turni (regole)

### Input
- lista atleti con categoria (100 / 75 / 50 / 25), 3 atleti per categoria
- storico match qualificazione già registrati
- conteggio riposi per atleta
- conteggio match per disciplina per atleta
- conteggio ripetizioni:
  - singoli: coppie già affrontate per disciplina
  - doppio: compagni già fatti e match-up già disputati

### Output di ogni turno
- 2 atleti a riposo (scelti tra quelli con più match giocati/riposi meno frequenti)
- 3 match singoli (basket/ping-pong/freccette): pairing bilanciato e poco ripetitivo
- 1 match doppio (calcio-balilla): split di 4 atleti in 2 team bilanciati e poco ripetitivo
- target precompilati secondo i parametri disciplina

### Priorità consigliate
1) Bilanciare riposi (nessuno resta indietro)
2) Bilanciare match per disciplina (differenza max 1)
3) Minimizzare ripetizioni (coppie singolo / compagni e match-up nel doppio)
4) Bilanciare categorie (match-up “equilibrati” o “sfida” a scelta; default: equilibrati)

## Finali

### Qualificazione
- Calcio-balilla: top 5
- Freccette: top 6
- Ping-pong: top 6
- Basket: top 6

### Classifica generale
- Tutti i 12 restano in classifica fino alla fine
- I finalisti aggiungono anche i punti (pesati) ottenuti nei match di finali

## Modifiche da implementare (prossimo step)

1) Rendere configurabile P (divisore malus) a livello di sistema
2) Rendere target “fissi” per le discipline come sopra (o configurabili da admin)
3) Aggiornare il generatore turni per rispettare quote/riposi con vincoli espliciti
4) UI giudici: bottone “Genera turno” con indicazione riposi + precompilazione match
