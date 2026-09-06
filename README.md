# DRIVE AGENT — Tap the selected category to close

The main category rail keeps the menu open when switching categories. Pressing the already selected white category closes the menu and returns focus to the header menu button. It does not rebuild the sheet or reset its filters, dates, chat state or scroll position. This applies to all categories, including Settings. Reopen the menu with the header button.

## Minimal product chat

This release replaces the tool-heavy chat with a small, centered black-and-white conversation window. It contains a chat list, messages, a composer and close button. The canvas is white, bubbles are black, and corners match the menu’s slight rounding.

Tap an Accounting product’s name or image to open that product’s conversation. All 43 products use their original SKU as identity, so switching report dates, filters, labels or zoom does not mix conversations. Category totals do not open chats. The floating three-dot button always opens Main Chat.

The conversation list contains Main Chat plus products the visitor has opened, with previews, drafts, recent activity ordering and unread replies. Messages and drafts are saved in this browser’s local storage and shared between this release’s homepage and demo. No messages leave the device. Replies are explicitly local demo acknowledgements; live AI is not connected. If browser storage is unavailable, conversations work for the current visit.

Accounting date entry, scrolling totals, compact menus, PPC tables, the ENTER DEMO homepage and the existing Chrome iOS viewport handling remain included. Earlier release folders and GitHub Pages sites are unchanged.

Open `demo.html?workspace=accounting`. Publish committed files with `npm run publish`.

Validation: state-model tests, offline chat/home/workspace integration tests, and browser checks at mobile and short viewport sizes. Use `DOLCE_QA_JSDOM=/path/to/jsdom node --max-old-space-size=4096 --test tests/*.integration.mjs` for the large offline DOM suite.
