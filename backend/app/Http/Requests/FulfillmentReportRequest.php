<?php

namespace App\Http\Requests;

use App\Traits\CamelCaseRequestTrait;
use Illuminate\Foundation\Http\FormRequest;

class FulfillmentReportRequest extends FormRequest
{
    use CamelCaseRequestTrait;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'fromDate' => 'sometimes|date',
            'toDate' => 'sometimes|date|after_or_equal:fromDate',
        ];
    }

    /**
     * Normalize dates to today's range when omitted.
     */
    protected function prepareForValidation(): void
    {
        $today = now()->toDateString();

        $this->merge([
            'fromDate' => $this->input('fromDate', $today),
            'toDate' => $this->input('toDate', $today),
        ]);
    }
}
