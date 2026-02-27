/**
 * SERVER_URL — switches automatically between local dev and DigitalOcean production.
 *
 * For local development:
 *   Set LOCAL_IP to your machine's Wi-Fi IP (ipconfig → IPv4 Address).
 *
 * For production (DigitalOcean):
 *   Set DO_SERVER_URL to your Droplet/App Platform URL, e.g.
 *   'https://rail-sathi-server-xxxxx.ondigitalocean.app'
 *   (or 'http://<droplet-ip>:3001' for a raw Droplet)
 *   Then flip USE_DO_BACKEND to true below.
 */

const USE_DO_BACKEND = true; // ← flip to true before submitting to hackathon judges

const DO_SERVER_URL  = 'https://rail-sathi-9k8h4.ondigitalocean.app';
const LOCAL_IP       = '10.155.150.53';
const LOCAL_PORT     = 3001;

export const SERVER_URL = USE_DO_BACKEND
  ? DO_SERVER_URL
  : `http://${LOCAL_IP}:${LOCAL_PORT}`;
