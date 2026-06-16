package com.jis.truequedelibros.user.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GeocodingService {

    private final RestClient restClient = RestClient.builder()
            .baseUrl("https://nominatim.openstreetmap.org")
            .defaultHeader("User-Agent", "TruequeDeLlibros/1.0")
            .build();

    public String reverseGeocode(double lat, double lng) {
        try {
            NominatimResponse response = restClient.get()
                    .uri("/reverse?format=json&lat={lat}&lon={lng}", lat, lng)
                    .retrieve()
                    .body(NominatimResponse.class);

            if (response == null || response.address() == null) return null;

            NominatimAddress addr = response.address();
            if (addr.city() != null)    return addr.city();
            if (addr.town() != null)    return addr.town();
            if (addr.village() != null) return addr.village();
            if (addr.county() != null)  return addr.county();
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private record NominatimResponse(NominatimAddress address) {}
    private record NominatimAddress(String city, String town, String village, String county) {}
}
