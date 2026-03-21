<?php

namespace App\Enums;

enum DeliveryStatus: string
{
    case PENDING = 'pending';
    case PARTIAL = 'partial';
    case DELIVERED = 'delivered';
}
