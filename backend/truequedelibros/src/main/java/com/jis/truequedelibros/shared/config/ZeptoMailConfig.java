package com.jis.truequedelibros.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ZeptoMailConfig {

    @Bean(name = "zeptoMailRestTemplate")
    public RestTemplate zeptoMailRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(10_000);
        return new RestTemplate(factory);
    }

    @Bean(name = "emailRetryTemplate")
    public RetryTemplate emailRetryTemplate() {
        return RetryTemplate.builder()
                .maxAttempts(3)
                .exponentialBackoff(2_000, 2, 10_000)
                .retryOn(RestClientException.class)
                .build();
    }
}
