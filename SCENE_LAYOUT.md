# Responsive menus and travel stops — v0.99

Outside combat, the game uses the visible viewport in screen pixels. It no longer
shrinks a 1600×900 page into a letterbox. The title, loading screen, draft,
trading post, camp, encounter receipt and run results fill their available area.
Combat keeps its v0.98 adaptive camera and six-slot formations.

The title keeps its large name, five menu entries and three real Booster Tutor
prints. Narrow portrait displays place the cards above the title; short landscape
displays retain a compact side-by-side composition. Existing introduction,
hover flips, audio settings and reduced-motion behavior remain available.

Draft confirmation, shop Continue, receipt Continue, run restart/Endless and
prepared-deck Begin Run sit at the upper right of their view. Their original DOM
nodes move, preserving event handlers, state and controller-specific button hints.
Draft choices use seven, four or two columns. The header and footer remain outside
the card scroller; card descriptions stay complete and art keeps its printed
aspect ratio. Only art lifts on hover. Sealed packs scale their actual dimensions
to the available space so opening-flight coordinates stay consistent. Resizing
during a flight finishes the reveal safely and restores selection/confirmation.
The opening glow cannot create a horizontal scrollbar or block input.

Vey remains on the left on wide displays and becomes a compact greeting panel on
narrow ones. Shop rows size to their content; long effects cannot overlap booster
offers or counters. Continue stays in the sticky shop heading while offers scroll.
Camp choices, the four-node path and receipt panels stack as needed. Their internal
scroll areas start at the top on a new visit, without scrolling the document.
Camp retains its existing direct token choice; no extra confirmation is required.

Collection, options, audio, controller, precon and counter-selection windows fit
the physical viewport. Full rules and long lists scroll within them. Collection
entries retain both card art and complete in-game rules; small screens use one
entry per row. Precon boxes, deck lists and nested card details remain reachable
in portrait and short landscape layouts. Viewport resize/scroll events also update
the layout when mobile browser chrome or the virtual keyboard changes the visible
area. Scene transitions, reward count-up timing and music/effects remain intact.

Validation covers 1600×900, 1366×768, 1024×768, 2560×1080, 820×1180,
390×844, 320×568 and 844×390. Browser tests perform real last-card picks and
confirmation, card/pack/counter purchases, camp/deck inspection, encounter
receipt/reward progression, precon starts, nested Elixir/card details, controller
settings and repeated menu/combat camera changes. Additional checks cover real
pack flights and resize cancellation, the title introduction, unchanged combat
controls, immediate/controller receipt Continue and campaign/Endless routing.
