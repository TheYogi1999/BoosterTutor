# Trading post and receipt without scrolling — v0.101

The main shop and encounter receipt fit the viewport. Continue stays in the
upper-right heading. Their DOM IDs and original handlers remain intact, including
controller Continue, actual prices, pack selection/confirmation and counter costs.

Large shop windows show Vey, three single cards, two booster offers and three run
counters together. Compact windows (width ≤1100px or height ≤820px) use Cards,
Packs and Counters departments. All offers within a department remain visible
without scrolling. Short landscape displays retain Vey on the left; portrait
displays use a compact greeting panel. A new inventory starts on Cards. Purchases
and returning from a bought booster retain the selected department. Tabs expose
their selected state and controlled panel, with Left/Right/Home/End keyboard
navigation and normal controller activation.

Purchase feedback temporarily appears with Vey instead of covering the offers.
His original greeting returns afterward. Route changes dismiss old notices so
they cannot cover receipt totals; only the in-context status announces purchases.

Shop cards retain proportional artwork, names, generic costs, power/toughness and
colored keywords. Full adapted effects open through Details or the card image,
including Enter/Space on the image. Inspection does not spend coins or purchase
anything. The window uses the current physical card, current rules and keywords;
Escape/Back or its close button returns to the shop. Long rules can scroll inside
the detail window without moving the shop. Compact views reduce duplicate type
labels and size thumbnails to reserve room for facts and both actions.

The receipt displays the payout, wallet and level changes, combat facts and all
six grouped bounty rows together. The existing grouping of further distinct
enemy types into Other foes preserves the complete total. Narrow windows use a
compact payout strip above the ledger; wide and short landscape windows place
the panels side by side. Number typography adapts to available width for large
wallets and levels. No reward arithmetic, count-up timing, finish sound, card
collection animation or background card rain changes. Floating combat damage
text is hidden after leaving combat so it cannot cover the receipt.

Validation uses ten viewports: 1600×900, 1280×800, 1366×768, 1024×768,
2560×1080, 820×1180, 390×844, 320×568, 844×390 and 667×375. Checks measure
actual client/scroll sizes and component/keyword boundaries, rather than merely
hiding scrollbars. Browser flows inspect full effects without spending, purchase
single cards and packs, return to the same department, apply a counter, navigate
tabs by keyboard and continue real six-foe receipts through the controller.
Large wallet and level values, long greetings, and cards with several keywords
are included. Existing shop-pack variety, nested-window, campaign/Endless receipt
and general scene-flow checks are also retained.
