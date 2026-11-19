# Verification, 19 November 2026

## Source preservation

The permanent Drive ZIP was downloaded before editing. Its index.html, style.css, script.js, FONT-LICENSES.txt and ICON-LICENSES.txt were byte-identical to the live site's corresponding responses at the time of comparison. OCTICONS-LICENSE.txt existed on the live site but was absent from the ZIP; the exact live file was added. The package does not replace unrelated local project files or change GitHub.

The Drive file was not starred at inspection time, despite being described as the starred ZIP. Its exact permanent file ID, filename and owner matched the intended deliverable. Star status and sharing were preserved rather than changed.

## Automated checks on the updated local package

- Chrome desktop viewport: 1440 x 1000. Mobile viewport: 390 x 1000.
- axe-core 4.10.3: zero reported violations on index.html, accessibility.html and privacy.html at both sizes, after strengthening the decorative numbering too.
- The home page still has incomplete automated contrast results: 14 nodes at desktop, 15 at mobile. These include the glass navigation, timeline text near pseudo-elements, and partially obscured/placeholder form text. Automated inability to resolve a background is not a pass or proof of failure. No blanket accessibility conformance is claimed.
- Both new legal pages had zero incomplete axe checks at the tested sizes.
- No horizontal overflow at 1440px, 390px or 320px on any of the three pages. The 320px check is a narrow-width reflow check, not a complete browser-zoom or assistive-technology assessment.
- Exactly one main landmark on each page.
- First Tab exposes Skip to content. Enter places keyboard focus on main-content at both desktop and mobile widths.
- All local HTML href/src references resolve to files in the package. No broken content images at the checked 320px view.
- No contact-form submissions were made during package verification. The form action, method, required fields and anti-spam fields were preserved. External submission/CAPTCHA accessibility is not certified.

## Contrast calculations

WCAG relative-luminance formula, computed from the actual chosen solid colors:

| Foreground | Background | Ratio |
|---|---|---|
| #067568 | #f6f3ec | 5.050:1 |
| #5f656a | #f6f3ec | 5.329:1 |
| #5f656a | #ffffff | 5.905:1 |
| #5fe0cd | #101c2b | 10.654:1 |
| #788087 field border | #fbfaf7 field fill | 3.842:1 |
| #067568 focus outline | #ffffff | 5.597:1 |

The light turquoise used on dark project backgrounds was preserved rather than globally replaced with the darker light-background accent.

## Visual review

Inspected actual screenshots of the updated contact form on desktop and mobile, including keyboard focus, the accessibility page on desktop, the privacy page top and bottom on mobile, and the visible skip link on mobile. The legal pages use the existing palette and locally bundled display font, with limited reading width, underlined links, clear headings and responsive spacing. The privacy notice is visible before the submit button, not hidden in a tooltip or checkbox.

## What this does not verify

This is not a professional accessibility audit or legal opinion. NVDA/VoiceOver, all browsers, complete 200%/400% zoom testing, provider safeguards, countries of processing, every third-party asset right and the external form journey remain outside this package's completed checks. A zero-violation automated scan is not full compliance.

The 12-month retention practice is manual and must actually be followed after adoption. No mailbox deletion automation, marketing list, account setting or DNS record was changed.

## External state

The HTTP/HTTPS and www results, current DNS findings and source URLs are in SETUP-CLOUDFLARE-DMARC-HE.md. Those settings were not changed. The updated local pages are not deployed and their new live URLs will not work until the owner uploads the files.
