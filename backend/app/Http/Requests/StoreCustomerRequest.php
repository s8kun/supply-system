<?php

namespace App\Http\Requests;

use App\Traits\CamelCaseRequestTrait;
use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    use CamelCaseRequestTrait;

    /**
     * Accept snake_case confirmation input and map it to camelCase.
     */
    protected function prepareForValidation(): void
    {
        if ($this->filled('password_confirmation') && !$this->filled('passwordConfirmation')) {
            $this->merge([
                'passwordConfirmation' => (string) $this->input('password_confirmation'),
            ]);
        }
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for creating a customer.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email:rfc,dns|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'passwordConfirmation' => 'required|string|same:password',
            'firstName' => 'required|string|max:255',
            'middleName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'phone' => 'required|string|max:20|unique:customers,phone',
            'houseNo' => 'required|string|max:50',
            'streetName' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'zipCode' => 'required|string|max:20',
            'creditLimit' => 'required|numeric|min:0',
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'حقل الاسم مطلوب.',
            'email.required' => 'حقل الايميل مطلوب.',
            'email.unique' => 'حقل الايميل مستخدم مسبقا.',
            'password.required' => 'حقل كلمة المرور مطلوب.',
            'passwordConfirmation.required' => 'حقل تأكيد كلمة المرور مطلوب.',
            'passwordConfirmation.same' => 'تأكيد كلمة المرور غير مطابق.',
            'firstName.required' => 'حقل الاسم الاول مطلوب.',
            'middleName.required' => 'حقل الاسم الاوسط مطلوب.',
            'lastName.required' => 'حقل الاسم الاخير مطلوب.',
            'phone.required' => 'حقل رقم الهاتف مطلوب.',
            'phone.unique' => 'حقل رقم الهاتف مستخدم مسبقا.',
            'houseNo.required' => 'حقل رقم المنزل مطلوب.',
            'streetName.required' => 'حقل اسم الشارع مطلوب.',
            'city.required' => 'حقل المدينة مطلوب.',
            'zipCode.required' => 'حقل الرمز البريدي مطلوب.',
            'creditLimit.required' => 'حقل الحد الائتماني مطلوب.',
        ];
    }
}
