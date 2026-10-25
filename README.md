# kommunens-portfolj
Exempel på kommunal initiativportfölj för mobil användning

## Registrera initiativ

Öppna `index.html` i en modern webbläsare, eller servera mappen med exempelvis
`python3 -m http.server 8000` och öppna `http://localhost:8000`.

Fyll i initiativ, verksamhet, tjänsteägare, mål, nuläge och förväntad nytta.
Välj status och kategori. Budget, datum, risk, KPI och beskrivning finns under
**Kompletterande uppgifter (valfritt)**. Efter sparandet visas initiativet överst,
sökning och filter återställs och portföljens summeringar uppdateras.

Data sparas i `localStorage` under den befintliga nyckeln `kommunInitiativData`.
Äldre initiativ finns kvar utan migrering. De befintliga fälten `avdelning` och
`ansvarigPerson` används för verksamhet respektive tjänsteägare. `mal`, `nulage`
och `forvantadNytta` är nya textfält. Äldre initiativ visar effektmålet som mål
om ett separat mål saknas.

Detta är en lokal första version utan inloggning eller gemensam databas.
Uppgifterna följer inte med till andra webbläsare, enheter eller webbadresser.
Rensning av webbläsardata tar bort dem. CSV-exporten ger en kopia, men appen
har ännu ingen importfunktion. Exempelinitiativ visas vid första besöket.
Vid lagringsfel behåller formuläret inmatningen och visar ett felmeddelande.
Oläsliga sparade data skrivs inte över automatiskt.

## Tester

```sh
npm install
npx playwright install chromium
npm test
```

Testerna kör appen på en tillfällig lokal HTTP-server i Chromium och kontrollerar
registrering, obligatoriska fält, omladdning, äldre data, sökning, filter,
summeringar, CSV, säker textvisning, borttagning, rensning, lagringsfel,
datumvalidering och mobilbredd.
