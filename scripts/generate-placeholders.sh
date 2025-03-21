#!/bin/bash

# Create the games directory if it doesn't exist
mkdir -p public/games

# Generate placeholder images using base64 encoded minimal SVGs
for game in "adopt-me" "blox-fruits" "phantom-forces" "tower-defense-simulator"; do
  echo "<svg width='768' height='432' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='#f0f0f0'/><text x='50%' y='50%' font-family='Arial' font-size='24' fill='#666' text-anchor='middle'>${game}</text></svg>" > "public/games/${game}.svg"
  
  # Convert SVG to PNG if imagemagick is available
  if command -v convert >/dev/null 2>&1; then
    convert "public/games/${game}.svg" "public/games/${game}.png"
    rm "public/games/${game}.svg"
  fi
done 