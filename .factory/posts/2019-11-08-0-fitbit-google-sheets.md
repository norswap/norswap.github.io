---
layout: post
title: Wrangling Fitbit's and Google Sheets' API
---

In my post about [my cut phase] I showcased [the spreadsheet] I used to track my
calorie deficit, my weight, as well as the predicted weight based on the
deficit.

[my cut phase]: /weight-training-4/
[the spreadsheet]: https://docs.google.com/spreadsheets/d/1kwGo8YRcEdPJotxaWLlc72pz6YvdU2ymKw_gFa_dKkY/edit?usp=sharing

The big downside of the spreadsheet was having to manually input the value, and
this is something I wanted to automate using Fitbit's and Google Sheets'
respective APIs.

This is now done, and I've published it as an [Observable notebook] (for
posterity's sake, the code is also [archived here]).

[Observable notebook]: https://observablehq.com/@norswap/fitbit/2
[archived here]: fitbit_google_sheets.tgz

The notebook has some explanations (and full setup instructions) but I'll give a
few details.

Basically you specify the ID of a new spreadsheet in the notebook, as well as a
time period of interest, and then you can hit a button that will populate the
spreadsheet with calories in / calories out / weight / caloric surplus or
deficit / smoothed weight.

I had initially planned for this project to do much more — basically recreate
[the whole spreadsheet][the spreadsheet], but I realized this was overkill and
would add a lot of complication.

One particularly thorny issue is that the app I use to track my weight sometimes
desyncs from Fitbit, and it doesn't seem possible to sync older measurement
after the fact. These can be added to the sheet manually, but then any logic
that re-creates the sheet must be able to identify & preserve these manually
entered entries!

Ultimately, this is enough. I can just hit the button and then copy/paste the
entries to the real spreadsheet instead of entering them manually.

Of course, I spent way more time on building this thing than I would have
manually copying values in the foreseeable future. But I learned things! Namely:

- The Google Sheet and Fitbit API
- Implementing a simple OAuth 2.0 flow
- Using Observable notebooks
- Some finer points of Javascript (e.g. how promises relate to "thenables")

I found Observable to be particularly interesting. Of course I could have
trivially built the same thing as a local webpage, but Observable makes it
easier to share with people and easier to access from other devices (including
phones). It's also nice to be able to do good looking literate programming.

I didn't really need the spreadsheet-like reactive/update-on-change quality of
Observable, but that's certainly interesting too.
