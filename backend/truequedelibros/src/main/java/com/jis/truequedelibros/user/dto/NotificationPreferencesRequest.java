package com.jis.truequedelibros.user.dto;

import lombok.Data;

@Data
public class NotificationPreferencesRequest {
    private Boolean wishlistNotifyOnMatch;
    private Boolean wishlistNotifyExternalPurchase;
    private Boolean notifyOnNewMessage;
    private Boolean notifyOnBookLike;
}
