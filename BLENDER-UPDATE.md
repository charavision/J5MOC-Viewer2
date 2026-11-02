# Viewer 2 – Blender-Übernahme

Quelle: `J5MOC-DrehtellerWideUtility.blend`, Stand 27. Oktober 2026, Pose bei Bild 750. Das Original wurde nicht verändert. Eine vollständige Quellkopie sowie eine eigenständige, für glTF vorbereitete Blender-Datei liegen lokal im Ordner `Viewer2-Update`.

- Modellgeometrie in Weltkoordinaten ausgewertet und als statisches, Draco-komprimiertes GLB exportiert.
- Gleiche PBR-Materialien zusammengefasst; individuelle Farben, Metall, Rauheit, transparente und leuchtende Teile bleiben getrennt.
- Sechs Studioleuchten mit Position, Richtung, Farbe und Leistung in `studio.json`; Flächenlichter werden als RectAreaLights und als Reflexionsumgebung aufgebaut.
- Blender AgX wird auch im Viewer verwendet. Belichtung ist für den Web-Renderer angepasst.
- Exakte Geometriegrenzen für Kamera und Bodenkontakt.

Die prozeduralen Mecabricks-Shader werden durch glTF-PBR-Materialien angenähert. Cycles-Bevel, Subsurface-Scattering, indirekte Beleuchtung und prozedurale Mikrostrukturen sind nicht identisch übertragen. Der Web-Viewer ist kein Cycles-Render.

## Sofort zurück

Oben rechts führt **Vorherige Version** ohne Umbau zur unveränderten bisherigen Ansicht. Auch `Untitled.glb`, HDR und bisherige Texturen bleiben erhalten.

- `Viewer-previous.html`: bisherige normale Ansicht
- `renderer-previous.html`: bisherige vollständige Regleransicht
- Lokaler Sicherungsbranch: `backup/viewer2-before-blender-2026-11-02`
- Vorheriger Stand: `ea4f761b25fcd6522e73fd2ae01a8f8f96b3ac52`

Die neue Regleransicht unterstützt Belichtung, Lichtstärke, Hintergrund und automatische Drehung sowie einen XML-Export dieser Einstellungen. Alte, globale Materialregler bleiben in der vorherigen Regleransicht erreichbar; die neue Ansicht bewahrt die exportierten Materialunterschiede.

Für eine vollständige Rücknahme auf der Hauptadresse kann der Blender-Update-Commit mit Git Revert zurückgenommen werden. Die Sicherung bleibt unabhängig davon im lokalen Sicherungsbranch erhalten.
