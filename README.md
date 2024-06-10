# Handleiding voor Filtrr e-mailclassifier

## Overzicht

Deze applicatie classificeert e-mails via een API, met een handige website frontend en een Outlook-add-in. Zonder te hertrainen categorseert het e-mails in drie soorten: IRRELEVANT, DATA-ENGINEER en BI-ENGINEER. Dit hulpmiddel is ontworpen om projectmanagers te helpen bij het beheren van hun inbox.

## Belangrijkste kenmerken

- **E-mailclassificatie**: E-mails automatisch classificeren in vooraf gedefinieerde categorieën via de frontend, add-in of API.
- **Gebruikersfeedback op classificaties**: Gebruikers kunnen feedback geven op de nauwkeurigheid van classificaties, wat helpt om het model te verbeteren.
- **Gedetailleerd dashboard voor classificatie**: Bekijk statistieken en trends in classificatie.
- **Gebruikersbeheer**: Beheermogelijkheden voor admins inclusief toevoegen, verwijderen en bijwerken van gebruikersprofielen.
- **Toegang tot database**: Beheerders kunnen alle database-invoeren benaderen, nuttig voor audits en naleving.
- **Beheer van AI-model**: Het AI-model voor classificatie opnieuw trainen en de prestaties vergelijken over modellen.

## Systeemvereisten

- **Hardwarevereisten**: Minimaal 2 cores en 4GB RAM.
- **Serveraanbevelingen**: Servers van Hetzner vanwege hun balans tussen kosten en prestaties.
- **Softwarevereisten**: Docker moet geïnstalleerd zijn en een solide internetverbinding is noodzakelijk.
- **Netwerkconfiguratie**: Server ingesteld met Traefik; gedetailleerde stappen zijn te vinden in de `traefik_setup_guide`.

## Installatie-instructies

### Instructies voor het instellen van het `.env`-bestand

Het `.env`-bestand bevat belangrijke configuratiegegevens die nodig zijn voor de werking en security van de applicatie. Hieronder vindt u een stapsgewijze handleiding voor het opzetten en aanpassen van dit bestand.

#### Voorbeeldinhoud van `.env`

```
MONGO_USERNAME=root
MONGO_PASSWORD=mongo
HOSTNAME=voer_hier_uw_hostname_in
MLFLOW_HOSTNAME=voer_hier_uw_mlflow_hostname_in
ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
JWT_SECRET_KEY=classified
```

#### Configuratiebeschrijving

- **MONGO_USERNAME**: De gebruikersnaam voor MongoDB. Standaard ingesteld op `root`.
- **MONGO_PASSWORD**: Het wachtwoord voor MongoDB. Standaard ingesteld op `mongo`.
- **HOSTNAME**: De hostname van uw server waar de applicatie draait. Vervang `voer_hier_uw_hostname_in` met de daadwerkelijke hostname.
- **MLFLOW_HOSTNAME**: De hostname voor MLflow server. Vervang `voer_hier_uw_mlflow_hostname_in` met de daadwerkelijke MLflow hostname.
- **ADMIN_USERNAME**: De gebruikersnaam voor de admin login. Standaard ingesteld op `admin`.
- **ADMIN_PASSWORD**: Het wachtwoord voor de admin login. Standaard ingesteld op `password`.
- **JWT_SECRET_KEY**: Een geheime sleutel gebruikt voor het ondertekenen van JWTs. Houd deze sleutel geheim en veilig.

### Eenvoudige implementatie

1. **Toegang tot Containerregister**:
   ```
   docker login --username bazaaer --password [aanvraag via e-mail]
   ```
   Voor toegangstoken, email lander@vanderstighelen.net.
2. **Omgevingsconfiguratie**:
   Plaats het Docker compose-bestand en `.env`-bestand in dezelfde map. Wijzig het `.env`-bestand naar uw omgeving.
3. **De applicatie starten**:
   ```
   docker compose pull
   docker compose up -d
   ```

### Handmatig images bouwen

1. **Repository instellen**:
   Kloon de [repository](https://github.com/VinsiGit/Filtrr) waar de Dockerfiles zich bevinden:
   ```
   git clone https://github.com/VinsiGit/Filtrr.git
   ```
2. **Docker builds**:
   Bouw de Docker-images met:
   ```
   docker build frontend/. -t filtrr-frontend
   docker build backend/. -t filtrr-backend
   docker build addin/. -t filtrr-addin
   ```
3. **Deployment**
   Zet de images op een eigen Containerregister, of deploy ze gewoon lokaal. Vergeet dan niet de docker-compose aan te passen om de lokale images te gebruiken.

## Aan de slag

Na installatie, toegang tot de applicatie op [uw-applicatie-url]. Standaard admin-gegevens zijn:

- **Gebruikersnaam**: admin
- **Wachtwoord**: password

Wijzig deze in het `.env`-bestand indien nodig voor de beveiliging.

## Gedetailleerde instructies

Bezoek de helppagina op de website voor uitgebreide gebruikershandleidingen en het gebruik van functies OF de helppagina staat ook online op: [Helppage](https://s144272.devops-ap.be/help) Username: admin, Password: admin. Dit omvat:

- **outlook**: Documentatie over het installeren en de werking van de addin.
- **site**: Documentatie over de werking en de functionaliteit van de site.
- **model**: Een gedetailleerd schema over de werking van het model.
- **api**: Gedetailleerde documentatie over alle endpoinds.

## Veiligheidsmaatregelen

Voor een optimale beveiliging van uw applicatie, worden volgende veigheidsmaatregelen genomen:

- Gebruik van admin en user accounts.
- API authenticatie via JWT tokens.
- Gebruik van HTTPS: Zorg ervoor dat de server HTTPS gebruikt voor veilige communicatie. Dit kan worden ingesteld met een SSL-certificaat via Traefik (zie traefik setup guide).
- Firewall Instellingen: Stel firewall-regels in om alleen het noodzakelijke netwerkverkeer toe te staan naar uw server.
- E-mail Gegevensbeveiliging: Alle e-mails worden gehasht opgeslagen in de database, waardoor er geen leesbare gegevens beschikbaar zijn, zelfs niet voor interne gebruikers. Dit minimaliseert het risico op datalekken.

## Probleemoplossing

- **Loginproblemen**: Zorg ervoor dat het `.env`-bestand de juiste admin-gegevens bevat.
- **Dockerfouten**: Controleer of alle Docker-images correct zijn gebouwd en de containers draaien. Bekijk Docker logs voor specifieke foutmeldingen.
- **Classificatienauwkeurigheid**: Als de nauwkeurigheid laag is, overweeg het model opnieuw te trainen via de website frontend.

## Back-up Procedure van de database

### Stap 1: Identificatie van het Docker Volume

Controleer eerst of het volume `filtrr-db` bestaat en actief is. Gebruik het volgende commando om alle actieve volumes te tonen:

```bash
docker volume ls
```

Zoek in de output naar `filtrr-db` om te bevestigen dat het volume bestaat.

### Stap 2: Back-up van het Volume

Om een back-up te maken van het `filtrr-db` volume, voer je het volgende commando uit. Dit commando start een tijdelijke Docker container, koppelt het `filtrr-db` volume en de huidige werkdirectory, en creëert een tarball (`.tar.gz` bestand) van de volume-inhoud:

```bash
docker run --rm -v filtrr-db:/data -v $(pwd):/backup ubuntu tar czvf /backup/filtrr-db_backup.tar.gz /data
```

Dit commando voert de volgende acties uit:

- Start een tijdelijke container met het `ubuntu` image.
- Koppelt het `filtrr-db` volume op `/data` binnen de container.
- Koppelt de huidige directory (`$(pwd)`) op `/backup` binnen de container.
- Gebruikt het `tar` commando om de gegevens van het volume te comprimeren naar een `.tar.gz` bestand, opgeslagen in de huidige directory.

### Stap 3: Verifiëren van de Back-up

Na het uitvoeren van de back-up, controleer het `.tar.gz` bestand in de huidige directory om te verzekeren dat de back-up succesvol is. Dit kan door de inhoud van het bestand te bekijken met:

```bash
tar -tzvf /backup/filtrr-db_backup.tar.gz
```

Zorg ervoor dat alle verwachte bestanden in de output worden getoond.

### Herstel van de backup

Voer het volgende commando uit om de database te herstellen:

```bash
docker run --rm -v filtrr-db:/data -v $(pwd):/backup ubuntu tar xzvf /backup/filtrr-db_backup.tar.gz -C /
```

## Ondersteuning en contactinformatie

Voor ondersteuning, functieverzoeken of bugrapporten, neem contact op:

- **Email**: lander@vanderstighelen.net

## Juridische en Licentie-informatie

Deze sectie biedt de noodzakelijke juridische mededelingen en licentie-informatie voor het gebruik van deze applicatie.

### Applicatielicentie

Deze applicatie wordt aangeboden onder een eigendomsrechtelijke licentie. Alle rechten, eigendomsrechten en belangen in en op de software en de documentatie zijn en blijven het exclusieve eigendom van Filtrr.

Het bedrijf Infofarm krijgt een niet-exclusieve, niet-overdraagbare, beperkte licentie om de software te gebruiken en verder te ontwikkelen voor interne bedrijfsdoeleinden.

### Auteursrecht

Auteursrecht © 2024 Filtrr. Alle rechten voorbehouden.

Ongeoorloofd kopiëren van dit bestand, via welk medium dan ook, is strikt verboden. Eigendomsrechtelijk en vertrouwelijk.

### Bibliotheken en Afhankelijkheden van Derden

Deze applicatie maakt gebruik van verschillende bibliotheken en afhankelijkheden van derden, die hieronder worden vermeld samen met hun licentie-informatie:

- **Flask**: Gelicenseerd onder de BSD-3-Clause Licentie - [Flask Licentie](https://flask.palletsprojects.com/en/1.1.x/license/)
- **Werkzeug**: Gelicenseerd onder de BSD-3-Clause Licentie - [Werkzeug Licentie](https://pypi.org/project/Werkzeug/)
- **hashlib**: Onderdeel van Python's standaardbibliotheek, impliciet gedekt onder Python's licentie, die de PSF Licentieovereenkomst is - [Python Licentie](https://docs.python.org/3/license.html)
- **MongoDB**: Gebruikt verschillende licenties voor verschillende componenten; meestal is de server gedekt onder de Server Side Public License (SSPL) - [MongoDB Licentie](https://www.mongodb.com/licensing/server-side-public-license)
- **MLflow**: Gelicenseerd onder de Apache Licentie 2.0 - [MLflow Licentie](https://github.com/mlflow/mlflow/blob/master/LICENSE.txt)
- **Optuna**: Gelicenseerd onder de MIT Licentie - [Optuna Licentie](https://github.com/optuna/optuna/blob/master/LICENSE)
- **NLTK**: Gelicenseerd onder de Apache Licentie 2.0 - [NLTK Licentie](https://github.com/nltk/nltk/blob/develop/LICENSE.txt)
- **Scikit-Learn (sklearn)**: Gelicenseerd onder de BSD-3-Clause Licentie - [Scikit-Learn Licentie](https://github.com/scikit-learn/scikit-learn/blob/main/COPYING)
- **Prefect**: Gelicenseerd onder de Apache Licentie 2.0 - [Prefect Licentie](https://github.com/PrefectHQ/prefect/blob/master/LICENSE)
