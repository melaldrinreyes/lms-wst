<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Address extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'street_address',
        'street_address_2',
        'city',
        'state',
        'postal_code',
        'country',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /**
     * Get the user that owns the address.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full address as a formatted string.
     */
    public function getFullAddressAttribute(): string
    {
        $address = $this->street_address;

        if ($this->street_address_2) {
            $address .= ', ' . $this->street_address_2;
        }

        $address .= ', ' . $this->city;

        if ($this->state) {
            $address .= ', ' . $this->state;
        }

        if ($this->postal_code) {
            $address .= ' ' . $this->postal_code;
        }

        $address .= ', ' . $this->country;

        return $address;
    }

    /**
     * Scope to get primary addresses.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to get addresses by type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
}
