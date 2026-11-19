# Cloudflare ו-DMARC: הגדרות מחוץ ל-ZIP
19.11.2026. הוראות בלבד, לא בוצע שינוי בחשבון או ב-DNS.

## 1. הפניית HTTP ל-HTTPS

1. להיכנס ל-Cloudflare ולבחור `sagi-simhi.dev`.
2. `SSL/TLS` > `Overview`: לוודא שמצב ההצפנה אינו `Off`. אין צורך לשנות מצב הצפנה אחר במסגרת ההוראות האלה.
3. `SSL/TLS` > `Edge Certificates` > `Always Use HTTPS` > `On`.
4. לבדוק את ארבע הכתובות המופיעות בטבלה למטה. כולן אמורות להגיע ל-`https://sagi-simhi.dev/`.

ההגדרה חלה גם על תתי-הדומיין שמטופלים דרך Cloudflare. לפני הפעלה, לוודא שאין תת-דומיין פעיל שצריך להישאר HTTP בלבד. אין להפעיל HSTS כולל תתי-דומיין כחלק מהתיקון הזה.

### מה נמצא בבדיקה

| כתובת | curl, בלי שדרוג אוטומטי של הדפדפן | דפדפן Chrome |
|---|---|---|
| `http://sagi-simhi.dev/` | 200, נשאר HTTP | הגיע ל-HTTPS הראשי, 200 |
| `https://sagi-simhi.dev/` | 200 | 200 |
| `http://www.sagi-simhi.dev/` | Cloudflare 522, ללא Location | הגיע ל-HTTPS הראשי, 200 |
| `https://www.sagi-simhi.dev/` | 301 אל HTTPS הראשי, ואז 200 | הגיע ל-HTTPS הראשי, 200 |

כלומר הפניית HTTPS מ-www כבר עובדת. דפדפן שמעלה חיבור ל-HTTPS יכול להסתיר את שני פערי ה-HTTP. לא צריך ליצור כלל www נוסף כעת. הפעלת Always Use HTTPS אמורה להפנות את שני מסלולי HTTP לפני הפנייה לשרת המקור; יש לאמת זאת אחרי ההפעלה.

לבדיקה מ-Windows cmd, להריץ כל פקודה בנפרד ולבדוק `HTTP` ו-`Location`:

```bat
curl.exe -I http://sagi-simhi.dev/
curl.exe -I https://sagi-simhi.dev/
curl.exe -I http://www.sagi-simhi.dev/
curl.exe -I https://www.sagi-simhi.dev/
```

אם אחרי ההפעלה `http://www` עדיין מחזיר 522 במקום הפניה, לבדוק ב-`DNS` > `Records` שהרשומה `www` קיימת ומוגדרת `Proxied` (ענן כתום). לא לשנות כתובת יעד או למחוק רשומה שעובדת בלי לבדוק את ההגדרה הקיימת. אם הדומיין הראשי עובד וה-www ב-HTTPS עדיין מפנה, אין צורך לנחש כתובת שרת חדשה.

## 2. רשומת DMARC בסיסית, ללא אכיפה בשלב ראשון

בבדיקת DNS הנוכחית לא הוחזרה רשומת TXT ב-`_dmarc.sagi-simhi.dev`. נמצאה SPF קיימת שמכילה את Cloudflare ואת Zoho ומסתיימת ב-`~all`.

1. Cloudflare > לבחור `sagi-simhi.dev` > `DNS` > `Records`.
2. לחפש `_dmarc`. אם כבר נוספה רשומה מאז הבדיקה, לא ליצור עותק שני; לבדוק את הקיימת.
3. `Add record`.
4. למלא:
   - `Type`: `TXT`
   - `Name`: `_dmarc`
   - `Content`: `v=DMARC1; p=none; rua=mailto:contact@sagi-simhi.dev`
   - `TTL`: `Auto`
5. `Save`.

ברירת המחדל המוצעת היא קבלת דוחות מצרפיים לכתובת הקיימת `contact@sagi-simhi.dev`. הדוחות עשויים להיות קובצי XML מצורפים ולהגיע בתדירות יומית. לא נפתח שירות ניטור נוסף ולא נרשם ספק חיצוני. אם לא רוצים את הדוחות בכתובת הזו, לבחור תיבת דוחות קיימת ונגישה ולהחליף רק את כתובת `rua` לפני השמירה. בלי `rua` לא יגיעו דוחות בדרך זו.

חשוב: `p=none` אינו מבקש לחסום או להסגיר דואר מזויף. זו נקודת התחלה לבדיקת אימות הדואר בלי לסכן דואר תקין. אין לעבור ל-`quarantine` או `reject` עד שמוודאים ששליחה מ-Zoho ומשאר השולחים החוקיים עוברת DMARC עם יישור SPF או DKIM לדומיין ב-From. SPF שמסתיים ב-`~all` אינו לבדו הוכחה ש-DMARC יעבור. לבדוק גם את הגדרת DKIM ב-Zoho; לא אומת כאן selector ולכן אין רשומת DKIM מוכנה להעתקה.

לא לשנות MX, לא להוסיף רשומת SPF שנייה ולא להחליף אוטומטית `~all` ב-`-all` במסגרת ההוספה הזו.

לבדיקת פרסום הרשומה ב-Windows cmd:

```bat
nslookup -type=TXT _dmarc.sagi-simhi.dev
```

לאחר הפרסום, לשלוח מייל רגיל מהדומיין דרך Zoho לתיבה בשליטתך ולבדוק בכותרות את `Authentication-Results`, ובפרט `dmarc=pass` והדומיין שנבדק. מעבר לאכיפה הוא שלב נפרד אחרי בדיקת דוחות ושולחים.

## מקורות רשמיים

- Always Use HTTPS: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/
- יצירת רשומות DNS: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/
- DMARC ב-Zoho, לרבות התחלה ב-p=none ויישור SPF/DKIM: https://www.zoho.com/mail/help/adminconsole/dmarc-policy.html

בדיקות DNS ששימשו כאן: https://dns.google/resolve?name=sagi-simhi.dev&type=TXT ו-https://dns.google/resolve?name=_dmarc.sagi-simhi.dev&type=TXT . תוצאות DNS ומצב האתר עשויים להשתנות אחרי מועד הבדיקה.
