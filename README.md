# Vaktmester Larsen – førehandsvisning

Statisk demo (HTML/CSS/JS, ingen byggesteg). Dette er ei førehandsvisning, ikkje ei offisiell side.
Sida er merkt noindex, og `robots.txt` seier `Disallow: /`.

Offentleg: `index.html`. Internt (ikkje i offentleg meny): `oppdrag.html` og `lager.html`.

Åpne lokalt:

```bash
python3 -m http.server 8765 --directory /workspace/vaktmester-larsen
```

Deretter http://127.0.0.1:8765/

## Hva demoen inneholder

- Offentlig side med tjenester, veiledende priser, område, anbudsskjema og en regelbasert sekretær
- Intern arbeidsoversikt med oppdrag, faste snøkunder, innboks for forespørsler, og trekk fra lager på jobben
- Intern lageroversikt med minstnivå, +/- justering og eksport/import

All intern data ligger i nettleserens localStorage på den enheten som brukes.

## Veiledende priser (ikke Lasses priser)

Tabellen på forsiden viser avrundede typiske markedsnivåer i Norge 2025–2026. De er merket «veiledende, eks./inkl. mva – endelig pris etter avtale». Kildene er ikke enige om moms er inkludert, og tallene er ikke bekreftet av Lasse Larsen.

Brukt i tabellen:

- Timepris praktisk arbeid: 550–800 kr/t
- Snømåking privat innkjørsel per gang: 800–1 500 kr
- Sesongavtale privat innkjørsel: 4 000–10 000 kr
- Strøing, mindre areal, per gang: 300–800 kr
- Lite enkeltoppdrag (noen timer): 1 800–4 000 kr
- Utrykning: etter avtale (ikke et fast markedstall)

Kilder:

- Timepris 450–750 kr/t eks. mva (oppdatert 20.08.2025): https://vaktmestertilbud.no/pris-vaktmester
- Timepris ofte 500–750 kr (2026): https://vaktmesterplassen.no/guide/vaktmester-pris
- Timepris 590–890 kr, enkeltoppdrag 1 800–4 000 kr (2026): https://hageoglandskap.no/pris-vaktmestertjenester
- Timepris 450–750 kr/t eks. mva (21.03.2026): https://www.oppussingsguiden.no/prosjektguider/fagfolk/vaktmester/
- Timepris også omtalt som 465–685 kr/t (31.03.2026): https://vaktmestertilbud.no/pris-vaktmestertjenester
- Snømåking per utrykning 800–1 500 kr, strøing 300–800 kr: https://vaktmestertilbud.no/vaktmester-snomaking-pris
- Enkelt brøyting ofte 800–1 500 kr, sesong for samme område 4 000–8 000 kr, privat innkjørsel 50 m² sesong 2 500–4 000 kr (21.09.2025): https://xn--snbrytingsentralen-h4bc.no/pris-snobroyting
- Firma med maskin, innkjørsel: 600–1 500 kr per gang, sesong 8 000–20 000 kr (MineAnbud, 2026): https://mineanbud.no/tips/snomaking
- Hagehjelp (dekker blant annet Holmestrand): engangsjobb fra 1 990 kr for de første 15 m: https://hagehjelp.no/tjenester/snomaking

Hagehjelp ligger i øvre sjikt og er geografisk relevant, men er én aktørs prisliste, ikke et snitt. Bygdevaktmester hadde langt lavere priser (430 kr per gang for normal oppkjørsel, prisliste 01.09.2026) og er ikke lagt inn som typisk nivå: https://www.bygdevaktmester.no/prisliste

## Anbudsskjema og senere bakende

Skjemaet på forsiden (`#anbud`) lagrer en strukturert forespørsel i `localStorage` (nøkkel `vaktmester-larsen-requests-v1`) og kan sende den som SMS eller kopiere teksten. Filopplasting av bilder er bevisst ikke med; kunden kan krysse av for at bilder sendes på MMS eller e-post.

For å koble på en gratis innsending senere, sett adresse i `js/config.js`:

```js
window.VL_CONFIG = {
  phone: "+4790906500",
  email: "",
  endpoint: "https://formspree.io/f/DIN_KODE"
};
```

`js/shared.js` sender da JSON med `POST` (Content-Type: application/json). Formspree-fri plan, en egen liten serverless-funksjon eller et skjemaendepunkt som tar imot JSON kan brukes. Tom `endpoint` betyr ingen nett-innsending. Forespørsler som er lagret i samme nettleser vises i innboksen på `oppdrag.html`.

## AI-sekretær

Chatten på forsiden er en regelbasert FAQ (nøkkelord, ingen API-kall). Den svarer på tjenester, veiledende priser, område, åpningstider og hvordan man ber om tilbud, og kan fylle inn anbudsskjemaet.

Mulig oppgradering senere, uten at det er satt på nå:

- Gratis modeller via OpenRouter, med en liten mellomtjener som holder nøkkelen unna nettleseren
- Lokal modell via tussies llama.cpp (port 18434) som bakende for chatten
- Systemprompt med de samme faktaene som FAQ-en bruker i dag (priser merkes fortsatt som veiledende)

Ikke koble en betalt Grok- eller annen sky-API til denne chatten uten uttrykkelig ja, fordi hvert kall kan bli fakturert.

## Offentlige registerkilder (bedriften)

- https://virksomhet.brreg.no/nb/oppslag/enheter/933572056
- https://www.proff.no/selskap/vaktmester-larsen/hof/bygningstjenester/IFFTOT407TQ
- Åpningstider ifølge Google, via https://vaktmesterplassen.no/selskaper/hof/vaktmester-larsen-933572056
- Telefon 90 90 65 00 er oppgitt av den som ba om siden, og finnes også hos Fastbase. Gule Sider er ubekreftet og uten nummer.

## Ukjent / bevisst utelatt

Lasses egne priser, e-post, logo, arbeidsbilder, sertifikater, omtaler og nøyaktig dekningsområde utenom Hof/Holmestrand.
