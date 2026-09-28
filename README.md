# Laurel Acupuncture

Static website for Laurel Fruehling, MAScHM — acupuncture and Chinese herbal medicine in New York City.

## Pages

- `index.html` — landing page
- `about.html` — About Laurel
- `booking.html` — locations and how to book (Pacific College clinic and Yinova)

## Running locally

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Photos

- `images/laurel-portrait.webp` is Laurel's portrait, used in the home hero, the About page header, and (cropped to landscape) the wide photo slots on the home and About pages. To swap in a different photo for the wide slots, add the file and update the `crop-top` image `src` in `index.html` and `about.html`.
- `images/yinova-flyer.jpg` is the Yinova announcement shown on the booking page.
