# -*- coding: utf-8 -*-
from __future__ import print_function
import io
import os
import sys
import time
import requests

# ── Configuración ──────────────────────────────────────────────────────────────
ZEPTO_TOKEN   = os.getenv("ZEPTO_SEND_MAIL_TOKEN", "Zoho-enczapikey wSsVR61zqxb1D6x8mWX/IutsnwxdVVP/Fk4p2FTw4if0Sq2Q98czxUHODQGiH6MWFTJgFGQSrbMvmU0D22BaiI8qyVtVWyiF9mqRe1U4J3x17qnvhDzMXm1ckRWLKoMLzw5okmBhEM8j+g==")
FROM_ADDRESS  = os.getenv("ZEPTO_FROM_ADDRESS", "noreply@truequedelibros.com")
FROM_NAME     = "Trueque de Libros"
FRONTEND_URL  = "https://truequedelibros.com"
ZEPTO_API_URL = "https://api.zeptomail.com/v1.1/email"
EMAILS_FILE   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "usuarios.txt")
DELAY_SECONDS = 0.3
# ───────────────────────────────────────────────────────────────────────────────


def build_html_email(title, greeting, body_html, button_text, button_url):
    button = (
        '<div style="text-align:center;margin:32px 0">'
        '<a href="' + button_url + '" style="background-color:#4B0081;color:#ffffff;text-decoration:none;'
        'padding:14px 28px;border-radius:6px;font-weight:bold;font-size:15px;display:inline-block">'
        + button_text + '</a></div>'
        '<p style="text-align:center;font-size:12px;color:#9a9a9a;margin:0 0 4px">'
        'Si el bot&#243;n no abre, copi&#225; este enlace en tu navegador:</p>'
        '<p style="text-align:center;font-size:12px;margin:0;word-break:break-all">'
        '<a href="' + button_url + '" style="color:#4B0081">' + button_url + '</a></p>'
    )

    return (
        u'<!DOCTYPE html>\n'
        u'<html lang="es">\n'
        u'<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>\n'
        u'<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:Arial,sans-serif">\n'
        u'  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:32px 16px">\n'
        u'    <tr><td align="center">\n'
        u'      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">\n'
        u'        <tr><td style="background-color:#4B0081;border-radius:8px 8px 0 0;padding:24px 32px;text-align:center">\n'
        u'          <span style="color:#ffffff;font-size:22px;font-weight:bold">Trueque de Libros</span>\n'
        u'        </td></tr>\n'
        u'        <tr><td style="background-color:#ffffff;padding:32px;border-radius:0 0 8px 8px">\n'
        u'          <h2 style="color:#2d2d2d;margin:0 0 16px">' + title + u'</h2>\n'
        u'          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0 0 12px">' + greeting + u'</p>\n'
        u'          <p style="color:#4a4a4a;font-size:15px;line-height:1.6;margin:0">' + body_html + u'</p>\n'
        u'          ' + button + u'\n'
        u'          <hr style="border:none;border-top:1px solid #e8e0d8;margin:24px 0">\n'
        u'          <p style="color:#9a9a9a;font-size:12px;margin:0;text-align:center">\n'
        u'            Este mensaje fue enviado por Trueque de Libros.<br>\n'
        u'            Si no esperabas este email, pod&#233;s ignorarlo.\n'
        u'          </p>\n'
        u'        </td></tr>\n'
        u'      </table>\n'
        u'    </td></tr>\n'
        u'  </table>\n'
        u'</body>\n'
        u'</html>'
    )


def build_first_book_email():
    return build_html_email(
        title=u"¡Cargá tu primer libro!",
        greeting=u"Hola,",
        body_html=(
            u"Notamos que todavía no publicaste ningún libro en <strong>Trueque de Libros</strong>.<br><br>"
            u"Sin libros cargados, las posibilidades de hacer un match y concretar un trueque son muy bajas. "
            u"¡Solo te lleva un minuto publicar tu primer libro!<br><br>"
            u"Compartí esos libros que ya leíste y no sabés qué hacer con ellos. Alguien los está buscando — "
            u"y vos podrías llevarte uno que querés leer."
        ),
        button_text=u"Agregar mi primer libro",
        button_url=FRONTEND_URL,
    )


def send_email(to_address, html_body):
    headers = {
        "Content-Type": "application/json",
        "Authorization": ZEPTO_TOKEN,
    }
    payload = {
        "from": {"address": FROM_ADDRESS, "name": FROM_NAME},
        "to": [{"email_address": {"address": to_address, "name": to_address}}],
        "subject": u"¡Agregá tu primer libro y empezá a hacer trueques!",
        "htmlbody": html_body,
    }
    try:
        r = requests.post(ZEPTO_API_URL, json=payload, headers=headers, timeout=15)
        r.raise_for_status()
        return True
    except requests.RequestException as e:
        print("  ERROR: " + str(e))
        return False


def load_emails(path):
    seen = set()
    result = []
    with io.open(path, encoding="utf-8") as f:
        for line in f:
            email = line.strip().lower()
            if email and email not in seen:
                seen.add(email)
                result.append(email)
    return result


def main():
    if not ZEPTO_TOKEN:
        print("ERROR: falta la variable de entorno ZEPTO_SEND_MAIL_TOKEN")
        return

    emails = load_emails(EMAILS_FILE)
    html   = build_first_book_email()
    total  = len(emails)

    print("Enviando a " + str(total) + " emails...\n")
    sent = failed = 0

    for i, email in enumerate(emails, 1):
        sys.stdout.write("[" + str(i) + "/" + str(total) + "] " + email + " ... ")
        sys.stdout.flush()
        if send_email(email, html):
            print("OK")
            sent += 1
        else:
            failed += 1
        time.sleep(DELAY_SECONDS)

    print("\nFinalizado — enviados: " + str(sent) + ", fallidos: " + str(failed))


if __name__ == "__main__":
    main()
