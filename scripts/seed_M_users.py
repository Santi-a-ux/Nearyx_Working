"""
Script de seed: crea usuarios de prueba repartidos por Medellín, con
ocupaciones variadas y cotidianas, para probar el filtrado del mapa por IA
y el grafo de conexiones.

Usa las MISMAS rutas públicas que usa la app real (registro, perfil,
promoción a experto, perfil de experto) — así los embeddings, coordenadas
y validaciones quedan exactamente igual que si los hubieras creado a mano
desde la interfaz.

Uso (desde la raíz del proyecto, con todo el stack corriendo):
    python scripts/seed_medellin_users.py

Requiere: pip install httpx
"""
import httpx

BASE_URL = "http://localhost:8000"  # gateway

# (email, password, nombre, bio, barrio, lat, lng, es_experto, especialidad, categoria, tarifa, años_exp)
USERS = [
    ("carlos.plomero@test.com", "TestPass123!", "Carlos Restrepo",
     "Plomero con más de 10 años de experiencia en reparaciones domésticas.",
     "Belén", 6.2308, -75.6011,
     True, "Plomero, reparación de tuberías y fugas de agua", "Hogar y reparaciones", 35000, 10),

    ("maria.amacasa@test.com", "TestPass123!", "María Gómez",
     "Ama de casa, disponible para cuidado del hogar y organización.",
     "Laureles", 6.2447, -75.5916,
     True, "Ama de casa, limpieza y organización del hogar", "Hogar y reparaciones", 25000, 5),

    ("juan.tecnico@test.com", "TestPass123!", "Juan Pablo Vélez",
     "Técnico en computadores, reparo y formateo equipos a domicilio.",
     "El Poblado", 6.2088, -75.5679,
     True, "Técnico en computadores, reparación de hardware y software", "Tecnología", 40000, 6),

    ("ana.electricista@test.com", "TestPass123!", "Ana Lucía Ramírez",
     "Electricista certificada, instalaciones residenciales y comerciales.",
     "Robledo", 6.2733, -75.5928,
     True, "Electricista, instalaciones eléctricas residenciales", "Hogar y reparaciones", 45000, 8),

    ("pedro.jardinero@test.com", "TestPass123!", "Pedro Antonio Uribe",
     "Jardinero, mantenimiento de zonas verdes y poda de árboles.",
     "Envigado", 6.1745, -75.5910,
     True, "Jardinero, mantenimiento de jardines y poda", "Hogar y reparaciones", 30000, 4),

    ("laura.enfermera@test.com", "TestPass123!", "Laura Jiménez",
     "Enfermera profesional, cuidado de adultos mayores a domicilio.",
     "Sabaneta", 6.1508, -75.6164,
     True, "Enfermera, cuidado de pacientes y adultos mayores", "Salud", 50000, 7),

    ("diego.chef@test.com", "TestPass123!", "Diego Fernando Salazar",
     "Chef a domicilio, especializado en comida colombiana e italiana.",
     "Itagüí", 6.1719, -75.6122,
     True, "Chef a domicilio, comida colombiana e italiana", "Cocina y repostería", 60000, 9),

    ("sofia.disenadora@test.com", "TestPass123!", "Sofía Marín",
     "Diseñadora gráfica freelance, branding y redes sociales.",
     "La América", 6.2565, -75.6039,
     True, "Diseñadora gráfica, branding y redes sociales", "Diseño y creatividad", 45000, 5),

    ("andres.mensajero@test.com", "TestPass123!", "Andrés Felipe Cano",
     "Domiciliario y mensajería express en toda el área metropolitana.",
     "Bello", 6.3373, -75.5581,
     True, "Domiciliario, mensajería y entregas express", "Transporte y logística", 20000, 3),

    ("valentina.estudiante@test.com", "TestPass123!", "Valentina Ospina",
     "Estudiante de ingeniería, buscando servicios para el hogar.",
     "Cabecera San Antonio", 6.1953, -75.5736,
     False, None, None, None, None),

    ("santiago.usuario@test.com", "TestPass123!", "Santiago Zapata",
     "Vivo en Medellín, uso la app para encontrar expertos de confianza.",
     "Manrique", 6.2801, -75.5546,
     False, None, None, None, None),
]


def register_and_setup(client: httpx.Client, user):
    (email, password, name, bio, barrio, lat, lng,
     is_expert, specialty, category, rate, years) = user

    role = "tutor" if is_expert else "student"
    reg = client.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": password, "role": role,
    })
    if reg.status_code == 400 and "already registered" in reg.text:
        print(f"  ya existía: {email}, iniciando sesión...")
        login = client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        login.raise_for_status()
        token = login.json()["access_token"]
    elif reg.status_code >= 400:
        print(f"  ERROR registrando {email}: {reg.status_code} {reg.text}")
        return
    else:
        token = reg.json()["access_token"]

    headers = {"Authorization": f"Bearer {token}"}

    # Perfil público (nombre, bio, ubicación)
    profile_res = client.post(f"{BASE_URL}/users/profiles", json={
        "display_name": name, "bio": bio, "location_name": f"{barrio}, Medellín",
    }, headers=headers)
    if profile_res.status_code >= 400 and "already" not in profile_res.text.lower():
        client.put(f"{BASE_URL}/users/profiles/me", json={
            "display_name": name, "bio": bio, "location_name": f"{barrio}, Medellín",
        }, headers=headers)

    if is_expert:
        client.put(f"{BASE_URL}/auth/promote-to-tutor", headers=headers)
        tutor_res = client.post(f"{BASE_URL}/tutors/profiles", json={
            "specialties": [specialty],
            "categories": [category],
            "hourly_rate": rate,
            "years_experience": years,
            "lat": lat,
            "lng": lng,
            "is_available": True,
        }, headers=headers)
        if tutor_res.status_code >= 400:
            print(f"  aviso perfil experto {email}: {tutor_res.status_code} {tutor_res.text[:150]}")

    print(f"  OK: {email} ({barrio}){' - experto' if is_expert else ''}")


def main():
    with httpx.Client(timeout=30.0) as client:
        print(f"Creando {len(USERS)} usuarios de prueba en Medellín...\n")
        for user in USERS:
            register_and_setup(client, user)
    print("\nListo. Password para todos: TestPass123!")


if __name__ == "__main__":
    main()