/* ═══════════════════════════════════════════════════
   js/services/location.js — Serviço de geolocalização
   Responsável por obter a posição do usuário e
   calcular distâncias entre pontos geográficos.
════════════════════════════════════════════════════ */

App.location = (() => {

  /**
   * Fórmula de Haversine — distância em km entre dois pontos.
   * @param {{lat:number, lng:number}} a
   * @param {{lat:number, lng:number}} b
   * @returns {number} distância em km
   */
  function haversine(a, b) {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const c = sinLat * sinLat +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
  }

  function toRad(deg) { return deg * Math.PI / 180; }

  /**
   * Tenta reverter coordenadas em nome de cidade via API.
   * Em caso de falha, usa fallback local.
   */
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      if (!res.ok) throw new Error('Geocode failed');
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || 'Localização';
      const state = addr.state_code || addr.state || '';
      return { city, state };
    } catch {
      return { city: 'Localização atual', state: '' };
    }
  }

  return {
    haversine,

    /**
     * Solicita permissão e obtém localização do usuário.
     * @returns {Promise<{lat, lng, city, state}>}
     */
    async getLocation() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocalização não suportada neste navegador'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const { city, state } = await reverseGeocode(lat, lng);
            resolve({ lat, lng, city, state });
          },
          (error) => {
            const msgs = {
              1: 'Permissão de localização negada',
              2: 'Localização indisponível',
              3: 'Tempo limite excedido',
            };
            reject(new Error(msgs[error.code] || 'Erro ao obter localização'));
          },
          { timeout: 10000, maximumAge: 300000 }
        );
      });
    },

    /**
     * Filtra e ordena lojas dentro de um raio,
     * retornando-as com a distância calculada.
     * @param {{lat, lng}} userCoords
     * @param {number} radiusKm
     * @returns {object[]} lojas com campo `distance`
     */
    getNearbyStores(userCoords, radiusKm = 5) {
      return App.storesData.list
        .map(store => ({
          ...store,
          distance: haversine(userCoords, store.coords),
        }))
        .filter(store => store.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
    },

    /**
     * Formata distância de forma amigável.
     * @param {number} km
     * @returns {string}
     */
    formatDistance(km) {
      if (km < 1) return `${Math.round(km * 1000)} m`;
      return `${km.toFixed(1)} km`;
    },
  };

})();
