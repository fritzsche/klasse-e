#!/bin/bash
# Dieses Skript konvertiert eine oder mehrere SVG-Dateien in TikZ-Code-Dateien.
# Es verwendet svg2tikz mit der --codeonly-Option, um nur den reinen Code zu erhalten.
#
# Beispielaufruf: ./svg_convert.sh bild1.svg grafik2.svg

# Überprüfe, ob Argumente übergeben wurden
if [ "$#" -eq 0 ]; then
  echo "Fehler: Keine SVG-Dateien als Argumente übergeben."
  echo "Verwendung: $0 <datei1.svg> [<datei2.svg> ...]"
  exit 1
fi

# Schleife über alle übergebenen Argumente
for file in "$@"; do
  # Überprüfe, ob die Datei existiert und ob es eine SVG-Datei ist
  if [ ! -f "$file" ]; then
    echo "Warnung: Datei '$file' existiert nicht. Überspringe..."
    continue
  fi

  if [[ "$file" != *.svg ]]; then
    echo "Warnung: '$file' ist keine SVG-Datei. Überspringe..."
    continue
  fi

  # Erstelle den Ausgabedateinamen, indem die Endung .svg durch .tex ersetzt wird
  output_file="${file%.svg}.tex"

  echo "Konvertiere '$file' nach '$output_file'..."

  # Führe die Konvertierung mit svg2tikz durch
  svg2tikz --codeonly --output="$output_file" "$file"
  
  if [ $? -ne 0 ]; then
    echo "Fehler: svg2tikz konnte '$file' nicht konvertieren."
  else
    echo "Erfolgreich konvertiert."
  fi
done

echo "Fertig."
