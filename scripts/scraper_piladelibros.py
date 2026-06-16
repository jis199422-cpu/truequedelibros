import csv
import time
import sys
import requests

BASE_API = "https://server.piladelibros.com/api"
TS = 1780948233661
OUTPUT_FILE = "usuarios_mendoza.csv"
DELAY = 0.3


def fetch_books_page(session, page):
    url = f"{BASE_API}/libros"
    params = {
        "numPagina": page,
        "milisFechaHasta": TS,
        "pais": "Argentina",
        "region": "Mendoza",
    }
    try:
        r = session.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"  Error en página {page}: {e}")
        return None


def fetch_user_profile(session, user_id):
    url = f"{BASE_API}/usuarios/{user_id}/perfil"
    try:
        r = session.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        return {
            "nombre": data.get("nombre", ""),
            "contacto": data.get("contacto", ""),
        }
    except Exception as e:
        print(f"  Error perfil usuario {user_id}: {e}")
        return {"nombre": "", "contacto": ""}


def fetch_user_book_count(session, user_id):
    url = f"{BASE_API}/usuarios/{user_id}/libros"
    try:
        r = session.get(url, timeout=10)
        r.raise_for_status()
        data = r.json()
        return len(data) if isinstance(data, list) else 0
    except Exception as e:
        print(f"  Error libros usuario {user_id}: {e}")
        return 0


def save_csv(results, path):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["nombre", "contacto", "cantidad_libros"])
        writer.writeheader()
        writer.writerows(results)


def main():
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0"

    seen_users = set()
    results = []
    page = 1

    print("Iniciando scraping de piladelibros.com — Argentina, Mendoza\n")

    while True:
        books = fetch_books_page(session, page)

        if books is None:
            print("Error de red, abortando.")
            break
        if not books:
            print(f"Página {page} vacía — fin de resultados.")
            break

        new_ids = {b["idUsuario"] for b in books if "idUsuario" in b} - seen_users
        seen_users |= new_ids

        print(f"Página {page} | +{len(new_ids)} usuarios nuevos | Total: {len(seen_users)}")

        for user_id in new_ids:
            profile = fetch_user_profile(session, user_id)
            time.sleep(DELAY)
            count = fetch_user_book_count(session, user_id)
            time.sleep(DELAY)
            results.append({
                "nombre": profile["nombre"],
                "contacto": profile["contacto"],
                "cantidad_libros": count,
            })

        page += 1

    if results:
        save_csv(results, OUTPUT_FILE)
        print(f"\nListo. {len(results)} usuarios guardados en {OUTPUT_FILE}")
    else:
        print("\nNo se encontraron usuarios.")
        sys.exit(1)


if __name__ == "__main__":
    main()
