import csv
import os
import re
import smtplib
import sys
from email.mime.text import MIMEText
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

MAIL_FROM = "contacto@truequedelibros.com"
SMTP_HOST = "smtp.zoho.com"
SMTP_PORT = 587
FRONTEND_URL = "https://truequedelibros.com"
PREMIUM_THRESHOLD = 8
CSV_FILE = Path(__file__).parent.parent / "usuarios_mendoza.csv"

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")


def extract_email(contacto):
    match = EMAIL_RE.search(contacto)
    return match.group(0) if match else None


def build_body(nombre, cantidad_libros):
    premium = (
        "Si cargás al menos 8 libros en tu perfil, el plan premium se habilita\n"
        "de forma automática. ¡Ya casi llegás!\n\n"
    ) if cantidad_libros > PREMIUM_THRESHOLD else ""

    return (
        f"Hola {nombre},\n\n"
        "Te escribimos porque sos parte de la comunidad de intercambio de libros\n"
        "en Mendoza y creemos que Trueque de Libros puede interesarte.\n\n"
        "Trueque de Libros es una plataforma donde podés publicar los libros que\n"
        "ya leíste y encontrar tus próximas lecturas a través de intercambios\n"
        "directos con otras personas de tu zona.\n\n"
        f"{premium}"
        f"Sumate en: {FRONTEND_URL}\n\n"
        "Saludos,\n"
        "El equipo de Trueque de Libros\n"
    )


def main():
    dry_run = "--dry-run" in sys.argv

    mail_password = 'z_ftJ2dz'
    if not dry_run and not mail_password:
        print("Error: MAIL_PASSWORD no está definido en el entorno ni en .env")
        sys.exit(1)

    if not CSV_FILE.exists():
        print(f"Error: no se encontró {CSV_FILE}")
        sys.exit(1)

    with open(CSV_FILE, encoding="utf-8") as f:
        rows = [r for r in csv.DictReader(f) if r["nombre"]]

    sent = skipped = errors = 0

    smtp = None
    if not dry_run:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        smtp.starttls()
        smtp.login(MAIL_FROM, mail_password)

    try:
        for row in rows:
            nombre = row["nombre"].strip()
            cantidad_libros = int(row.get("cantidad_libros") or 0)
            email = extract_email(row["contacto"])

            if not email:
                print(f"[SKIP] {nombre} — sin email")
                skipped += 1
                continue

            subject = "Te invitamos a Trueque de Libros 📚"
            body = build_body(nombre, cantidad_libros)

            if dry_run:
                tag = " [PREMIUM]" if cantidad_libros > PREMIUM_THRESHOLD else ""
                print(f"[DRY]  {email} ({nombre}, {cantidad_libros} libros{tag})")
                sent += 1
                continue

            try:
                msg = MIMEText(body, "plain", "utf-8")
                msg["From"] = MAIL_FROM
                msg["To"] = email
                msg["Subject"] = subject
                smtp.sendmail(MAIL_FROM, email, msg.as_string())
                print(f"[OK]   {email} ({nombre}, {cantidad_libros} libros)")
                sent += 1
            except Exception as e:
                print(f"[ERROR] {email} ({nombre}): {e}")
                errors += 1
    finally:
        if smtp:
            smtp.quit()

    label = "a enviar" if dry_run else "enviados"
    print(f"\nResumen: {sent} {label}, {skipped} omitidos, {errors} errores")


if __name__ == "__main__":
    main()
