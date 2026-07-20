SELECT ms.subscription_id, ms.status, v.license_plate FROM monthly_subscriptions ms JOIN vehicles v ON ms.vehicle_id = v.vehicle_id;
