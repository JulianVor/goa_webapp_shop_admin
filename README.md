# goa_webapp_shop_admin

Das Medusa.js-Backend (v2) für den Grumbrechtstraßen-Open-Air-Fanshop: Produkte,
Varianten, Preise, Lagerbestand, Warenkorb/Checkout-Logik und Bestellungen - inklusive
des fertigen **Medusa Admin Dashboards**, über das Produkte tatsächlich gepflegt werden
(nicht in [goa_webapp_shop](https://github.com/JulianVor/goa_webapp_shop), das nur das
öffentliche Storefront ist und ausschließlich über die Store-API mit diesem Projekt
spricht).

Technisch ein normales, unverändertes `@medusajs/medusa` v2-Projekt (auf Basis des
offiziellen `medusa-starter-default`) - kein Custom-Code außer Konfiguration/Deployment.

## Lokale Entwicklung

Voraussetzung: Postgres und Redis laufen lokal.

```bash
cp .env.template .env
# DATABASE_URL in .env auf die eigene lokale Postgres-DB setzen, z.B.:
#   postgres://goa:goa@localhost:5432/medusa_shop
yarn install
npx medusa db:migrate
npx medusa user -e admin@heimfeld.life -p <passwort>   # einmalig: eigenen Admin-Account anlegen
yarn dev
```

Admin Dashboard: `http://localhost:9000/app`

### Schnellstart mit Demo-Daten

`yarn seed` legt eine Beispiel-Region, einen Sales Channel, einen Publishable API Key
und ein paar Demo-Produkte an (Medusas eigenes Standard-Seed-Skript,
`src/scripts/seed.ts`) - praktisch zum Ausprobieren, die Demo-Produkte danach im Admin
Dashboard löschen/durch echte ersetzen.

### Für den Storefront (goa_webapp_shop) einrichten, ohne Demo-Daten

1. Admin Dashboard → Settings → Regions: Region "Deutschland" (EUR, Länder DE/AT) anlegen.
2. Settings → Sales Channels: den Default Sales Channel verwenden oder einen eigenen anlegen.
3. Settings → API Key Management: einen Publishable API Key anlegen, mit dem Sales
   Channel verknüpfen - dieser Key geht als `MEDUSA_PUBLISHABLE_API_KEY` in
   goa_webapp_shop.
4. Settings → Locations: ein Lager anlegen, mit dem Sales Channel und einem
   Fulfillment-Provider verknüpfen.
5. Produkte anlegen → jede Variante braucht einen Lagerbestand am angelegten Lager,
   sonst schlägt "In den Warenkorb" mit einem 400er fehl ("not associated with any
   stock location").

## Deployment

`docker-compose.yml` geht von **zwei unterschiedlichen** Docker-Netzwerken aus - Caddys
Netzwerk und das Netzwerk, auf dem goa_webapps Postgres-Container sitzt, sind auf dem
Server i.d.R. NICHT dasselbe (siehe `.env.example` für die Discovery-Befehle und
`goa_webapp_shop`s README für Details - `PROXY_NETWORK_NAME`/`DB_NETWORK_NAME` sind in
beiden Projekten dieselben Werte). `MEDUSA_DB_HOST` ist der **Containername** des
Postgres-Containers (z.B. `life_webapp-db-1`), keine Compose-Service-Alias. Redis läuft
als eigener Container nur für dieses Projekt, auf einem eigenen `internal`-Netzwerk -
goa_webapp nutzt kein Redis und Redis ist von außerhalb dieses Compose-Projekts nicht
erreichbar.

Migrationen laufen nicht automatisch bei jedem Start (vermeidet parallele
Migrationsläufe bei mehreren Replikas) - einmalig nach jedem Deploy mit neuen
Migrationen manuell ausführen:

```bash
docker compose run --rm medusa npx medusa db:migrate
```

Neue Caddy-Blöcke, z.B.:

```caddy
shop-admin.heimfeld.life {
    encode zstd gzip
    reverse_proxy medusa:9000
}
```

Das Admin Dashboard ist dann unter `shop-admin.heimfeld.life/app` erreichbar - diese URL
geht als `MEDUSA_ADMIN_URL` in goa_webapp_shop, für den "Produkte verwalten"-Link in
dessen eigenem (kleinen) Admin-Bereich.

## Offene Punkte

- **Zahlung**: Noch kein Payment-Provider konfiguriert (z.B. das offizielle
  `@medusajs/payment-stripe`-Plugin) - dafür wird ein echtes Stripe-Konto gebraucht.
  Siehe auch goa_webapp_shop's README (`/kasse`-Platzhalter).
- Admin-Login ist komplett unabhängig von goa_webapp's/goa_webapp_shop's eigenem Login -
  kein SSO, bewusst getrennt.
