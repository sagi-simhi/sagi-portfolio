# Sagi Simhi - Personal Portfolio

[![Live site](https://img.shields.io/badge/live-sagi--simhi.dev-0aa38f?style=flat)](https://sagi-simhi.dev)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)

A personal portfolio website showcasing my background, skills, and projects as an Economics and Computer Science student interested in data analytics, financial markets, and technology.

🌐 **Live Website:** [sagi-simhi.dev](https://sagi-simhi.dev)

## Overview

This website serves as my professional online presence, highlighting my academic background, professional experience, technical skills, and ongoing projects.

The goal is to present my analytical mindset, problem-solving approach, and interest in the intersection of economics, finance, and technology.

## Design & Experience

The website features a clean, editorial interface with a frosted-glass navigation bar.

Key features include:

- Responsive layout for desktop and mobile devices
- Glass navigation bar with a sliding active-section indicator and edge refraction (Chromium; plain blur fallback elsewhere)
- Scroll-triggered reveal animations
- Dark showcase chapter for selected work
- Self-hosted variable fonts, no external font requests
- Accessible design with reduced-motion support
- Working contact form with spam protection

## Built With

- **HTML5** - Page structure and content
- **CSS3** - Styling, responsive layout, animations, and visual effects
- **JavaScript** - Scroll reveals, navigation behavior, and progressive enhancement (IntersectionObserver, SVG filters)
- **Self-hosted fonts** - Bricolage Grotesque, Instrument Serif, and JetBrains Mono (SIL Open Font License); body text uses the Inter / system font stack
- **FormSubmit** - Contact form delivery to my inbox (honeypot + CAPTCHA)

The project uses vanilla HTML, CSS, and JavaScript, without external frameworks or build tools.

## Featured Work

- **ThesisGap** - A rules-based tool that works backwards from a company's valuation to the break point where the price is fair. Prototype; the interactive example is currently in private review.
- **CashLens** - An agent that checks whether a company's reported profit is backed by cash, and says "can't determine" when the evidence is thin. Concept stage.

## Project Structure

```text
sagi-portfolio/
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── fonts/          # self-hosted variable fonts (.woff2)
│   ├── icons/          # tool icons (.svg)
│   └── ...             # photos and site images
├── FONT-LICENSES.txt
├── ICON-LICENSES.txt
├── OCTICONS-LICENSE.txt
└── README.md
```

## Run Locally

You can run the website locally without installing dependencies.

**Option 1 - VS Code Live Server**

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Install the Live Server extension if you haven't already.
4. Right-click `index.html` and select **Open with Live Server**.

**Option 2 - Python**

If Python is installed, run the following command from the project directory:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Customization

The website is built with a simple structure, making it easy to modify:

- Update personal information and sections in `index.html`.
- Customize colors, layout, and visual effects in `style.css`.
- Modify interactions and functionality in `script.js`.

## Project Status

The website is actively maintained and updated as I develop new skills, complete projects, and progress academically and professionally.

## Contact

[![Website](https://img.shields.io/badge/Website-0aa38f?style=flat&logo=googlechrome&logoColor=white)](https://sagi-simhi.dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/sagi-simhi)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/sagi-simhi)
[![Email](https://img.shields.io/badge/Email-444c56?style=flat&logo=minutemailer&logoColor=white)](mailto:contact@sagi-simhi.dev)

---

Designed and built by Sagi Simhi.