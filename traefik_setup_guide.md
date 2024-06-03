## Prerequisites

Deze handleiding helpt je bij het opzetten van een basisconfiguratie van Traefik met Docker en Traefik als reverse proxy met automatische HTTPS-omleiding en basisauthenticatie. Deze opstelling omvat het inschakelen van het Traefik-dashboard en het gebruik van Let's Encrypt voor automatisch SSL-certificaatbeheer.

- Docker en Docker Compose: Zorg ervoor dat Docker en Docker Compose geïnstalleerd zijn op je server.

- Domeinnaam: Zorg ervoor dat je een domeinnaam hebt die verwijst naar het openbare IP-adres van je server.

- Mapstructuur: Maak de benodigde mappen en bestanden aan in je projectmap.

```bash
mkdir -p ~/traefik/letsencrypt
touch ~/traefik/traefik.yml
touch ~/traefik/letsencrypt/acme.json
touch ~/traefik/passwd
```

## Stap 1: Maak `traefik.yml` Configuratie

Maak of wijzig het `traefik.yml` bestand om de Traefik-configuratie in te stellen zonder persoonlijke details:

```yaml
log:
  level: INFO

api:
  dashboard: true

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false

entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: "your-email@example.com" # Vervang dit met jouw email
      storage: "/acme.json"
      httpChallenge:
        entryPoint: web
```

## Stap 2: Configureer Docker Compose

Maak een `docker-compose.yml` bestand met de volgende inhoud, verwijder specifieke domeinverwijzingen:

```yaml
version: "3"

services:
  traefik-proxy:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./traefik.yml:/etc/traefik/traefik.yml
      - ./letsencrypt/acme.json:/acme.json
      - /var/run/docker.sock:/var/run/docker.sock
      - ./passwd:/etc/traefik/passwd
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host('your-domain.com')" # Vervang dit met jouw domein
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.usersfile=/etc/traefik/passwd"
      - "traefik.http.routers.dashboard.tls=true"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.entrypoints=websecure"

networks:
  default:
    external: true
    name: traefik

http:
  routers:
    redirect-router:
      rule: "Path('/')"
      middlewares:
        - redirect-middleware
      entryPoints:
        - web
```

## Stap 3: Stel Basis Authenticatie in

Genereer een gebruiker en wachtwoord voor de basis authenticatie met `htpasswd`. Deze installatie maakt een gebruiker met de naam `admin`, waarmee je kunt inloggen in het dashboard. Je kunt `htpasswd` installeren via `apache2-utils`, of een online generator gebruiken (minder secure).

```bash
htpasswd -c ./passwd admin
```

## Stap 4: Configureer SSL met Let's Encrypt

Zorg dat het `acme.json` bestand de juiste permissies heeft om de opslag van SSL-certificaten te beveiligen.

```bash
chmod 600 ./letsencrypt/acme.json
```

## Stap 5: Start Je Docker Container

Navigeer naar je projectdirectory waar het `docker-compose.yml` bestand zich bevindt en start je container:

```bash
docker-compose up -d
```

## Stap 6: Toegang tot Traefik Dashboard

Navigeer naar `https://your-domain.com/dashboard/` om het Traefik-dashboard te bekijken.

Zorg ervoor dat je `your-email@example.com` en `your-domain.com` vervangt met je daadwerkelijke e-mail en domein. Deze setup bevat nu geen specifieke persoonlijke gegevens, alleen algemene placeholders geschikt voor elke setup.
