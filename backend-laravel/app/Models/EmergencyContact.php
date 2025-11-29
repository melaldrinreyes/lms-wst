<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyContact extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'relationship',
        'primary_phone',
        'secondary_phone',
        'email',
        'address',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    /**
     * Get the user that owns the emergency contact.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the relationship label.
     */
    public function getRelationshipLabelAttribute(): string
    {
        return ucfirst($this->relationship);
    }

    /**
     * Get the primary phone number (formatted).
     */
    public function getFormattedPrimaryPhoneAttribute(): string
    {
        return $this->formatPhoneNumber($this->primary_phone);
    }

    /**
     * Get the secondary phone number (formatted).
     */
    public function getFormattedSecondaryPhoneAttribute(): string
    {
        return $this->secondary_phone ? $this->formatPhoneNumber($this->secondary_phone) : '';
    }

    /**
     * Format phone number for display.
     */
    private function formatPhoneNumber(string $phone): string
    {
        // Remove all non-numeric characters
        $cleaned = preg_replace('/\D/', '', $phone);

        // Format Philippine numbers (assuming +63 or 09 prefix)
        if (strlen($cleaned) === 10 && str_starts_with($cleaned, '9')) {
            return '+63 ' . substr($cleaned, 0, 3) . ' ' . substr($cleaned, 3, 3) . ' ' . substr($cleaned, 6);
        } elseif (strlen($cleaned) === 12 && str_starts_with($cleaned, '639')) {
            return '+63 ' . substr($cleaned, 2, 3) . ' ' . substr($cleaned, 5, 3) . ' ' . substr($cleaned, 8);
        }

        return $phone; // Return original if format doesn't match
    }

    /**
     * Scope to get primary emergency contacts.
     */
    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to get contacts by relationship.
     */
    public function scopeByRelationship($query, $relationship)
    {
        return $query->where('relationship', $relationship);
    }
}
