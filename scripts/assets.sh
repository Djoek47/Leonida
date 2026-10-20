#!/bin/bash
# Convert raw Rockstar press kit into web-sized assets for leonida-live/public/media
set -e
R=/home/claude/raw
O=/home/claude/leonida-live/public/media
mkdir -p $O/{art,places,people,ultimate,vintage,video,brand}
slug(){ echo "$1" | tr 'A-Z ' 'a-z_' ; }

# Wallpapers: landscape + phone variants
for d in $R/GTAVI_Artwork_Wallpapers/*/ $R/GTAVI_Artwork_Wallpapers/Postcards/*/; do
  n=$(basename "$d"); [ "$n" = Postcards ] && continue
  s=$(slug "$n")
  for v in landscape phone portrait; do
    f=$(ls "$d" | grep -i "_${v}.jpg" | head -1 || true)
    [ -n "$f" ] && convert "$d/$f" -resize 2000x2000\> -quality 78 "$O/art/${s}_${v}.webp"
  done
done
# Screenshots
for d in "$R"/GTAVI_Screenshots/Places/*/; do s=$(slug "$(basename "$d")"); i=1
  for f in "$d"*.jpg; do convert "$f" -resize 1600x\> -quality 76 "$O/places/${s}_$i.webp"; i=$((i+1)); done; done
for d in "$R"/GTAVI_Screenshots/People/*/; do s=$(slug "$(basename "$d")"); i=1
  for f in "$d"*.jpg; do convert "$f" -resize 1600x\> -quality 76 "$O/people/${s}_$i.webp"; i=$((i+1)); done; done
for f in $R/GTAVI_Ultimate_Edition_Benefits/*.jpg; do b=$(basename "$f" .jpg); convert "$f" -resize 1400x\> -quality 76 "$O/ultimate/$(slug "${b#ULTIMATE_EDITION_}").webp"; done
for f in $R/GTAVI_Vintage_Vice_City_Pack/*.jpg; do b=$(basename "$f" .jpg); convert "$f" -resize 1400x\> -quality 76 "$O/vintage/$(slug "${b#VINTAGE_VICE_CITY_}").webp"; done
convert $R/logo.avif $O/brand/gta6-logo.png
# Videos -> 720p H.264 + poster
for f in $R/GTAVI_Videos/*.mp4; do s=$(slug "$(basename "$f" .mp4)")
  ffmpeg -y -loglevel error -i "$f" -vf "scale=-2:720" -c:v libx264 -crf 27 -preset veryfast -an -movflags +faststart "$O/video/$s.mp4"
  ffmpeg -y -loglevel error -ss 2 -i "$f" -frames:v 1 -vf "scale=1280:-2" -q:v 4 "$O/video/$s.jpg"
done
du -sh $O/*
