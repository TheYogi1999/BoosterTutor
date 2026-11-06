# Booster Tutor

**Booster Tutor** ist ein browserbasiertes, inoffizielles Mana-Roguelike-Demo mit Booster-Draft, Kartenkampf und Boss-Run.

## Spielen

Das Projekt ist eine statische Website ohne Build-Schritt. Die Dateien können direkt über GitHub Pages ausgeliefert werden. Der Workflow unter `.github/workflows/pages.yml` veröffentlicht Änderungen am `main`-Branch.

Für lokale Vorschau einen einfachen statischen Webserver im Projektordner starten, zum Beispiel:

```bash
python3 -m http.server 8000
```

Anschließend `http://localhost:8000` im Browser öffnen. Beim Start lädt das Spiel eine kleine Auswahl echter Karten aus der Scryfall API. Die Auswahl wird im Browser 12 Stunden zwischengespeichert; ohne Verbindung nutzt das Spiel ein paar eigens geschriebene Demo-Karten.

## Spielsystem

- Wähle zwei Karten aus dem Start-Booster. Jede kommt dreimal in dein Startdeck.
- Spiele einmal pro Zug ein Land, um dein maximales Mana zu erhöhen.
- Kreaturen greifen automatisch ab dem Zug nach ihrem Ausspielen an; Haste, Lifelink und Deathtouch haben eine einfache Umsetzung.
- Einige Kartentexte werden über Muster für Schaden, Heilung, Kartenziehen, Kreaturenstärkung, Kontern und Spielsteine umgesetzt. Nicht erkannte Zaubereffekte erhalten eine einfache, manaabhängige Schadenswirkung. Das ist eine Roguelike-Interpretation und keine vollständige Magic-Regelsimulation.
- Nach jedem besiegten Gegner wählst du eine Karte als Beute. Der vierte Kampf ist der Boss.

## Kartendaten, Bilder und Fan-Projekt-Hinweis

Kartendaten und Bilder werden zur Laufzeit von Scryfall geladen; sie sind nicht im Repository enthalten. Scryfall ist eine unabhängige Kartendatenbank, nicht die offizielle Wizards of the Coast Website. Die Kartenbilder und Kartentexte gehören ihren jeweiligen Rechteinhabern. Das Projekt ist nicht von Wizards of the Coast unterstützt oder gesponsert.

Wizards' Fan-Content-Richtlinie enthält Beschränkungen für Wizards-IP in anderen Spielen, auch wenn sie kostenlos sind. Vor einer öffentlichen Verbreitung sollte diese Richtlinie geprüft werden; diese Demo beansprucht keine Erlaubnis von Wizards.

## GitHub Pages

1. In den Repository-Einstellungen unter **Pages** als Build-Quelle **GitHub Actions** auswählen, falls GitHub das nicht schon automatisch getan hat.
2. Änderungen nach `main` übertragen oder den Workflow manuell mit **Actions → Deploy GitHub Pages → Run workflow** starten.
3. Die veröffentlichte URL wird im Workflow-Lauf unter **Deploy** angezeigt.
