/** Mission Briefing artwork: one banner and a pool of tile images per chapter. */
/* Art per chapter. Tiles cycle through the pool; the banner uses the landscape. */
export const ART: Record<number, { banner: string; pool: string[] }> = {
  0: { banner: "people/lucia_prison_office", pool: ["people/lucia_prison_office", "people/lucia_cell_window"] },
  1: { banner: "art/leonida_keys_landscape", pool: ["places/leonida_keys_1", "people/jason_duval_1", "places/leonida_keys_2", "people/cal_hampton_1", "places/rusty_anchor_bar", "people/brian_heder_1", "places/leonida_keys_3", "people/jason_seaplane", "people/jason_duval_3", "places/leonida_keys_4", "people/lucia_jason_home", "people/cal_hampton_3", "places/seaplane_sunset", "people/brian_heder_3", "places/leonida_keys_5", "people/jason_duval_4", "places/seaplane_keys_bridge", "places/leonida_keys_6"] },
  2: { banner: "art/port_gellhorn_landscape", pool: ["places/port_gellhorn_1", "people/lucia_caminos_1", "places/port_gellhorn_2", "people/lucia_caminos_3", "places/grassrivers_1", "places/port_gellhorn_3", "people/lucia_car_1", "places/port_gellhorn_4", "people/lucia_caminos_5", "places/grassrivers_3", "places/port_gellhorn_5", "places/port_gellhorn_6"] },
  3: { banner: "art/vice_city_landscape", pool: ["places/vice_city_1", "people/drequan_priest_1", "places/vice_city_2", "people/boobie_ike_1", "people/raul_bautista_1", "places/vice_city_3", "people/real_dimez_1", "places/vice_city_4", "people/drequan_priest_3", "people/masked_duo_rifles", "places/vice_city_5", "people/raul_bautista_3", "places/vice_city_7", "people/boobie_ike_3", "places/vice_city_8", "places/vice_city_9"] },
  4: { banner: "art/jason_and_lucia_beach_landscape", pool: ["places/vice_beach_day", "people/jason_lucia_balcony", "places/marina_skyline", "places/palm_tower", "people/jason_ocean_drive", "places/club_jungle_1", "places/beach_aerial", "people/helicopter_hang", "places/catamaran_aerial", "places/vice_city_10"] },
  5: { banner: "art/jason_and_lucia_lock_and_load_landscape", pool: ["places/vice_city_night", "people/jason_lucia_sunset_1", "places/wrecking_ball_tower", "people/jason_lucia_hilltop", "places/vice_city_11", "places/vice_city_12"] },
};
export const img = (p: string) => `/media/${p}.webp`;
export const shotFor = (ch: number, i: number) => { const pool = ART[ch]?.pool ?? ART[3].pool; return pool[i % pool.length]; };
