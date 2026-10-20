# ORIGIN art direction

## The idea

A loud typographic roastery with a quiet respect for the product. Oxblood, copper and toasted cream replace the usual coffee-shop beige. A large outlined headline contrasts with a tactile printed pouch. The same product world continues into beans and a ceramic cup.

Bebas Neue supplies compact, confident display type. DM Sans handles tiny coordinates, control labels and the recipe ticket. Both are local SIL Open Font License fonts.

## Story map

| Chapter | Spatial event | Useful action |
| --- | --- | --- |
| 01 / Ground | A printed pouch with gussets, seals and folds sits in a warm studio world | Enter the story |
| 02 / Source | The pouch moves left while beans reveal the source material | Choose an origin and see the artwork change |
| 03 / Roast | Beans separate around the package and show roast colour | Adjust the roast profile |
| 04 / Cup | The package recedes while a ceramic cup and saucer take the foreground | Continue to the brew calculator |

The pouch uses a subdivided front surface with bulge, taper, small edge creases, back, side gussets and crimped seams. A generated printed texture gives each origin its own colour and information. Each bean consists of two irregularly positioned lobes and a visible central groove. The cup has inner and outer walls, a handle, coffee surface, crema edge and saucer.

## Motion architecture

Native scroll determines a 0 to 3 progress value. A deterministic pose map moves the pouch, beans and cup through the same world. Time adds only slight idle motion. Pointer movement is small and disabled for reduced motion. Reverse scrolling does not trigger irreversible timelines.

The mobile composition places copy above a smaller scene. In reduced motion the object angle and main desktop object position are fixed, with no pointer parallax or idle motion. Text stays in a consistent column. The story still communicates the sequence through normal page scrolling.

## Working route

Origins update both canvas label and DOM facts. Roast controls update actual bean materials and recipe temperature. The recipe uses dose multiplied by the chosen ratio. AeroPress recipes account for brewer capacity by splitting large quantities into equal batches. Invalid input cannot be exported as if valid. The download contains the selected origin, roast, method, dose, ratio, water, temperature, time and instructions.

## Budget and verification

One renderer, capped DPR 1.6, no post-processing, no shadow-map passes, and modest procedural geometry. Rendering is skipped outside the story and in hidden documents. No unmeasured FPS claim is made.

Review initial composition, every chapter and transition midpoint, origin label updates, roast at both extremes, scene reversal, 390 px mobile layout, native range keyboard controls, dose validation, all brewing methods, export contents, reduced motion and WebGL fallback.
