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

## Replacing placeholder photos

Two placeholder images are used until real photos are added:

- Save a portrait photo as `images/laurel-portrait.jpg` (4:5 works best). It is used in the home hero and the About page header; `images/laurel-portrait.svg` shows only until the JPG exists.
- Save a second photo as `images/laurel-practice.jpg` (landscape, 16:10 works best). It is the "Laurel in practice" image on the home and About pages; `images/laurel-practice.svg` shows only until the JPG exists.

`images/yinova-flyer.jpg` is the Yinova announcement shown on the booking page.
