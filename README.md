# Booster Tutor

**Booster Tutor** ist ein browserbasiertes, inoffizielles Mana-Roguelike-Demo mit Booster-Draft, Kartenkampf und Boss-Run.

## Spielen

Das Projekt ist eine statische Website ohne Build-Schritt. Die Dateien können über GitHub Pages ausgeliefert werden. Der Workflow unter `.github/workflows/pages.yml` ist dafür vorbereitet und lässt sich manuell starten.

Für lokale Vorschau einen einfachen statischen Webserver im Projektordner starten, zum Beispiel:

```bash
python3 -m http.server 8000
```

Anschließend `http://localhost:8000` im Browser öffnen. Beim Start lädt das Spiel eine kleine Auswahl echter Karten aus der Scryfall API. Die Auswahl wird im Browser 12 Stunden zwischengespeichert; ohne Verbindung nutzt das Spiel ein paar eigens geschriebene Demo-Karten.

## Spielsystem

- Starte mit drei Boostern zu je fünf Karten. Wähle eine Karte aus jedem Booster; jede Auswahl kommt viermal in dein Deck.
- Zehn farblich passende Basisländer liegen ebenfalls im Deck. Ziehe ein Land auf dein Spielfeld und spiele pro Zug höchstens eines. Länder erzeugen Mana und werden beim Ausspielen von Zaubern automatisch passend zu deren farbigen und generischen Manakosten getappt.
- Kreaturen kommen per Drag-and-drop auf dein Feld und greifen ab dem Zug nach ihrem Ausspielen an; Haste, Lifelink und Deathtouch haben eine einfache Umsetzung.
- Deine Lebenspunkte starten vor jedem Kampf wieder bei 30.
- Du kannst Karten aus der Hand ziehen und auf dein Feld oder das Feld des Gegners legen. Klicken spielt sie ebenfalls aus.
- Einige Kartentexte werden über Muster für Schaden, Heilung, Kartenziehen, Kreaturenstärkung, Kontern und Spielsteine umgesetzt. Nicht erkannte Zaubereffekte erhalten eine einfache, manaabhängige Schadenswirkung. Das ist eine Roguelike-Interpretation und keine vollständige Magic-Regelsimulation.
- Nach jedem besiegten Gegner wählst du eine Karte als Beute. Der vierte Kampf ist der Boss.

## Kartendaten, Bilder und Fan-Projekt-Hinweis

Kartendaten und Bilder werden zur Laufzeit von Scryfall geladen; sie sind nicht im Repository enthalten. Scryfall ist eine unabhängige Kartendatenbank, nicht die offizielle Wizards of the Coast Website. Die Kartenbilder und Kartentexte gehören ihren jeweiligen Rechteinhabern. Das Projekt ist nicht von Wizards of the Coast unterstützt oder gesponsert.

Wizards' [Fan-Content-Richtlinie](https://company.wizards.com/en/legal/fancontentpolicy) enthält Beschränkungen für Wizards-IP in anderen Spielen, auch wenn sie kostenlos sind. Vor einer öffentlichen Verbreitung sollte diese Richtlinie geprüft werden; diese Demo beansprucht keine Erlaubnis von Wizards.

## GitHub Pages

1. In den Repository-Einstellungen unter **Pages** als Build-Quelle **GitHub Actions** auswählen, falls GitHub das nicht schon automatisch getan hat.
2. Änderungen nach `main` übertragen oder den Workflow manuell mit **Actions → Deploy GitHub Pages → Run workflow** starten.
3. Die veröffentlichte URL wird im Workflow-Lauf unter **Deploy** angezeigt.
